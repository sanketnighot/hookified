"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";

interface CronScheduleFieldProps {
  value: {
    cronExpression?: string;
    timezone?: string;
  };
  onChange: (value: { cronExpression?: string; timezone?: string }) => void;
  error?: string;
}

type ScheduleType = "one-time" | "repeat";
type RepeatFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "hourly"
  | "every-5-min"
  | "every-10-min"
  | "every-15-min"
  | "every-30-min";

export function CronScheduleField({ value, onChange, error }: CronScheduleFieldProps) {
  const [timezone] = useState(() => {
    // Detect user's timezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  });

  // Parse cron expression to get current state
  const parseCronExpression = (cronExpr: string) => {
    const cron = cronExpr.trim().split(/\s+/);
    if (cron.length !== 5) return null;

    const [minute, hour, dayOfMonth, month, weekday] = cron;

    // Parse time
    const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

    // Determine frequency
    let repeatFrequency: RepeatFrequency = "daily";
    let dayOfWeek = "1";

    if (minute.includes("/") || hour.includes("/")) {
      // Custom intervals
      if (minute === "*/5") {
        repeatFrequency = "every-5-min";
      } else if (minute === "*/10") {
        repeatFrequency = "every-10-min";
      } else if (minute === "*/15") {
        repeatFrequency = "every-15-min";
      } else if (minute === "*/30") {
        repeatFrequency = "every-30-min";
      } else if (minute === "0" && hour === "*") {
        repeatFrequency = "hourly";
      }
    } else if (weekday !== "*") {
      repeatFrequency = "weekly";
      dayOfWeek = weekday;
    } else if (dayOfMonth === "1" && month !== "*") {
      if (month === "1") {
        repeatFrequency = "yearly";
      } else {
        repeatFrequency = "monthly";
      }
    }

    return { time, repeatFrequency, dayOfWeek };
  };

  // Get initial state from value prop
  const initialState = value?.cronExpression
    ? parseCronExpression(value.cronExpression)
    : null;

  const [scheduleType, setScheduleType] = useState<ScheduleType>("repeat");
  const [repeatFrequency, setRepeatFrequency] = useState<RepeatFrequency>(
    initialState?.repeatFrequency || "daily"
  );
  const [time, setTime] = useState(initialState?.time || "09:00");
  const [date, setDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(initialState?.dayOfWeek || "1");

  // Track the last cron expression we emitted to parent to avoid feedback loops
  const lastEmittedCron = useRef<string>("");

  // Update local state when value prop changes (e.g., from external source)
  // But only if it's different from what we last emitted
  useEffect(() => {
    if (
      value?.cronExpression &&
      value.cronExpression !== lastEmittedCron.current
    ) {
      const parsed = parseCronExpression(value.cronExpression);
      if (parsed) {
        setTime(parsed.time);
        setRepeatFrequency(parsed.repeatFrequency);
        setDayOfWeek(parsed.dayOfWeek);
        lastEmittedCron.current = value.cronExpression;
      }
    }
  }, [value?.cronExpression]);

  // Convert local clock time (HH:mm in user's browser) to UTC parts
  const convertToUTC = (
    localTime: string
  ): { utcHours: number; utcMinutes: number } => {
    const [hours, minutes] = localTime.split(":");
    const now = new Date();
    // Build a Date on today's date at the provided local time
    const local = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      parseInt(hours),
      parseInt(minutes),
      0,
      0
    );
    return {
      utcHours: local.getUTCHours(),
      utcMinutes: local.getUTCMinutes(),
    };
  };

  // Generate cron expression based on current settings
  useEffect(() => {
    let cronExpression = "";

    if (scheduleType === "one-time") {
      // Convert selected local datetime to UTC cron fields
      if (date && time) {
        const [hours, minutes] = time.split(":");
        const dLocal = new Date(date);
        dLocal.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        const utcMin = dLocal.getUTCMinutes();
        const utcHour = dLocal.getUTCHours();
        const utcDay = dLocal.getUTCDate();
        const utcMonth = dLocal.getUTCMonth() + 1;
        cronExpression = `${utcMin} ${utcHour} ${utcDay} ${utcMonth} *`;
      }
    } else {
      // Repeat schedule - convert local time to UTC
      const { utcHours, utcMinutes } = convertToUTC(time);
      switch (repeatFrequency) {
        case "every-5-min":
          cronExpression = `*/5 * * * *`;
          break;
        case "every-10-min":
          cronExpression = `*/10 * * * *`;
          break;
        case "every-15-min":
          cronExpression = `*/15 * * * *`;
          break;
        case "every-30-min":
          cronExpression = `*/30 * * * *`;
          break;
        case "hourly":
          cronExpression = `0 * * * *`;
          break;
        case "daily":
          cronExpression = `${utcMinutes} ${utcHours} * * *`;
          break;
        case "weekly":
          cronExpression = `${utcMinutes} ${utcHours} * * ${dayOfWeek}`;
          break;
        case "monthly":
          cronExpression = `${utcMinutes} ${utcHours} 1 * *`;
          break;
        case "yearly":
          cronExpression = `${utcMinutes} ${utcHours} 1 1 *`;
          break;
      }
    }

    // Only call onChange if the generated cron expression is different from what we last emitted
    // This prevents unnecessary updates and feedback loops
    if (cronExpression && cronExpression !== lastEmittedCron.current) {
      if (scheduleType === "repeat") {
        // For repeat schedules, we always have a valid cron expression
        const newValue = { cronExpression, timezone };
        onChange(newValue);
        lastEmittedCron.current = cronExpression;
      } else if (scheduleType === "one-time" && date) {
        // For one-time, only call onChange if we have a date
        const newValue = { cronExpression, timezone };
        onChange(newValue);
        lastEmittedCron.current = cronExpression;
      }
    }
  }, [scheduleType, repeatFrequency, time, date, dayOfWeek, timezone]);

  return (
    <div className="space-y-4">
      {/* Schedule Type Selection */}
      <div className="space-y-2">
        <Label>Schedule Type</Label>
        <Select
          value={scheduleType}
          onValueChange={(v) => setScheduleType(v as ScheduleType)}
        >
          <SelectTrigger className="glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="repeat">Repeat Event</SelectItem>
            <SelectItem value="one-time">One-time Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {scheduleType === "one-time" ? (
        // One-time Event Fields
        <>
          <div className="space-y-2">
            <Label htmlFor="date">
              Date & Time
              <span className="text-red-400 ml-1">*</span>
            </Label>
            <Input
              id="date"
              type="datetime-local"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                // Extract time from datetime-local input
                if (e.target.value) {
                  const localDateTime = e.target.value;
                  const [datePart, timePart] = localDateTime.split("T");
                  setDate(`${datePart}T${timePart}`);
                  setTime(timePart || "09:00");
                }
              }}
              className="glass"
            />
            <p className="text-xs text-muted-foreground">
              Select the date and time for this one-time event
            </p>
          </div>
        </>
      ) : (
        // Repeat Event Fields
        <>
          {/* Frequency Selection */}
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select
              value={repeatFrequency}
              onValueChange={(v) => setRepeatFrequency(v as RepeatFrequency)}
            >
              <SelectTrigger className="glass">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="every-5-min">Every 5 Minutes</SelectItem>
                <SelectItem value="every-10-min">Every 10 Minutes</SelectItem>
                <SelectItem value="every-15-min">Every 15 Minutes</SelectItem>
                <SelectItem value="every-30-min">Every 30 Minutes</SelectItem>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection - Only show for options that need a specific time */}
          {["daily", "weekly", "monthly", "yearly"].includes(
            repeatFrequency
          ) && (
            <div className="space-y-2">
              <Label htmlFor="time">
                Time
                <span className="text-red-400 ml-1">*</span>
              </Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="glass"
              />
            </div>
          )}

          {/* Day of Week Selection (for weekly) */}
          {repeatFrequency === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {/* Display Generated Cron Expression */}
      {value?.cronExpression && (
        <div className="space-y-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <p className="text-xs text-blue-400">
            <strong>Generated Schedule (UTC):</strong> {value.cronExpression}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Your Timezone:</strong> {timezone}
          </p>
          <p className="text-xs text-muted-foreground">
            {scheduleType === "repeat" && <strong>Schedule:</strong>}
            {scheduleType === "one-time" && (
              <>
                <strong>Local Time:</strong> {time}
              </>
            )}
            {scheduleType === "repeat" && (
              <>
                {repeatFrequency
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
                {["daily", "weekly", "monthly", "yearly"].includes(
                  repeatFrequency
                ) && ` at ${time}`}
              </>
            )}
          </p>
        </div>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}
