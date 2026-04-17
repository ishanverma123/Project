# backend/smart_rental/rental_core_engine/queue_engine.py
"""
SQS Queue Engine for asynchronous task processing.

Decouples long-running tasks from HTTP requests:
- Backend sends task to SQS queue (fast)
- Lambda/worker processes message asynchronously (background)
- User gets instant response (no blocking)

Usage:
    from rental_core_engine.queue_engine import QueueEngine
    queue = QueueEngine()
    
    # Queue a notification
    queue.queue_notification(
        user_email="user@example.com",
        subject="Booking confirmed",
        message="Your ride is booked!"
    )
    
    # Queue a booking task
    queue.queue_booking_event(
        event_type="booking_created",
        booking_id=123,
        driver_id=5,
        passenger_id=10
    )
"""

import json
import os
import logging
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

logger = logging.getLogger(__name__)


class QueueEngine:
    """SQS Queue wrapper for async task processing."""
    
    def __init__(self):
        """Initialize SQS client with AWS credentials from environment."""
        # Queue configuration from environment
        self.enabled = self._env_bool('SQS_ENABLED', False)
        self.queue_url = os.getenv(
            'SQS_QUEUE_URL',
            'https://sqs.us-east-1.amazonaws.com/123456789/smart-rental-tasks'
        )
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        
        # Initialize SQS client only if enabled
        self.client = None
        if self.enabled:
            try:
                # Configure boto3 with timeouts
                config = Config(
                    connect_timeout=2,
                    read_timeout=3,
                    retries={'max_attempts': 1, 'mode': 'standard'},
                    region_name=self.region,
                )
                self.client = boto3.client('sqs', config=config)
                logger.info(f"✓ SQS client initialized. Queue: {self.queue_url}")
            except Exception as e:
                logger.error(f"✗ Failed to initialize SQS: {e}")
                self.enabled = False

    @staticmethod
    def _env_bool(name: str, default: bool = False) -> bool:
        """Parse boolean environment variable."""
        value = os.getenv(name, '')
        return value.strip().lower() in {'1', 'true', 'yes', 'on'}

    def _send_message(self, message_type: str, data: Dict[str, Any], 
                     group_id: Optional[str] = None) -> bool:
        """
        Send message to SQS queue.
        
        Args:
            message_type: Type of task (notification, booking, etc.)
            data: Task data payload
            group_id: For FIFO queues (optional)
        
        Returns:
            True if sent successfully, False otherwise
        """
        if not self.enabled or not self.client:
            logger.debug(f"SQS disabled. Message not queued: {message_type}")
            return False
        
        try:
            message_body = {
                'type': message_type,
                'data': data,
            }
            
            params = {
                'QueueUrl': self.queue_url,
                'MessageBody': json.dumps(message_body),
            }
            
            # For FIFO queues, add group ID
            if group_id:
                params['MessageGroupId'] = group_id
            
            response = self.client.send_message(**params)
            message_id = response.get('MessageId', 'unknown')
            logger.debug(f"✓ Message queued: {message_type} (ID: {message_id})")
            return True
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            logger.error(
                f"✗ Failed to send {message_type} to SQS: {error_code} "
                f"(Request throttled? Try again later)"
            )
            return False
        except Exception as e:
            logger.error(f"✗ Unexpected error sending to SQS: {e}")
            return False

    # === Task-Specific Queuing Methods ===

    def queue_notification(self, user_email: str, subject: str, 
                          message: str, priority: str = 'normal') -> bool:
        """Queue a user notification email."""
        data = {
            'email': user_email,
            'subject': subject,
            'message': message,
            'priority': priority,
        }
        return self._send_message('notification', data, group_id=user_email)

    def queue_booking_event(self, event_type: str, booking_id: int, 
                           driver_id: int, passenger_id: int, 
                           **kwargs) -> bool:
        """
        Queue a booking lifecycle event.
        
        Args:
            event_type: created, confirmed, cancelled, completed, disputed
            booking_id: ID of booking
            driver_id: ID of driver
            passenger_id: ID of passenger
        """
        data = {
            'event_type': event_type,
            'booking_id': booking_id,
            'driver_id': driver_id,
            'passenger_id': passenger_id,
            **kwargs  # Any extra fields (price, reason, etc.)
        }
        # Use booking_id as group for FIFO consistency
        return self._send_message('booking_event', data, 
                                 group_id=f"booking-{booking_id}")

    def queue_ride_publish(self, ride_id: int, driver_id: int, 
                          route: str, **kwargs) -> bool:
        """Queue a ride publish event."""
        data = {
            'ride_id': ride_id,
            'driver_id': driver_id,
            'route': route,
            **kwargs
        }
        return self._send_message('ride_publish', data, 
                                 group_id=f"ride-{ride_id}")

    def queue_payment_processing(self, booking_id: int, amount: float, 
                                driver_id: int, passenger_id: int) -> bool:
        """Queue payment processing task."""
        data = {
            'booking_id': booking_id,
            'amount': amount,
            'driver_id': driver_id,
            'passenger_id': passenger_id,
        }
        return self._send_message('payment_process', data, 
                                 group_id=f"payment-{booking_id}")

    def queue_analytics_event(self, event_type: str, user_id: int, 
                             **kwargs) -> bool:
        """Queue analytics/tracking event."""
        data = {
            'event_type': event_type,
            'user_id': user_id,
            **kwargs
        }
        # Analytics can be out-of-order, so no group_id needed
        return self._send_message('analytics', data)

    def queue_image_processing(self, image_url: str, property_id: int, 
                              image_type: str = 'property') -> bool:
        """Queue image processing task."""
        data = {
            'image_url': image_url,
            'property_id': property_id,
            'image_type': image_type,
        }
        return self._send_message('image_process', data, 
                                 group_id=f"property-{property_id}")

    # === Message Retrieval (for background workers) ===

    def receive_messages(self, max_messages: int = 1, 
                        visibility_timeout: int = 300) -> list:
        """
        Receive messages from queue (used by Lambda/worker).
        
        Args:
            max_messages: Number of messages to fetch (1-10)
            visibility_timeout: Seconds message is hidden from other receivers
        
        Returns:
            List of message dicts with ReceiptHandle, Body, etc.
        """
        if not self.enabled or not self.client:
            return []
        
        try:
            response = self.client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                VisibilityTimeout=visibility_timeout,
                WaitTimeSeconds=0,  # Short polling (immediate return)
            )
            return response.get('Messages', [])
        except Exception as e:
            logger.error(f"Failed to receive messages: {e}")
            return []

    def delete_message(self, receipt_handle: str) -> bool:
        """Delete message after successful processing."""
        if not self.enabled or not self.client:
            return False
        
        try:
            self.client.delete_message(
                QueueUrl=self.queue_url,
                ReceiptHandle=receipt_handle,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete message: {e}")
            return False

    # === Utility Methods ===

    def get_queue_stats(self) -> Dict[str, Any]:
        """Get queue approximate message count and other stats."""
        if not self.enabled or not self.client:
            return {}
        
        try:
            response = self.client.get_queue_attributes(
                QueueUrl=self.queue_url,
                AttributeNames=['All'],
            )
            attrs = response.get('Attributes', {})
            return {
                'messages_available': int(attrs.get('ApproximateNumberOfMessages', 0)),
                'messages_in_flight': int(attrs.get('ApproximateNumberOfMessagesNotVisible', 0)),
                'messages_delayed': int(attrs.get('ApproximateNumberOfMessagesDelayed', 0)),
            }
        except Exception as e:
            logger.error(f"Failed to get queue stats: {e}")
            return {}

    def purge_queue(self) -> bool:
        """Delete all messages from queue (useful for testing)."""
        if not self.enabled or not self.client:
            return False
        
        try:
            self.client.purge_queue(QueueUrl=self.queue_url)
            logger.warning("Queue purged!")
            return True
        except Exception as e:
            logger.error(f"Failed to purge queue: {e}")
            return False
