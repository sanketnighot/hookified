# Webhook Trigger Guide

## Overview

Webhook triggers allow external services to trigger your hooks by making HTTP requests to auto-generated endpoints. This guide covers how to create, configure, and use webhook-triggered hooks in Hookified.

## What are Webhook Triggers?

Webhook triggers enable real-time automation by allowing external services to notify your hooks when specific events occur. When you create a webhook-triggered hook, Hookified automatically generates:

- A unique webhook URL endpoint
- A secure secret for authentication
- Request validation and processing

## Creating a Webhook Hook

### Step 1: Choose Webhook Trigger

1. Navigate to the Hook Builder
2. Select "Webhook" as your trigger type
3. No additional configuration is required - the webhook URL and secret are generated automatically

### Step 2: Configure Actions

Add the actions you want to execute when the webhook is triggered. Common actions include:

- **Telegram**: Send notifications
- **Webhook**: Forward data to other services
- **Contract Call**: Execute blockchain transactions
- **Chain**: Trigger other hooks

### Step 3: Save and Get Webhook Details

After saving your hook, you'll receive:

- **Webhook URL**: The endpoint to call
- **Webhook Secret**: Authentication token
- **Example Usage**: Ready-to-use code examples

## Authentication

All webhook requests must include the secret in the `x-webhook-secret` header:

```bash
curl -X POST "https://hookified.app/api/webhooks/YOUR_HOOK_ID" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{"message": "Hello from webhook!"}'
```

### Security Features

- **Timing Attack Prevention**: Uses constant-time comparison for secret validation
- **HTTPS Only**: Webhook endpoints only accept HTTPS requests in production
- **Request Validation**: Validates Content-Type and JSON payload format
- **Rate Limiting**: Built-in protection against abuse
- **Audit Logging**: All webhook attempts are logged (without secrets)

## Request Format

### Required Headers

- `Content-Type: application/json`
- `x-webhook-secret: YOUR_SECRET`

### Request Body

The JSON payload you send will be passed to your hook actions. You can include any data structure:

```json
{
  "event": "user_signup",
  "user_id": "12345",
  "email": "user@example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "source": "mobile_app",
    "version": "1.2.3"
  }
}
```

### Response Codes

- `202 Accepted`: Webhook received and hook execution triggered
- `400 Bad Request`: Invalid request format or inactive hook
- `401 Unauthorized`: Missing or invalid webhook secret
- `404 Not Found`: Hook not found
- `500 Internal Server Error`: Server error

## Integration Examples

### cURL

```bash
curl -X POST "https://hookified.app/api/webhooks/YOUR_HOOK_ID" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{
    "message": "Hello from cURL!",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
```

### JavaScript (Fetch API)

```javascript
const webhookUrl = 'https://hookified.app/api/webhooks/YOUR_HOOK_ID';
const secret = 'YOUR_SECRET';

const payload = {
  message: 'Hello from JavaScript!',
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent
};

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret
  },
  body: JSON.stringify(payload)
})
.then(response => {
  if (response.ok) {
    console.log('Webhook triggered successfully');
  } else {
    console.error('Webhook failed:', response.status);
  }
})
.catch(error => {
  console.error('Error:', error);
});
```

### Python (requests)

```python
import requests
import json
from datetime import datetime

webhook_url = 'https://hookified.app/api/webhooks/YOUR_HOOK_ID'
secret = 'YOUR_SECRET'

payload = {
    'message': 'Hello from Python!',
    'timestamp': datetime.utcnow().isoformat() + 'Z',
    'source': 'python_script'
}

headers = {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret
}

try:
    response = requests.post(webhook_url, headers=headers, json=payload)
    response.raise_for_status()
    print('Webhook triggered successfully')
except requests.exceptions.RequestException as e:
    print(f'Error: {e}')
```

### Node.js (axios)

```javascript
const axios = require('axios');

const webhookUrl = 'https://hookified.app/api/webhooks/YOUR_HOOK_ID';
const secret = 'YOUR_SECRET';

const payload = {
  message: 'Hello from Node.js!',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV
};

axios.post(webhookUrl, payload, {
  headers: {
    'Content-Type': 'application/json',
    'x-webhook-secret': secret
  }
})
.then(response => {
  console.log('Webhook triggered successfully');
})
.catch(error => {
  console.error('Error:', error.message);
});
```

## Secret Management

### Viewing Your Secret

1. Go to your hook's detail page
2. The webhook secret is displayed in the Webhook Configuration section
3. Click the eye icon to show/hide the secret
4. Use the copy button to copy the secret

### Regenerating Your Secret

1. On the hook detail page, click "Regenerate" next to the secret
2. Confirm the action (this will break existing integrations)
3. Update your webhook clients with the new secret
4. The old secret will no longer work

### Security Best Practices

- **Never share your webhook secret** in public repositories or logs
- **Rotate secrets regularly** for enhanced security
- **Use environment variables** to store secrets in your applications
- **Monitor webhook logs** for suspicious activity
- **Implement rate limiting** on your webhook clients

## Monitoring and Debugging

### Webhook Logs

All webhook attempts are logged with:

- Timestamp
- Client IP address
- Success/failure status
- Processing time
- Error details (without secrets)

### Recent Calls

View recent webhook calls on your hook's detail page:

- Execution status (Success/Failed/Pending)
- Trigger timestamp
- Error messages (if any)
- Processing duration

### Common Issues

#### 401 Unauthorized

- **Missing header**: Ensure `x-webhook-secret` header is included
- **Wrong secret**: Verify the secret matches exactly
- **Case sensitivity**: Header names are case-sensitive

#### 400 Bad Request

- **Invalid JSON**: Ensure request body is valid JSON
- **Wrong Content-Type**: Must be `application/json`
- **Inactive hook**: Check if the hook is active

#### 404 Not Found

- **Wrong URL**: Verify the webhook URL is correct
- **Deleted hook**: The hook may have been deleted

#### 500 Internal Server Error

- **Server issue**: Contact support if this persists
- **Rate limiting**: Too many requests may cause temporary errors

## Advanced Usage

### Payload Processing

Your webhook payload is available in action configurations through template variables:

```javascript
// In Telegram action message template
Hello! Received webhook with data:
Event: {{webhookPayload.event}}
User: {{webhookPayload.user_id}}
Time: {{webhookPayload.timestamp}}
```

### Conditional Actions

Use webhook data to conditionally execute actions:

```javascript
// Example: Only send notification for specific events
if (webhookPayload.event === 'user_signup') {
  // Execute notification action
}
```

### Error Handling

Implement proper error handling in your webhook clients:

```javascript
fetch(webhookUrl, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(payload)
})
.then(response => {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
})
.then(data => {
  console.log('Success:', data);
})
.catch(error => {
  console.error('Webhook failed:', error);
  // Implement retry logic or alerting
});
```

## Rate Limits

Webhook endpoints have built-in rate limiting to prevent abuse:

- **Per hook**: 100 requests per minute per hook
- **Per IP**: 1000 requests per minute per IP address
- **Burst limit**: 10 requests per second

If you exceed these limits, you'll receive a `429 Too Many Requests` response.

## Best Practices

### Design

- **Keep payloads small**: Large payloads may be rejected
- **Use meaningful data**: Include relevant context in your payload
- **Version your payloads**: Include version information for future compatibility

### Security

- **Validate on your end**: Don't trust webhook data blindly
- **Use HTTPS**: Always use secure connections
- **Monitor logs**: Regularly check webhook execution logs
- **Rotate secrets**: Change secrets periodically

### Reliability

- **Implement retries**: Handle temporary failures gracefully
- **Use idempotency**: Design your webhooks to be safely retryable
- **Test thoroughly**: Test webhook integrations in staging environments
- **Monitor performance**: Track webhook response times and success rates

## Troubleshooting

### Webhook Not Triggering

1. Check if the hook is active
2. Verify the webhook URL is correct
3. Ensure the secret header is included
4. Check webhook logs for error details

### Actions Not Executing

1. Verify action configurations are valid
2. Check action logs for specific errors
3. Ensure required data is present in the payload
4. Test actions manually if possible

### Performance Issues

1. Monitor webhook response times
2. Check for rate limiting
3. Optimize payload size
4. Consider implementing webhook queuing

## Support

If you encounter issues not covered in this guide:

1. Check the webhook logs on your hook's detail page
2. Review the error messages and status codes
3. Test with the provided examples
4. Contact support with specific error details

## API Reference

### Webhook Endpoint

```
POST /api/webhooks/{hookId}
```

**Headers:**
- `Content-Type: application/json` (required)
- `x-webhook-secret: {secret}` (required)

**Body:** JSON payload (any structure)

**Response:**
```json
{
  "success": true,
  "message": "Webhook received and hook execution triggered",
  "hookId": "hook_123"
}
```

### Webhook Details Endpoint

```
GET /api/hooks/{hookId}/webhook-details
```

**Response:**
```json
{
  "webhookUrl": "https://hookified.app/api/webhooks/hook_123",
  "secret": "abc123...",
  "lastTriggered": "2024-01-15T10:30:00Z",
  "lastStatus": "SUCCESS",
  "exampleCurl": "curl -X POST...",
  "instructions": {
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "x-webhook-secret": "abc123..."
    },
    "body": "JSON payload will be passed to your hook actions"
  }
}
```

### Regenerate Secret Endpoint

```
POST /api/hooks/{hookId}/regenerate-secret
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook secret regenerated successfully",
  "secret": "new_secret_123...",
  "warning": "This will break existing integrations using the old secret. Update your webhook clients immediately."
}
```
