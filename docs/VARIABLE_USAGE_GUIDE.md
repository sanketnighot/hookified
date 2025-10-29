# Variable Usage Guide

The variable interpolation system allows you to reference data from triggers and previous actions in your hooks. This enables powerful workflows where actions can use data from earlier steps in the execution chain.

## Table of Contents

- [Basic Syntax](#basic-syntax)
- [Trigger Variables](#trigger-variables)
- [Action Result Variables](#action-result-variables)
- [Common Use Cases](#common-use-cases)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Basic Syntax

Variables are referenced using curly braces: `{variable.path}`

### Simple Variable
```
{trigger.eventName}
```

### Nested Paths
```
{trigger.event.args.value}
```

### Action Results
```
{actions[0].result.data}
{action0.result.data}
```

## Trigger Variables

Trigger variables contain data from the event that fired the hook. The data structure depends on the trigger type.

### ONCHAIN Triggers

For blockchain event triggers, you can access event data:

```
Transfer detected!
From: {trigger.event.args.from}
To: {trigger.event.args.to}
Value: {trigger.event.args.value}
Transaction: {trigger.event.transaction.hash}
Block: {trigger.event.blockNumber}
```

**Available fields:**
- `{trigger.event.args.*}` - Event arguments
- `{trigger.event.transaction.hash}` - Transaction hash
- `{trigger.event.blockNumber}` - Block number
- `{trigger.event.address}` - Contract address

### WEBHOOK Triggers

For webhook triggers, you can access the webhook payload:

```
Webhook received!
Data: {trigger.webhookPayload.data}
Headers: {trigger.webhookPayload.headers}
Timestamp: {trigger.timestamp}
```

**Available fields:**
- `{trigger.webhookPayload.*}` - Full webhook payload
- `{trigger.headers.*}` - Request headers
- `{trigger.timestamp}` - Request timestamp

### CRON Triggers

For scheduled triggers:

```
Cron job executed
Scheduled at: {trigger.scheduledAt}
Last executed: {trigger.lastExecutedAt}
```

**Available fields:**
- `{trigger.cronExpression}` - Cron schedule
- `{trigger.scheduledAt}` - Current execution time
- `{trigger.lastExecutedAt}` - Previous execution time

### MANUAL Triggers

For manually triggered hooks:

```
Manual execution
Triggered by: {trigger.triggeredBy}
Triggered at: {trigger.triggeredAt}
```

## Action Result Variables

Action results allow you to reference outputs from previous actions in the sequence.

### Access by Index

Use array notation to access actions by their position (0-based):

```
{actions[0].result.data}
{actions[1].result.status}
{actions[2].result.body.value}
```

### Access by Alias

Use aliases for more readable references:

```
{action0.result.data}
{action1.result.status}
{action2.result.body.value}
```

### Available Fields

Each action result contains:

- `{actions[N].result.*}` - The action's result data
- `{actions[N].status}` - Action status (SUCCESS/FAILED)
- `{actions[N].type}` - Action type (TELEGRAM, WEBHOOK, etc.)
- `{actions[N].error}` - Error message (if failed)

**Note:** The exact structure of `result` depends on the action type (see examples below).

## Common Use Cases

### Use Case 1: Send Telegram Notification with Trigger Data

**Setup:**
- Trigger: ONCHAIN (Transfer event)
- Action: TELEGRAM

**Message Template:**
```
🚨 Transfer Detected!

From: {trigger.event.args.from}
To: {trigger.event.args.to}
Amount: {trigger.event.args.value} wei
Transaction: {trigger.event.transaction.hash}
```

### Use Case 2: Chain Actions - Get Balance Then Send Notification

**Setup:**
- Action 1: WEBHOOK (fetch balance)
- Action 2: TELEGRAM (send notification)

**Action 1 Webhook Response:**
```json
{
  "status": 200,
  "body": {
    "balance": "1000000000000000000",
    "currency": "ETH"
  }
}
```

**Action 2 Message Template:**
```
Current Balance: {actions[0].result.body.balance} wei
Currency: {actions[0].result.body.currency}
```

### Use Case 3: Dynamic Webhook with Trigger Data

**Setup:**
- Trigger: WEBHOOK
- Action: WEBHOOK (forward to external API)

**Body Template:**
```json
{
  "event": "{trigger.webhookPayload.event}",
  "data": {trigger.webhookPayload.data},
  "timestamp": "{trigger.timestamp}",
  "hookId": "{hookId}",
  "runId": "{runId}"
}
```

### Use Case 4: Contract Call with Previous Action Result

**Setup:**
- Action 1: WEBHOOK (get recipient address)
- Action 2: CONTRACT_CALL (transfer tokens)

**Action 1 Webhook Response:**
```json
{
  "body": {
    "recipient": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "amount": "1000000000000000000"
  }
}
```

**Action 2 Parameters:**
```
Parameter 1 (recipient): {actions[0].result.body.recipient}
Parameter 2 (amount): {actions[0].result.body.amount}
```

### Use Case 5: Conditional Notification Based on Action Success

**Setup:**
- Action 1: WEBHOOK
- Action 2: TELEGRAM

**Message Template:**
```
Action Status: {actions[0].status}
Result: {actions[0].result}
Error: {actions[0].error}
```

## Built-in Variables

In addition to trigger and action data, these variables are always available:

- `{hookId}` - Current hook ID
- `{runId}` - Current execution run ID
- `{timestamp}` - Current timestamp (ISO format)

**Example:**
```
Execution Details:
Hook ID: {hookId}
Run ID: {runId}
Timestamp: {timestamp}
```

## Data Type Handling

### Strings and Numbers
Strings and numbers are inserted directly:
```
Value: {trigger.event.args.value}  // Output: Value: 100
```

### Objects and Arrays
Objects and arrays are JSON stringified:
```
User data: {actions[0].result.data.user}
// Output: User data: {"name":"John","age":30}
```

### Null/Undefined Values
Missing or undefined variables are replaced with empty strings by default:
```
Value: {nonexistent.variable}  // Output: Value:
```

## Best Practices

### 1. Use Descriptive Action References

Prefer aliases for readability:
```
✅ {action0.result.balance}
❌ {actions[0].result.balance}  // Less readable in long chains
```

### 2. Test Variable Paths

Before deploying, verify your variable paths by checking:
- Action response structure
- Trigger data format
- Nested object paths

### 3. Handle Missing Data

Variables that don't exist will resolve to empty strings. Consider:
- Providing default values in your templates
- Using conditional logic in external systems
- Testing with sample data

### 4. Structure Multi-Action Hooks

Plan your action sequence:
1. **Data fetching actions first** - Gather required data
2. **Transformations second** - Process or format data
3. **Notifications/Outputs last** - Use all collected data

### 5. Use External Transformations for Complex Logic

For complex data transformations:
- Use a WEBHOOK action to call an external transformation service
- Store transformed data in action results
- Reference transformed data in subsequent actions

## Troubleshooting

### Variable Not Resolving

**Problem:** Variable shows as `{variable.path}` in output

**Solutions:**
1. Check variable path spelling and case sensitivity
2. Verify the data exists in trigger/action result
3. Use dot notation for nested objects: `trigger.event.args.value`
4. Check action execution order - can't reference future actions

### Getting Empty Values

**Problem:** Variable resolves to empty string

**Solutions:**
1. Verify the data path exists in the response
2. Check if previous action succeeded
3. Inspect action result structure in execution logs
4. Use nested path notation for complex objects

### JSON Stringification Issues

**Problem:** Objects showing as JSON strings when you want formatted output

**Solution:** Transform data in a WEBHOOK action before using it

### Accessing Array Elements

**Problem:** Need to access array elements

**Solution:** Use bracket notation in path:
```
{trigger.events[0].value}
{actions[0].result.items[2].name}
```

## Examples by Action Type

### TELEGRAM Action

```
Message Template:
---
Transfer Alert 🚨

Amount: {trigger.event.args.value} ETH
From: {trigger.event.args.from}
To: {trigger.event.args.to}
Transaction: {trigger.event.transaction.hash}

Balance after transfer: {actions[0].result.balance} ETH
---
```

### WEBHOOK Action

```
Body Template:
{
  "event": "transfer",
  "from": "{trigger.event.args.from}",
  "to": "{trigger.event.args.to}",
  "value": "{trigger.event.args.value}",
  "previous_balance": "{actions[0].result.balance}",
  "timestamp": "{timestamp}"
}
```

### CONTRACT_CALL Action

```
Parameters (example for transfer function):
Parameter 1: {actions[0].result.recipient}
Parameter 2: {actions[0].result.amount}
```

## Advanced Tips

### Debugging Variables

1. Add a TELEGRAM action at the start to log trigger data:
   ```
   Debug: {trigger}
   ```

2. Add actions to inspect intermediate results:
   ```
   Action 1 result: {actions[0].result}
   ```

### Nested Object Access

For deeply nested objects, use dot notation:
```
{trigger.event.transaction.receipt.gasUsed}
{actions[0].result.data.user.profile.email}
```

### Dynamic Headers in Webhooks

You can use variables in webhook headers:
```json
{
  "Authorization": "Bearer {actions[0].result.token}",
  "X-Hook-Id": "{hookId}",
  "X-Event-Type": "{trigger.webhookPayload.type}"
}
```

## Summary

Variables enable powerful data flow between triggers and actions:

- **Trigger variables** - Access event/webhook data
- **Action variables** - Reference previous action outputs
- **Built-in variables** - hookId, runId, timestamp
- **Flexible syntax** - Index-based or aliased references
- **Type handling** - Automatic JSON stringification for objects

Start with simple trigger variables, then progress to chaining actions together with action result variables for more complex workflows!

