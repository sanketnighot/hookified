# Supabase Database CRON System

This document explains how the CRON scheduling system works using Supabase database storage with a simple cron service.

## Overview

The system stores cron job configurations in the Supabase database and uses a simple cron service to check and execute hooks at the specified schedule.

## Architecture

```
Hook Creation → Database Storage → Cron Service → Hook Execution
```

1. **Hook Creation**: User creates a hook with CRON trigger
2. **Database Storage**: System stores cron job configuration in `cron_jobs` table
3. **Cron Service**: External cron service checks database for active jobs
4. **Hook Execution**: Cron service calls the hook execution endpoint

## Components

### 1. CronJobManager Service

Located in `src/services/triggers/CronJobManager.ts`, this service manages cron job storage:

- **createCronJob()**: Stores cron job configuration in database
- **pauseCronJob()**: Marks cron job as inactive
- **resumeCronJob()**: Marks cron job as active
- **deleteCronJob()**: Removes cron job from database
- **updateCronJobSchedule()**: Updates the cron schedule
- **getCronJobStatus()**: Gets the status of a cron job
- **listAllCronJobs()**: Lists all cron jobs

### 2. Database Schema

The `cron_jobs` table stores cron job configurations:

```sql
CREATE TABLE cron_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_id TEXT UNIQUE NOT NULL,
  cron_expression TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Hook Execution Endpoint

The `/api/cron/execute/[hookId]` endpoint receives calls from the cron service and executes the actual hook logic.

## Setup Requirements

### 1. Environment Variables

```bash
CRON_SECRET="your-super-secret-cron-token"
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 2. Database Migration

Run the Prisma migration to create the `cron_jobs` table:

```bash
bunx prisma migrate dev --name add_cron_jobs_table
```

### 3. Cron Service Setup

You'll need to set up an external cron service (like a Vercel Cron Job, GitHub Actions, or a simple server) that:

1. Runs every minute
2. Queries the `cron_jobs` table for active jobs
3. Checks if any jobs should run based on their cron expressions
4. Calls the `/api/cron/execute/[hookId]` endpoint for jobs that should run

## Usage

### Creating a CRON Hook

1. User creates a hook with CRON trigger type
2. System generates cron expression from user input
3. CronJobManager stores the configuration in database
4. External cron service picks up the job

### Pausing a Hook

1. User pauses the hook
2. CronJobManager marks the cron job as inactive
3. Cron service skips inactive jobs

### Resuming a Hook

1. User resumes the hook
2. CronJobManager marks the cron job as active
3. Cron service resumes checking the job

### Deleting a Hook

1. User deletes the hook
2. CronJobManager removes the cron job from database
3. Cron service no longer sees the job

## Security

### 1. CRON_SECRET Verification

- Cron service includes the CRON_SECRET in requests
- Execution endpoint verifies the secret
- Prevents unauthorized hook execution

### 2. Database Security

- Uses Supabase's built-in security
- Row-level security can be applied
- No direct database access from external services

## Benefits

### 1. Simplicity

- No complex Edge Function setup required
- Simple database storage
- Easy to understand and debug

### 2. Reliability

- Database provides persistent storage
- Easy to backup and restore
- Simple to monitor and debug

### 3. Flexibility

- Can use any external cron service
- Easy to switch between different cron providers
- Simple to scale

### 4. Cost-Effective

- No Edge Function costs
- Simple database queries
- Minimal resource usage

## Limitations

### 1. External Dependency

- Requires external cron service
- Dependent on cron service reliability
- Need to manage cron service separately

### 2. Precision

- Limited by cron service frequency
- May have slight delays
- Not suitable for sub-minute precision

## Example Cron Service

Here's a simple example of how to implement the cron service:

```javascript
// Simple Node.js cron service
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.APP_URL;

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    // Get all active cron jobs
    const { data: cronJobs, error } = await supabase
      .from('cron_jobs')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to fetch cron jobs:', error);
      return;
    }

    // Check each job
    for (const job of cronJobs) {
      if (shouldRunJob(job.cron_expression)) {
        // Execute the hook
        await executeHook(job.hook_id);
      }
    }
  } catch (error) {
    console.error('Cron service error:', error);
  }
});

function shouldRunJob(cronExpression) {
  // Implement cron expression evaluation
  // This is a simplified example
  const now = new Date();
  const minute = now.getMinutes();
  const hour = now.getHours();

  // Simple daily at specific time example
  if (cronExpression.includes('0 9 * * *')) {
    return minute === 0 && hour === 9;
  }

  return false;
}

async function executeHook(hookId) {
  try {
    const response = await fetch(`${APP_URL}/api/cron/execute/${hookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': CRON_SECRET,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`Hook execution failed: ${response.status}`);
    }

    console.log(`Successfully executed hook: ${hookId}`);
  } catch (error) {
    console.error(`Failed to execute hook ${hookId}:`, error);
  }
}
```

## Troubleshooting

### Common Issues

1. **Cron Jobs Not Running**
   - Check if cron service is running
   - Verify cron service can access database
   - Check cron expression format

2. **Database Connection Issues**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure proper permissions

3. **Hook Execution Fails**
   - Verify CRON_SECRET configuration
   - Check execution endpoint logs
   - Ensure hook configuration is valid

### Debugging

1. **Check Database**
   - Query `cron_jobs` table directly
   - Verify job configurations
   - Check active status

2. **Monitor Cron Service**
   - Check cron service logs
   - Verify execution attempts
   - Monitor error rates

3. **Test Execution Endpoint**
   - Use curl or Postman to test endpoint
   - Verify CRON_SECRET is working
   - Check response status codes

## Migration from pg_cron

If migrating from pg_cron:

1. **Backup Existing Hooks**
   - Export hook configurations
   - Save cron schedules
   - Document current state

2. **Update Configuration**
   - Remove pg_cron dependencies
   - Update environment variables
   - Set up external cron service

3. **Test Migration**
   - Create test hooks
   - Verify execution
   - Check scheduling accuracy

4. **Deploy Changes**
   - Update application code
   - Deploy cron service
   - Monitor execution

## Best Practices

### 1. Error Handling

- Implement proper error handling in cron service
- Log all execution attempts
- Handle network failures gracefully

### 2. Monitoring

- Set up alerts for failed executions
- Monitor cron service performance
- Track execution success rates

### 3. Security

- Use strong CRON_SECRET values
- Regularly rotate secrets
- Monitor for unauthorized access

### 4. Performance

- Optimize database queries
- Use connection pooling
- Implement proper indexing

This system provides a simple, reliable solution for CRON scheduling using Supabase's database capabilities while maintaining flexibility and ease of use.
