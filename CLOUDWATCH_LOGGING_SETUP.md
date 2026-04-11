# CloudWatch Logging Setup Guide

This guide sets up centralized logging for your Django backend. Logging can go to **AWS CloudWatch** (if IAM permissions available) or automatically **falls back to local files** (no permissions needed).

## AWS Academy Note

If you're using **AWS Academy** with restricted IAM permissions, no action needed! The backend will automatically:
1. Try CloudWatch first
2. Fall back to local file logging at `backend/smart_rental/logs/django.log`
3. Logs rotate at 10MB with 5 backups kept

Skip Part 1 if using AWS Academy.

---

## Part 1: IAM Permissions (Skip if AWS Academy)

Your EC2 instance needs IAM permissions to write logs to CloudWatch. Add this **inline policy** to your EC2 IAM role or IAM user:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:log-group:/aws/ec2/smart-rental*"
        }
    ]
}
```

If using EC2 instance profile role:
1. Go to **AWS Console** → **IAM** → **Roles**
2. Find the role attached to your EC2 instance
3. Add inline policy (paste JSON above)

If using IAM user access keys:
- Ensure your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY have these permissions

---

## Part 2A: Django Logging to CloudWatch (Full IAM Access)

### 1. Deploy Django with CloudWatch Enabled

Add these **GitHub Actions secrets**:
- `CLOUDWATCH_LOGGING_ENABLED=true`
- `CLOUDWATCH_LOG_GROUP=smart-rental-backend`
- `CLOUDWATCH_LOG_STREAM=django-app`
- `AWS_REGION=us-east-1` (replace with your region)

On EC2, add to `.env`:
```bash
CLOUDWATCH_LOGGING_ENABLED=true
CLOUDWATCH_LOG_GROUP=smart-rental-backend
CLOUDWATCH_LOG_STREAM=django-app
AWS_REGION=us-east-1
```

### 2. Restart Backend Service

```bash
# On EC2
sudo systemctl restart smart_rental_backend
```

### 3. Verify Django Logs in CloudWatch

1. Go to **AWS Console** → **CloudWatch** → **Log Groups**
2. Click on log group: `smart-rental-backend`
3. Click on log stream: `django-app`
4. Search for errors by prefixing with `ERROR` or `EXCEPTION`

**Log Format:**
```
[2026-04-11 15:30:45] ERROR [django.request:45] Internal Server Error: /api/bookings/
[2026-04-11 15:30:46] DEBUG [bookings.views:compute_price():120] Price calculated: $25.50
```

---

## Part 2B: Django Logging to Local Files (AWS Academy / No IAM Access)

### 1. Deploy Backend

Simply deploy as normal:

```bash
git add .
git commit -m "Add centralized logging"
git push origin main
```

Django will automatically write logs to: `backend/smart_rental/logs/django.log` on EC2.

### 2. View Logs on EC2 (Via SSH)

SSH into EC2 and tail logs in real-time:

```bash
# Live tail (new logs appear as they happen)
sudo tail -f /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log

# View last 100 lines
sudo tail -n 100 /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log

# Search for errors only
sudo grep ERROR /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log

# Search for last 50 errors with context
sudo grep -A 3 ERROR /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log | tail -n 200
```

### 3. Log Rotation

Logs automatically rotate when they reach **10MB** with **5 backups** kept:
- `django.log` (current, <10MB)
- `django.log.1` (previous)
- `django.log.2`, `.3`, `.4`, `.5`
- Oldest files auto-deleted

### 4. Copy Logs to Local Machine (for analysis)

```bash
# From your local terminal
scp -i ~/path/to/ec2-key.pem ubuntu@YOUR_EC2_IP:/home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log ~/Desktop/

# Then analyze locally in editor or with grep
```

---

---

## Part 3: Gunicorn/Systemd Logs to CloudWatch (Optional, Full IAM Access)

To also capture systemd journal logs (Gunicorn startup errors, crashes), set up CloudWatch Logs Agent on EC2.

### Step 1: Install CloudWatch Logs Agent

```bash
# On EC2 (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y awslogs

# Or on Amazon Linux 2:
sudo yum install -y awslogs
```

### Step 2: Configure Agent

Edit `/etc/awslogs/awslogs.conf`:

```ini
[/var/log/syslog]
log_group_name = /aws/ec2/smart-rental-gunicorn
log_stream_name = {instance_id}
datetime_format = %b %d %H:%M:%S
file = /var/log/syslog
buffer_duration = 5000
initial_state = new
log_format = %d %t
```

Or for Amazon Linux, use `/var/log/messages`:

```ini
[/var/log/messages]
log_group_name = /aws/ec2/smart-rental-gunicorn
log_stream_name = {instance_id}
datetime_format = %b %d %H:%M:%S
file = /var/log/messages
buffer_duration = 5000
initial_state = new
log_format = %d %t
```

### Step 3: Start CloudWatch Logs Agent

```bash
sudo systemctl start awslogs
sudo systemctl enable awslogs

# Check status
sudo systemctl status awslogs
```

### Step 4: Verify Gunicorn Logs

1. Go to **AWS Console** → **CloudWatch** → **Log Groups**
2. Click on log group: `/aws/ec2/smart-rental-gunicorn`
3. Search for Gunicorn startup messages or errors

---

## Part 4: CloudWatch Logs Insights (Search & Analyze)

Use **CloudWatch Logs Insights** to query logs across time ranges and filters.

### Query 1: Find All Errors in Last Hour

```
fields @timestamp, @message, levelname
| filter levelname = "ERROR"
| stats count() by @message
```

### Query 2: Find Database Errors

```
fields @timestamp, @message
| filter @message like /django.db.backends/
| stats count() by @message
```

### Query 3: Find Slow API Requests

```
fields @timestamp, funcName, duration
| filter duration > 1000
| sort @timestamp desc
| limit 100
```

### Query 4: Real-Time Tail (Last 5 Minutes)

```
fields @timestamp, levelname, @message
| sort @timestamp desc
| limit 100
```

Access Logs Insights:
1. Go to **CloudWatch** → **Log Groups** → select group
2. Click **"Logs Insights"** tab
3. Paste query and click **"Run query"**

---

## Part 5: CI/CD Configuration

Ensure `.github/workflows/ci-cd-ec2.yml` has:

```yaml
env:
  CLOUDWATCH_LOGGING_ENABLED: true
  CLOUDWATCH_LOG_GROUP: smart-rental-backend
  CLOUDWATCH_LOG_STREAM: django-app
  AWS_REGION: ${{ secrets.AWS_REGION }}

jobs:
  deploy:
    steps:
      - name: Deploy backend on EC2
        uses: appleboy/ssh-action@v1.2.0
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ${{ secrets.EC2_USER }}
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            export CLOUDWATCH_LOGGING_ENABLED=${{ env.CLOUDWATCH_LOGGING_ENABLED }}
            export CLOUDWATCH_LOG_GROUP=${{ env.CLOUDWATCH_LOG_GROUP }}
            export CLOUDWATCH_LOG_STREAM=${{ env.CLOUDWATCH_LOG_STREAM }}
            export AWS_REGION=${{ env.AWS_REGION }}
            # ... rest of deploy script
```

---

## Part 6: Troubleshooting

### CloudWatch Logs Not Appearing

1. **Check IAM permissions:**
   ```bash
   aws logs describe-log-groups --region us-east-1
   ```
   Should show your log group.

2. **Check Django logs locally:**
   ```bash
   sudo journalctl -u smart_rental_backend -n 50
   ```
   If no errors there, CloudWatch might have failed silently.

3. **Check watchtower import:**
   ```bash
   cd /opt/smart_rental/venv && source bin/activate
   python -c "import watchtower; print('OK')"
   ```
   If ImportError, run: `pip install watchtower`

4. **Enable debug in settings:**
   ```python
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

### High CloudWatch Costs

If log volume is too high:
- Reduce `DEBUG` level to `INFO` or `WARNING` for production
- Increase `log_retention` in CloudWatch (default: never expire)

```bash
# Set retention to 7 days via AWS CLI
aws logs put-retention-policy \
  --log-group-name smart-rental-backend \
  --retention-in-days 7
```

### Gunicorn Logs Not Appearing (Agent)

1. Check agent is running:
   ```bash
   sudo systemctl status awslogs
   ```

2. Check agent config:
   ```bash
   sudo tail -n 50 /var/log/awslogs.log
   ```

3. Restart agent:
   ```bash
   sudo systemctl restart awslogs
   ```

---

## Part 7: Example: Debugging a Failed Login

**Scenario:** User reports login is returning 500 error.

**Steps:**
1. Go to CloudWatch → Logs Insights
2. Run query:
   ```
   fields @timestamp, @message
   | filter @message like /LoginView|500|error/i
   | sort @timestamp desc
   | limit 20
   ```
3. Find the error message with stack trace
4. Identify root cause (e.g., SNS connection timeout, DB error)
5. Fix and redeploy

---

## Summary

| Component | Logs | Access |
|-----------|------|--------|
| Django app errors | `smart-rental-backend` log group | CloudWatch → Log Groups |
| Gunicorn startup | `/aws/ec2/smart-rental-gunicorn` | CloudWatch → Log Groups |
| Query/search | All logs | CloudWatch → Logs Insights |
| Real-time tail | All logs | CloudWatch → Log Groups → stream → refresh |

**Next Steps:**
1. ✅ Add watchtower to requirements (done)
2. ✅ Configure Django LOGGING settings (done)
3. 🔄 Deploy backend with `CLOUDWATCH_LOGGING_ENABLED=true`
4. 🔄 (Optional) Set up Gunicorn agent on EC2
5. ✅ View logs in CloudWatch console
