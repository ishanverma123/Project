# CI/CD Setup (GitHub Actions -> EC2)

This repo includes `.github/workflows/ci-cd-ec2.yml`.

Pipeline behavior on every push to `main`:
1. Runs frontend CI (`npm ci`, `npm run lint`, `npm run build`).
2. SSHes into EC2.
3. Resets EC2 repo to `origin/main`.
4. Runs backend migrations and restarts gunicorn service.
5. Builds frontend and publishes `dist/` to your web root.

## 1) Add GitHub repository secrets

In GitHub: `Repo -> Settings -> Secrets and variables -> Actions -> New repository secret`

Required secrets:
- `EC2_HOST`: EC2 public DNS or IP (example: `ec2-xx-xx-xx-xx.compute-1.amazonaws.com`)
- `EC2_USER`: SSH user (often `ubuntu`)
- `EC2_SSH_KEY`: private key content (full PEM text)
- `EC2_APP_DIR`: absolute path where this repo exists on EC2 (example: `/home/ubuntu/CPP-Project1`)
- `BACKEND_SERVICE_NAME`: systemd service name for gunicorn (example: `gunicorn` or `smart-rental`)
- `FRONTEND_DEPLOY_DIR`: nginx-served directory for frontend build output (example: `/var/www/html`)

Required backend app/config secrets:
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG` (recommended: `false` in production)
- `DJANGO_ALLOWED_HOSTS` (comma-separated, example: `yourdomain.com,3.221.54.164`)

Required database secrets:
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

Required when using S3 media storage (`USE_S3=true`):
- `USE_S3`: set to `true` or `1`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_STORAGE_BUCKET_NAME`
- `AWS_S3_REGION_NAME`

Optional S3 secrets:
- `AWS_SESSION_TOKEN` (needed for temporary STS credentials)
- `AWS_S3_CUSTOM_DOMAIN` (CloudFront/custom media domain)

Optional secret:
- `PYTHON_VENV_PATH`: absolute path to Python virtualenv (example: `/home/ubuntu/venvs/smart-rental`)

## 2) One-time EC2 prerequisites

Run these once on EC2:

```bash
cd /home/ubuntu/CPP-Project1

# Ensure remote exists and points to your GitHub repo
git remote -v

# Node + npm must exist for frontend build
node -v
npm -v

# rsync is used to publish frontend dist
rsync --version

# backend service must be manageable with systemctl
sudo systemctl status <your-backend-service-name>
```

Notes:
- During each deploy, workflow writes Django, database, and AWS secrets into `backend/smart_rental/.env` on EC2.
- `settings.py` already reads that `.env`, so backend picks up updated S3 values automatically.
- Workflow now auto-installs `nodejs` and `npm` on EC2 if missing before frontend build.
- Backend has `STATIC_ROOT` configured, so `collectstatic` can run safely in production.

## 3) Sudo permissions needed by workflow

Your EC2 user needs passwordless sudo for these commands used by deploy:
- `systemctl restart <BACKEND_SERVICE_NAME>`
- `mkdir -p <FRONTEND_DEPLOY_DIR>`
- `rsync` into `<FRONTEND_DEPLOY_DIR>`

If sudo asks password, workflow will fail.

## 4) Trigger deployment

Push to `main`:

```bash
git add .
git commit -m "your message"
git push origin main
```

Then check Actions tab for `CI/CD to EC2` run logs.

## 5) Common issues

- `EC2_APP_DIR secret is required`: add missing secret.
- `systemctl restart failed`: wrong `BACKEND_SERVICE_NAME` or sudo permission issue.
- frontend not updating: verify `FRONTEND_DEPLOY_DIR` matches your nginx root.
- migrations failing: backend `.env` or DB credentials on EC2 need correction.

## Optional: Deploy only changed parts

Current workflow deploys both backend and frontend each run for reliability.
If you want, we can split jobs by changed paths to speed up deploys.
