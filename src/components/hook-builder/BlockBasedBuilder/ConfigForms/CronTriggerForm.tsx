"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TriggerConfig } from "@/lib/types";
import { useState } from "react";

interface CronTriggerFormProps {
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

const CRON_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every day at 9 AM", value: "0 9 * * *" },
  { label: "Every Monday at 9 AM", value: "0 9 * * 1" },
  { label: "Every month on the 1st", value: "0 9 1 * *" },
];

const TIMEZONE_OPTIONS = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
];

export function CronTriggerForm({ config, onChange }: CronTriggerFormProps) {
  const [cronExpression, setCronExpression] = useState(config.cronExpression || "");
  const [timezone, setTimezone] = useState(config.timezone || "UTC");

  const handleCronChange = (value: string) => {
    setCronExpression(value);
    onChange({
      ...config,
      cronExpression: value,
    });
  };

  const handleTimezoneChange = (value: string) => {
    setTimezone(value);
    onChange({
      ...config,
      timezone: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cron-expression">Schedule</Label>
        <div className="space-y-2">
          <Input
            id="cron-expression"
            placeholder="0 9 * * *"
            value={cronExpression}
            onChange={(e) => handleCronChange(e.target.value)}
            className="glass"
          />
          <div className="grid grid-cols-2 gap-2">
            {CRON_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleCronChange(preset.value)}
                className="text-xs p-2 rounded-md glass hover:bg-white/5 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Cron expression format: minute hour day month weekday
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={handleTimezoneChange}>
          <SelectTrigger className="glass">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tz}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
