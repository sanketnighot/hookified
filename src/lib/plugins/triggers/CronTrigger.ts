import { FormSchema, TriggerDefinition, ValidationResult } from "../types";

export interface CronConfig {
  type: "CRON";
  cronExpression?: string;
  timezone?: string;
}

export class CronTrigger implements TriggerDefinition<CronConfig> {
  type = "CRON";
  name = "Schedule";
  description = "Run hooks at specific times or intervals";
  icon = "Clock";

  validateConfig(config: CronConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.cronExpression) {
      errors.push("Cron expression is required");
    }

    return { isValid: errors.length === 0, errors };
  }

  getConfigSchema(): FormSchema {
    return {
      fields: [
        {
          name: "cronExpression",
          label: "Schedule",
          type: "text",
          placeholder: "0 9 * * *",
          required: true,
          description: "Cron expression format: minute hour day month weekday",
        },
      ],
    };
  }
}

export const cronTrigger = new CronTrigger();
