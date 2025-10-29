import { migrateOnchainConfig } from '@/lib/migrations/onchainConfigMigration';
import { prisma } from '@/lib/prisma';

let migrationRunning = false;
let migrationCompleted = false;

export async function runOnchainConfigMigration() {
  // Prevent concurrent runs
  if (migrationRunning || migrationCompleted) {
    return;
  }

  migrationRunning = true;

  try {
    // Check if migration already ran by looking for a hook with migrated structure
    const sampleHook = await prisma.hook.findFirst({
      where: { triggerType: 'ONCHAIN' },
      select: { triggerConfig: true }
    });

    // If we find a hook with events array, migration likely already ran
    if (sampleHook && sampleHook.triggerConfig) {
      const config = sampleHook.triggerConfig as any;
      if (config.events && Array.isArray(config.events)) {
        console.log('Onchain config migration already completed');
        migrationCompleted = true;
        return;
      }
    }

    console.log('Running onchain config migration...');

    // Fetch all ONCHAIN hooks that need migration
    const hooks = await prisma.hook.findMany({
      where: { triggerType: 'ONCHAIN' }
    });

    console.log(`Found ${hooks.length} hooks to check for migration`);

    // Migrate each hook that needs migration
    let migratedCount = 0;
    for (const hook of hooks) {
      const currentConfig = hook.triggerConfig as any;

      // Skip if already migrated
      if (currentConfig.events && Array.isArray(currentConfig.events)) {
        continue;
      }

      const migratedConfig = migrateOnchainConfig(currentConfig);

      // Only update if config actually changed
      const currentConfigStr = JSON.stringify(currentConfig);
      const migratedConfigStr = JSON.stringify(migratedConfig);

      if (currentConfigStr !== migratedConfigStr) {
        await prisma.hook.update({
          where: { id: hook.id },
          data: { triggerConfig: migratedConfig as any }
        });
        migratedCount++;
      }
    }

    console.log(`Successfully migrated ${migratedCount} hooks`);
    migrationCompleted = true;

  } catch (error) {
    console.error('Error running onchain config migration:', error);
    // Don't throw - migration failures shouldn't break the app
  } finally {
    migrationRunning = false;
  }
}

