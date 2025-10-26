"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";

interface CronScheduleFieldProps {
  value: {
    cronExpression?: string;
    timezone?: string;
  };
  onChange: (value: { cronExpression?: string; timezone?: string }) => void;
  error?: string;
}

type ScheduleType = "one-time" | "repeat";
type RepeatFrequency = "daily" | "weekly" | "monthly" | "yearly";

export function CronScheduleField({
  value,
  onChange,
  error,
}: CronScheduleFieldProps) {
  const [scheduleType, setScheduleType] = useState<ScheduleType>("repeat");
  const [repeatFrequency, setRepeatFrequency] =
    useState<RepeatFrequency>("daily");
  const [time, setTime] = useState("09:00");
  const [date, setDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1"); // Monday
  const [timezone] = useState(() => {
    // Detect user's timezone
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "UTC";
    }
  });
  const [initialized, setInitialized] = useState(false);

  // Parse existing cron expression when editing
  useEffect(() => {
    if (!initialized && value?.cronExpression) {
      const cron = value.cronExpression.trim().split(/\s+/);
      if (cron.length === 5) {
        const [minute, hour, dayOfMonth, month, weekday] = cron;

        // Set time
        setTime(`${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`);

        // Determine frequency
        if (weekday !== "*") {
          setRepeatFrequency("weekly");
          setDayOfWeek(weekday);
        } else if (dayOfMonth === "1" && month !== "*") {
          if (month === "1") {
            setRepeatFrequency("yearly");
          } else {
            setRepeatFrequency("monthly");
          }
        } else {
          setRepeatFrequency("daily");
        }
      }
      setInitialized(true);
    }
  }, [value?.cronExpression, initialized]);

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

      console.log(
        `Converting time ${time} in timezone ${timezone} to UTC: ${utcHours}:${utcMinutes}`
      );

      switch (repeatFrequency) {
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

    // Don't call onChange if we're still initializing from existing value
    if (!initialized && value?.cronExpression) {
      // Wait for initialization to complete
      return;
    }

    // Always call onChange for new values or when initialized
    if (cronExpression && scheduleType === "repeat") {
      // For repeat schedules, we always have a valid cron expression
      const newValue = { cronExpression, timezone };
      onChange(newValue);
    } else if (cronExpression && scheduleType === "one-time") {
      // For one-time, only call onChange if we have a date
      const newValue = { cronExpression, timezone };
      onChange(newValue);
    } else if (
      scheduleType === "repeat" &&
      !initialized &&
      !value?.cronExpression
    ) {
      // Generate default on first render
      const newValue = { cronExpression, timezone };
      onChange(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scheduleType,
    repeatFrequency,
    time,
    date,
    dayOfWeek,
    timezone,
    initialized,
  ]);

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
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection */}
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
            <strong>Local Time:</strong> {time}{" "}
            {scheduleType === "repeat" ? `(${repeatFrequency})` : ""}
          </p>
        </div>
      )}

      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}
