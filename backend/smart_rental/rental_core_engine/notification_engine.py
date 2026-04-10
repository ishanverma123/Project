import hashlib
import logging
import os
import re
from typing import Iterable, Optional

import boto3


logger = logging.getLogger(__name__)


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


class NotificationEngine:
    def __init__(self):
        self.enabled = _env_bool('SNS_NOTIFICATIONS_ENABLED', False)
        self.region_name = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or os.getenv('AWS_S3_REGION_NAME')
        self.broadcast_topic_arn = os.getenv('SNS_BROADCAST_TOPIC_ARN', '').strip()
        self.user_topic_prefix = os.getenv('SNS_USER_TOPIC_PREFIX', 'smart-rental-user')
        self._client = None
        self._user_topic_cache = {}

    @property
    def client(self):
        if self._client is None:
            kwargs = {}
            if self.region_name:
                kwargs['region_name'] = self.region_name
            self._client = boto3.client('sns', **kwargs)
        return self._client

    def _safe_topic_name(self, email: str) -> str:
        local = re.sub(r'[^a-zA-Z0-9_-]+', '-', email.lower())
        digest = hashlib.sha1(email.lower().encode('utf-8')).hexdigest()[:10]
        base = f"{self.user_topic_prefix}-{local}"[:210]
        return f"{base}-{digest}"

    def _get_or_create_user_topic(self, email: str) -> Optional[str]:
        key = email.lower().strip()
        if not key:
            return None

        cached = self._user_topic_cache.get(key)
        if cached:
            return cached

        response = self.client.create_topic(Name=self._safe_topic_name(key))
        topic_arn = response.get('TopicArn')
        if topic_arn:
            self._user_topic_cache[key] = topic_arn
        return topic_arn

    def _has_email_subscription(self, topic_arn: str, email: str) -> bool:
        next_token = None
        normalized = email.lower().strip()

        while True:
            params = {'TopicArn': topic_arn}
            if next_token:
                params['NextToken'] = next_token
            result = self.client.list_subscriptions_by_topic(**params)
            for sub in result.get('Subscriptions', []):
                if sub.get('Protocol') == 'email' and sub.get('Endpoint', '').lower().strip() == normalized:
                    return True
            next_token = result.get('NextToken')
            if not next_token:
                return False

    def _ensure_email_subscription(self, topic_arn: str, email: str) -> None:
        if self._has_email_subscription(topic_arn, email):
            return
        self.client.subscribe(
            TopicArn=topic_arn,
            Protocol='email',
            Endpoint=email,
            ReturnSubscriptionArn=True,
        )

    def _publish_to_topic(self, topic_arn: str, subject: str, message: str) -> bool:
        self.client.publish(
            TopicArn=topic_arn,
            Subject=subject[:100],
            Message=message,
        )
        return True

    def notify_user(self, user, subject: str, message: str) -> bool:
        if not self.enabled:
            return False
        email = getattr(user, 'email', '') if user is not None else ''
        if not email:
            return False

        try:
            topic_arn = self._get_or_create_user_topic(email)
            if not topic_arn:
                return False
            self._ensure_email_subscription(topic_arn, email)
            return self._publish_to_topic(topic_arn, subject, message)
        except Exception as exc:
            logger.warning('SNS notify_user failed for %s: %s', email, exc)
            return False

    def notify_users(self, users: Iterable, subject: str, message: str) -> int:
        sent = 0
        for user in users:
            if self.notify_user(user, subject, message):
                sent += 1
        return sent

    def notify_broadcast(self, subject: str, message: str) -> bool:
        if not self.enabled or not self.broadcast_topic_arn:
            return False
        try:
            return self._publish_to_topic(self.broadcast_topic_arn, subject, message)
        except Exception as exc:
            logger.warning('SNS notify_broadcast failed: %s', exc)
            return False