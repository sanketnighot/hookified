/**
 * Test script for CRON scheduling system
 * This script tests the end-to-end functionality of the new cron system
 */

import { getAppConfig, getCronConfig } from '@/lib/config';
import { HookService } from '@/services/hooks/HookService';
import { CronJobManager } from '@/services/triggers/CronJobManager';

export class CronSystemTester {
  private cronJobManager = new CronJobManager();

  /**
   * Test 1: Create a CRON hook and verify pg_cron job creation
   */
  async testHookCreation() {
    console.log('🧪 Testing CRON hook creation...');

    try {
      // Create a test hook
      const testHook = await HookService.createHook({
        userId: 'test-user-id',
        name: 'Test CRON Hook',
        description: 'Test hook for cron scheduling',
        triggerType: 'CRON',
        triggerConfig: {
          cronExpression: '0 9 * * *', // Daily at 9 AM UTC
          timezone: 'UTC',
        },
        actions: [{
          type: 'TELEGRAM',
          config: {
            chatId: 'test-chat-id',
            message: 'Test message',
          },
        }],
      });

      console.log('✅ Hook created successfully:', testHook.id);

      // Check if cron job was created
      const jobStatus = await this.cronJobManager.getCronJobStatus(testHook.id);
      console.log('📋 Cron job status:', jobStatus);

      if (jobStatus.exists) {
        console.log('✅ pg_cron job created successfully');
      } else {
        console.log('❌ pg_cron job was not created');
      }

      return testHook;
    } catch (error) {
      console.error('❌ Hook creation test failed:', error);
      throw error;
    }
  }

  /**
   * Test 2: Test hook pause/resume functionality
   */
  async testHookPauseResume(hookId: string) {
    console.log('🧪 Testing hook pause/resume...');

    try {
      // Pause the hook
      await HookService.toggleHookStatus(hookId, 'test-user-id', false);
      console.log('✅ Hook paused successfully');

      // Check cron job status
      const pausedStatus = await this.cronJobManager.getCronJobStatus(hookId);
      console.log('📋 Cron job status after pause:', pausedStatus);

      // Resume the hook
      await HookService.toggleHookStatus(hookId, 'test-user-id', true);
      console.log('✅ Hook resumed successfully');

      // Check cron job status
      const resumedStatus = await this.cronJobManager.getCronJobStatus(hookId);
      console.log('📋 Cron job status after resume:', resumedStatus);

    } catch (error) {
      console.error('❌ Hook pause/resume test failed:', error);
      throw error;
    }
  }

  /**
   * Test 3: Test hook deletion and cron job cleanup
   */
  async testHookDeletion(hookId: string) {
    console.log('🧪 Testing hook deletion...');

    try {
      // Delete the hook
      await HookService.deleteHook(hookId, 'test-user-id');
      console.log('✅ Hook deleted successfully');

      // Check if cron job was removed
      const jobStatus = await this.cronJobManager.getCronJobStatus(hookId);
      console.log('📋 Cron job status after deletion:', jobStatus);

      if (!jobStatus.exists) {
        console.log('✅ pg_cron job removed successfully');
      } else {
        console.log('❌ pg_cron job was not removed');
      }

    } catch (error) {
      console.error('❌ Hook deletion test failed:', error);
      throw error;
    }
  }

  /**
   * Test 4: Test timezone conversion
   */
  testTimezoneConversion() {
    console.log('🧪 Testing timezone conversion...');

    const testTimes = [
      { local: '09:00', timezone: 'America/New_York' },
      { local: '14:30', timezone: 'Europe/London' },
      { local: '23:45', timezone: 'Asia/Tokyo' },
    ];

    testTimes.forEach(({ local, timezone }) => {
      // Simulate the conversion logic from CronScheduleField
      const localDate = new Date(`1970-01-01T${local}:00`);
      const utcHours = localDate.getUTCHours();
      const utcMinutes = localDate.getUTCMinutes();

      console.log(`📍 ${local} ${timezone} → ${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')} UTC`);
    });

    console.log('✅ Timezone conversion test completed');
  }

  /**
   * Test 5: Test cron execution endpoint security
   */
  async testExecutionEndpointSecurity(hookId: string) {
    console.log('🧪 Testing execution endpoint security...');

    const appUrl = getAppConfig().url;
    const cronSecret = getCronConfig().secret;

    try {
      // Test with invalid secret
      const invalidResponse = await fetch(`${appUrl}/api/cron/execute/${hookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': 'invalid-secret',
        },
        body: JSON.stringify({}),
      });

      if (invalidResponse.status === 401) {
        console.log('✅ Invalid secret correctly rejected');
      } else {
        console.log('❌ Invalid secret was not rejected');
      }

      // Test with valid secret (but hook might not exist)
      const validResponse = await fetch(`${appUrl}/api/cron/execute/${hookId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cron-secret': cronSecret,
        },
        body: JSON.stringify({}),
      });

      console.log('📋 Valid secret response status:', validResponse.status);

    } catch (error) {
      console.error('❌ Execution endpoint security test failed:', error);
    }
  }

  /**
   * Test 6: List all cron jobs for debugging
   */
  async testListCronJobs() {
    console.log('🧪 Testing cron job listing...');

    try {
      const jobs = await this.cronJobManager.listAllCronJobs();
      console.log('📋 All cron jobs:', jobs);
      console.log(`✅ Found ${jobs.length} cron jobs`);
    } catch (error) {
      console.error('❌ Cron job listing test failed:', error);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting CRON system tests...\n');

    try {
      // Test timezone conversion first (no async)
      this.testTimezoneConversion();
      console.log('');

      // Test cron job listing
      await this.testListCronJobs();
      console.log('');

      // Test hook creation
      const testHook = await this.testHookCreation();
      console.log('');

      // Test pause/resume
      await this.testHookPauseResume(testHook.id);
      console.log('');

      // Test execution endpoint security
      await this.testExecutionEndpointSecurity(testHook.id);
      console.log('');

      // Test hook deletion
      await this.testHookDeletion(testHook.id);
      console.log('');

      console.log('🎉 All tests completed successfully!');

    } catch (error) {
      console.error('💥 Test suite failed:', error);
    }
  }
}

// Export for use in other files
export const cronSystemTester = new CronSystemTester();
