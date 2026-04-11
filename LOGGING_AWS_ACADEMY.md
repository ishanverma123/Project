# Logging for AWS Academy Users (No IAM Access)

Since AWS Academy restricts IAM role modifications, your backend will **automatically fall back to local file-based logging** if CloudWatch isn't accessible.

## Quick Start

### 1. Deploy Backend (Nothing Special Needed)

```bash
git add .
git commit -m "Add logging system"
git push origin main
```

The CI/CD will deploy as normal. Django will automatically write logs to:
```
/home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log
```

### 2. View Logs on EC2 (SSH)

Connect to your EC2 instance and tail logs in real-time:

```bash
# Live tail (shows new logs as they appear)
ssh -i ~/path/to/ec2-key.pem ubuntu@YOUR_EC2_IP
sudo tail -f /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log

# Press Ctrl+C to stop
```

### 3. Find Specific Errors

```bash
# All errors in log file
sudo grep ERROR /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log

# Show last 50 error lines with 2 lines of context after
sudo grep -A 2 ERROR /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log | tail -n 100

# Find login errors
sudo grep -i "login\|auth" /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log | tail -n 20

# Find database errors
sudo grep -i "database\|db\|connection" /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log | tail -n 20

# Find SNS/notification errors
sudo grep -i "sns\|notification\|boto" /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log | tail -n 20
```

### 4. Copy Full Log to Local Machine

```bash
# From your local terminal (not SSH)
scp -i ~/path/to/ec2-key.pem ubuntu@YOUR_EC2_IP:/home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log ~/Desktop/django.log

# Then open in VS Code or text editor for analysis
```

---

## Log Format

Example log entry:
```
[2026-04-11 15:30:45] ERROR [django.request:45] Internal Server Error: /api/bookings/
[2026-04-11 15:30:46] DEBUG [bookings.views:compute_price():120] Price calculated: $25.50
[2026-04-11 15:30:47] WARNING [users.views:LoginView:89] Login attempt from 192.168.1.1
```

- `[2026-04-11 15:30:45]` = timestamp
- `ERROR` / `WARNING` / `DEBUG` = log level
- `[module:function():line]` = where the log came from
- Rest = the actual message

---

## Common Commands

| Task | Command |
|------|---------|
| View last 100 lines | `sudo tail -n 100 /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Real-time tail | `sudo tail -f /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Count total lines | `sudo wc -l /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Find all errors | `sudo grep ERROR /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Find alerts | `sudo grep CRITICAL /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Find by module | `sudo grep "bookings" /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Find by time | `sudo grep "15:30" /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log` |
| Clear old logs | `sudo rm /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log.*` |

---

## Log Rotation

Logs automatically rotate when they reach **10MB** to save disk space:

- `django.log` = current log (< 10MB)
- `django.log.1` = previous log
- `django.log.2`, `.3`, `.4`, `.5` = older logs
- Oldest files auto-deleted

On a busy system:
- Each log file = ~10MB = ~1-2 hours of logs
- 5 files total = ~5-10 hours of logs retained

---

## Troubleshooting

### Logs Directory Not Found

If `/home/ubuntu/CPP-Project1/backend/smart_rental/logs/` doesn't exist:

```bash
# Create it manually
ssh ubuntu@YOUR_EC2_IP
sudo mkdir -p /home/ubuntu/CPP-Project1/backend/smart_rental/logs
sudo chown ubuntu:ubuntu /home/ubuntu/CPP-Project1/backend/smart_rental/logs
```

### Permission Denied When Viewing Logs

If you get `Permission denied: logs/django.log`:

```bash
# Use sudo to view
sudo tail -n 50 /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log

# Or change permissions (less secure)
sudo chmod 644 /home/ubuntu/CPP-Project1/backend/smart_rental/logs/django.log
```

### Logs Getting Too Large

If `django.log` is > 1GB and slowing down your system:

```bash
# Delete old backups (keeps only last 2 weeks)
sudo find /home/ubuntu/CPP-Project1/backend/smart_rental/logs/ -name "django.log.*" -mtime +14 -delete
```

Or limit rotation size in code (currently set to 10MB):
- Edit `backend/smart_rental/smart_rental/settings.py`
- Find `maxBytes` parameter and reduce (e.g., `5242880` for 5MB)

---

## Upgrading to CloudWatch Later

If you get full IAM access later (not AWS Academy):

1. Add GitHub secrets:
   ```
   CLOUDWATCH_LOGGING_ENABLED=true
   CLOUDWATCH_LOG_GROUP=smart-rental-backend
   CLOUDWATCH_LOG_STREAM=django-app
   ```

2. Redeploy backend

3. Logs will go to both CloudWatch AND local file

No code changes needed!

---

## See Also

- [CLOUDWATCH_LOGGING_SETUP.md](CLOUDWATCH_LOGGING_SETUP.md) — Full setup for non-Academy users
- [CLOUDWATCH_LOGS_QUICK_REFERENCE.md](CLOUDWATCH_LOGS_QUICK_REFERENCE.md) — Query syntax and examples
