# CloudWatch Logs Quick Reference

## Accessing Logs

### Via AWS Console (Easiest)

1. **Go to CloudWatch Dashboard**
   - Open [AWS Console](https://console.aws.amazon.com/)
   - Search for "CloudWatch" → click **CloudWatch**
   - Left sidebar → **Log groups**

2. **Find Your Log Groups**
   - `smart-rental-backend` → Django application logs
   - `/aws/ec2/smart-rental-gunicorn` → Gunicorn systemd logs (if agent installed)

3. **View Logs**
   - Click on log group
   - Click on **Log stream** (e.g., `django-app`)
   - Scroll through real-time or past logs
   - Use **"Search log group"** to filter by keyword

---

## Common Searches

### Find All Errors (Quick Copy-Paste)

1. Click on log group
2. Click **"Logs Insights"** tab
3. Paste query:
```
fields @timestamp, @message
| filter levelname = "ERROR" or @message like /Error|Exception/
| sort @timestamp desc
| limit 50
```
4. Click **"Run query"**

### Find Database Connection Errors

```
fields @timestamp, @message
| filter @message like /connection|timeout|db|database/i
| sort @timestamp desc
| limit 50
```

### Find Authentication/Login Errors

```
fields @timestamp, @message
| filter @message like /LoginView|auth|401|403|permission/i
| sort @timestamp desc
| limit 50
```

### Find SNS/Notification Errors

```
fields @timestamp, @message
| filter @message like /SNS|notification|boto3|aws/i
| sort @timestamp desc
| limit 50
```

### Find Booking/Properties Errors

```
fields @timestamp, @message, funcName
| filter @message like /booking|property|ride/i and levelname = "ERROR"
| sort @timestamp desc
| limit 50
```

### Real-Time Tail (Last 100 Lines)

```
fields @timestamp, levelname, @message
| sort @timestamp desc
| limit 100
```

### Count Errors by Type (Statistics)

```
fields levelname, @message
| filter levelname = "ERROR"
| stats count() as error_count by @message
| sort error_count desc
```

---

## Log Format Explained

Example log line:
```
[2026-04-11 15:30:45] ERROR [django.request:45] Internal Server Error: /api/bookings/
```

- `[2026-04-11 15:30:45]` = timestamp
- `ERROR` = log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `[django.request:45]` = logger name and line number
- Rest = log message

---

## Filtering Tips

### Filter by Log Level

```
fields @timestamp, @message
| filter levelname = "DEBUG"
```

Options: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`

### Filter by Time Range

Logs Insights shows dropdown at top-right. Common filters:
- **Last 5 minutes** - Real-time debugging
- **Last 1 hour** - Session errors
- **Last 24 hours** - Daily issues
- **Custom** - Specific date range

### Filter by Module

Django modules:
- `django.request` - HTTP request errors
- `django.db.backends` - Database errors
- `properties` - Ride/property creation errors
- `bookings` - Booking/negotiation errors
- `users` - Auth/registration errors
- `smart_rental` - Core app errors

Example:
```
fields @timestamp, @message
| filter @message like /bookings/
| sort @timestamp desc
```

---

## Performance: Response Time Analysis

If users report slow login/booking:

```
fields @timestamp, duration, endpoint
| filter duration > 1000
| sort duration desc
| limit 20
```

Look for:
- SNS calls hanging (check if `SNS_NOTIFICATIONS_ENABLED=false`)
- Database queries taking >500ms
- External API timeouts

---

## Debugging Workflow

1. **User reports error** → Copy timestamp
2. **Search log group** with timestamp range (±5 minutes)
3. **Find ERROR/exception** in that range
4. **Read full message** including stack trace
5. **Identify root cause** (DB error? SNS timeout? Auth issue?)
6. **Fix code** and redeploy
7. **Verify fix** by checking logs after deploy

---

## CloudWatch Costs

Each log entry costs ~$0.50 per million (very cheap). However:

**Reduce volume if needed:**
- Set `DJANGO_DEBUG=false` in production (fewer logs)
- Change logger level from `DEBUG` to `INFO` or `WARNING`
- Set log retention: `Manage log group settings` → 7 days (auto-deletes old logs) → saves storage costs

**Current setup (DEBUG level):**
- ~10,000 logs/hour = ~$0.005/month (negligible)
- 1 year retention = ~$0.10/month
- Once you scale to 100k logs/hour → ~$0.05/month

---

## Exporting Logs

### Export to CSV (for analysis)

1. Run query in Logs Insights
2. Click **"Export results"** → CSV
3. Use Excel/Python for analysis

### Export to S3 (for backup)

1. Go to Log group → **"Export data"**
2. Choose date range
3. Select S3 bucket
4. CloudWatch creates logs export in S3

---

## Integrations (Optional Future Work)

- **CloudWatch Alarms**: Send SNS/email when errors spike
- **CloudWatch Dashboards**: Pin custom graphs (error rate, response time)
- **Datadog/New Relic**: Ingest CloudWatch logs for APM
- **Splunk**: Stream to Splunk for enterprise logging

---

## Quick Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| No logs appearing | CloudWatch disabled | Set `CLOUDWATCH_LOGGING_ENABLED=true` and redeploy |
| Old logs disappearing | Retention set to low value | Increase retention in `Manage log group settings` |
| Logs lagging | Network issue | Check EC2 IAM permissions for `logs:PutLogEvents` |
| Can't see queries | Feature disabled | Upgrade to CloudWatch Logs Insights plan (free tier has limited queries) |

---

## Need Help?

- **Django logging docs**: https://docs.djangoproject.com/en/4.2/topics/logging/
- **CloudWatch docs**: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/
- **Logs Insights query syntax**: https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html
