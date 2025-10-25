# CRON Scheduling System

This document describes the implementation of the CRON scheduling system in Hookified, which addresses timezone issues, pg_cron job management, and secure execution.

## Overview

The CRON scheduling system now:
- ✅ Converts local times to UTC for accurate scheduling
- ✅ Creates individual pg_cron jobs in Supabase for each CRON hook
- ✅ Manages job lifecycle (pause, resume, delete) automatically
- ✅ Secures execution endpoints with token and service role authentication

## Architecture

```
User Input (Local Time) → UTC Conversion → pg_cron Job → Secure API Endpoint → Hook Execution
```

### Components

1. **CronScheduleField** - UI component with timezone conversion
2. **CronJobManager** - Service for managing pg_cron jobs
3. **HookService** - Integrated cron job lifecycle management
4. **Execution Endpoint** - Secure API for hook execution
5. **Supabase Admin Client** - Raw SQL execution for pg_cron operations

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
# Required for cron job security
CRON_SECRET="your-secure-random-string-here"
```

### 2. Supabase SQL Setup

Run the SQL commands in `supabase-sql-setup.sql` in your Supabase SQL editor to enable raw SQL execution:

```sql
-- This creates the exec_sql function needed for pg_cron management
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- ... (see supabase-sql-setup.sql for full implementation)
$$;
```

### 3. Verify pg_cron Extension

Ensure pg_cron is enabled in your Supabase project:

```sql
-- Check if pg_cron is available
SELECT * FROM cron.job;
```

## How It Works

### 1. Hook Creation

When a user creates a CRON hook:

1. **UI**: User selects local time (e.g., 9:00 AM EST)
2. **Conversion**: Time is converted to UTC (e.g., 14:00 UTC)
3. **Cron Expression**: Generated in UTC format (e.g., `0 14 * * *`)
4. **Database**: Hook is saved with UTC cron expression
5. **pg_cron**: Individual job is created calling `/api/cron/execute/{hookId}`

### 2. Hook Execution

When the scheduled time arrives:

1. **pg_cron**: Executes the scheduled job
2. **HTTP Request**: Calls `/api/cron/execute/{hookId}` with secret header
3. **Security**: Endpoint verifies `x-cron-secret` header
4. **Validation**: Checks hook is active and has CRON trigger type
5. **Execution**: Runs the hook using `HookExecutor`
6. **Update**: Updates `lastExecutedAt` timestamp

### 3. Hook Management

- **Pause**: Disables the pg_cron job using `cron.alter_job()`
- **Resume**: Re-enables the pg_cron job
- **Delete**: Removes the pg_cron job using `cron.unschedule()`
- **Update**: Changes the cron schedule if trigger config changes

## API Endpoints

### POST /api/cron/execute/[hookId]

Executes a specific hook via cron job.

**Headers:**
- `x-cron-secret`: Must match `CRON_SECRET` environment variable
- `Content-Type`: `application/json`

**Response:**
```json
{
  "success": true,
  "message": "Hook executed successfully",
  "hookId": "hook-id",
  "executionTime": "2024-01-01T09:00:00.000Z",
  "result": { /* execution result */ }
}
```

### GET /api/cron/execute/[hookId]

Gets hook status for debugging.

**Response:**
```json
{
  "success": true,
  "hook": {
    "id": "hook-id",
    "name": "Hook Name",
    "triggerType": "CRON",
    "isActive": true,
    "status": "ACTIVE",
    "lastExecutedAt": "2024-01-01T09:00:00.000Z",
    "triggerConfig": { /* config */ }
  }
}
```

## Testing

Use the `CronSystemTester` class to test the implementation:

```typescript
import { cronSystemTester } from '@/services/triggers/CronSystemTester';

// Run all tests
await cronSystemTester.runAllTests();
```

## Troubleshooting

### Common Issues

1. **"SQL execution failed"**
   - Ensure `exec_sql` function is created in Supabase
   - Check service role key has proper permissions

2. **"Invalid cron secret"**
   - Verify `CRON_SECRET` environment variable is set
   - Check the secret matches between environment and request headers

3. **"Hook not found"**
   - Verify the hook exists and is active
   - Check hook has CRON trigger type

4. **pg_cron job not created**
   - Check Supabase logs for SQL errors
   - Verify pg_cron extension is enabled
   - Ensure service role has permissions

### Debugging

1. **List all cron jobs:**
   ```typescript
   const jobs = await cronJobManager.listAllCronJobs();
   console.log(jobs);
   ```

2. **Check specific job status:**
   ```typescript
   const status = await cronJobManager.getCronJobStatus(hookId);
   console.log(status);
   ```

3. **Manual execution test:**
   ```bash
   curl -X POST "https://your-app.com/api/cron/execute/hook-id" \
     -H "Content-Type: application/json" \
     -H "x-cron-secret: your-secret" \
     -d '{}'
   ```

## Migration from Old System

The old `/api/cron/check` endpoint is deprecated but still available for:
- Manual testing
- Migration purposes
- Fallback execution

New CRON hooks will automatically use the new individual job system.

## Security Considerations

1. **Secret Authentication**: All cron execution requests must include valid `x-cron-secret`
2. **Service Role**: Uses Supabase service role for privileged operations
3. **Input Validation**: All inputs are validated before execution
4. **Error Handling**: Failed executions update hook status to ERROR
5. **Logging**: All operations are logged for debugging and monitoring

## Performance

- **Individual Jobs**: Each hook has its own pg_cron job for precise scheduling
- **Efficient Execution**: Direct API calls eliminate polling overhead
- **Scalable**: Can handle thousands of concurrent cron jobs
- **Reliable**: pg_cron is battle-tested PostgreSQL extension
