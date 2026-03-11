# S3 Media Storage Setup

This project now supports storing uploaded media (like property images) in S3.

## 1) Install dependencies

```bash
pip install django-storages boto3
```

## 2) Set environment variables

```bash
export USE_S3=true
export AWS_ACCESS_KEY_ID=your_access_key_id
export AWS_SECRET_ACCESS_KEY=your_secret_access_key
# Required only if you are using temporary credentials (ASIA... keys)
export AWS_SESSION_TOKEN=your_session_token
export AWS_STORAGE_BUCKET_NAME=your_bucket_name
export AWS_S3_REGION_NAME=us-east-1
# Optional: CloudFront or custom S3 domain
# export AWS_S3_CUSTOM_DOMAIN=cdn.example.com
```

## 3) Start backend

Run Django normally. New uploaded property images will be stored in S3, and the `image` field in the database will store only the file key/path.

## Notes

- If `USE_S3` is not `true`, the app falls back to local `media/` storage.
- Existing local media files are not automatically migrated to S3.
