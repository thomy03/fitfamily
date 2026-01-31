#!/bin/bash
# Cron script for FitFamily meal reminders
curl -s -X POST https://fitfamily.46-225-58-233.sslip.io/api/push/send \
  -H "Authorization: Bearer fitfamily-cron" \
  -H "Content-Type: application/json" \
  >> /var/log/fitfamily-notifications.log 2>&1
echo " - $(date)" >> /var/log/fitfamily-notifications.log
