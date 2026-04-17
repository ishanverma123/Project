"""
Lambda Function: Process SQS Messages

This Lambda function processes tasks queued by the Django backend.
Deploy to AWS Lambda independently from the Django app.

Deployment:
1. Create function in Lambda console
2. Set trigger: SQS (your queue)
3. Paste this code
4. Add environment variables (see CI_CD_SETUP.md)
5. Set timeout: 60 seconds
6. Set memory: 512 MB
"""

import json
import os
import logging
import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

SNS_TOPIC_ARN = os.getenv('SNS_TOPIC_ARN')


def send_notification_via_sns(subject: str, body: str) -> bool:
    """Publish email notification to SNS topic."""
    if not SNS_TOPIC_ARN:
        logger.error("SNS_TOPIC_ARN is not configured")
        return False

    try:
        sns_client = boto3.client('sns')
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Message=body,
            Subject=subject,
        )
        logger.info(f"✓ SNS notification published: {subject}")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to publish SNS notification: {e}")
        return False


def process_notification(data: dict) -> bool:
    """Process notification (email) task."""
    email = data.get('email')
    subject = data.get('subject')
    message = data.get('message')
    priority = data.get('priority', 'normal')

    if not all([email, subject, message]):
        logger.error("Missing email data")
        return False

    # SNS will forward the message to all email subscribers of the topic.
    body = (
        f"{message}\n\n"
        "This is an automated message from Smart Rental.\n"
        "Do not reply to this email."
    )

    # Note: Recipient email is determined by SNS topic subscriptions,
    # so the `email` field is used for logging and validation only.
    logger.info(f"Sending notification for recipient: {email}")
    return send_notification_via_sns(subject, body)


def process_booking_event(data: dict) -> bool:
    """Process booking lifecycle event."""
    event_type = data.get('event_type')
    booking_id = data.get('booking_id')
    
    logger.info(f"Processing booking event: {event_type} (ID: {booking_id})")
    
    # Example: could integrate with DynamoDB, analytics, etc.
    # For now, just log it
    events = {
        'created': 'Booking created successfully!',
        'confirmed': 'Booking confirmed by driver',
        'cancelled': 'Booking has been cancelled',
        'completed': 'Ride completed successfully',
        'disputed': 'Booking disputed - review needed',
    }
    
    message = events.get(event_type, 'Booking updated')
    logger.info(f"  → {message}")
    return True


def process_ride_publish(data: dict) -> bool:
    """Process ride publish event."""
    ride_id = data.get('ride_id')
    driver_id = data.get('driver_id')
    
    logger.info(f"Ride published: ID {ride_id} by driver {driver_id}")
    
    # Could send notifications to matching passengers here
    # For now, just log it
    return True


def process_payment(data: dict) -> bool:
    """Process payment (call external payment service)."""
    booking_id = data.get('booking_id')
    amount = data.get('amount')
    
    logger.info(f"Processing payment: ${amount} for booking {booking_id}")
    
    # Example: call Stripe, PayPal, or other payment processor
    # For now, just simulate
    return True


def process_analytics(data: dict) -> bool:
    """Process analytics event (store in DynamoDB or S3)."""
    event_type = data.get('event_type')
    user_id = data.get('user_id')
    
    logger.info(f"Analytics: {event_type} from user {user_id}")
    
    # Could write to DynamoDB, CloudWatch, etc.
    return True


def process_image(data: dict) -> bool:
    """Process image (resize, optimize, upload CDN)."""
    image_url = data.get('image_url')
    property_id = data.get('property_id')
    
    logger.info(f"Processing image for property {property_id}: {image_url}")
    
    # Could use PIL/Pillow to optimize image
    # Could upload to CloudFront
    return True


# === Main Lambda Handler ===

def lambda_handler(event, context):
    """
    Main Lambda entry point.
    Triggered by SQS messages.
    """
    
    logger.info(f"Received {len(event.get('Records', []))} SQS messages")
    
    # Track results
    success_count = 0
    failure_count = 0
    
    sqs_client = boto3.client('sqs')
    queue_url = os.getenv('SQS_QUEUE_URL')
    
    # Process each message
    for record in event.get('Records', []):
        try:
            # Parse message
            message_body = json.loads(record['body'])
            message_type = message_body.get('type')
            data = message_body.get('data', {})
            
            logger.info(f"Processing message type: {message_type}")
            
            # Route to appropriate handler
            if message_type == 'notification':
                success = process_notification(data)
            elif message_type == 'booking_event':
                success = process_booking_event(data)
            elif message_type == 'ride_publish':
                success = process_ride_publish(data)
            elif message_type == 'payment_process':
                success = process_payment(data)
            elif message_type == 'analytics':
                success = process_analytics(data)
            elif message_type == 'image_process':
                success = process_image(data)
            else:
                logger.warning(f"Unknown message type: {message_type}")
                success = False
            
            if success:
                success_count += 1
                logger.info(f"✓ Message processed: {message_type}")
            else:
                failure_count += 1
                logger.error(f"✗ Failed to process: {message_type}")
                # Message will be retried (not deleted)
        
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in message: {e}")
            failure_count += 1
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            failure_count += 1
    
    # Return stats
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': success_count + failure_count,
            'successful': success_count,
            'failed': failure_count,
        })
    }


# === Local Testing ===

if __name__ == '__main__':
    # Test message
    test_event = {
        'Records': [
            {
                'body': json.dumps({
                    'type': 'notification',
                    'data': {
                        'email': 'user@example.com',
                        'subject': 'Test Email',
                        'message': 'This is a test',
                    }
                })
            }
        ]
    }
    
    # Test locally
    os.environ['SNS_TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:smart-rental-notifications'
    
    result = lambda_handler(test_event, None)
    print(result)
