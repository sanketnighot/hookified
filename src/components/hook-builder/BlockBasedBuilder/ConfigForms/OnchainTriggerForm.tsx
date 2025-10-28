"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CHAINS } from "@/lib/blockchain/chainConfig";
import { migrateOnchainConfig } from "@/lib/migrations/onchainConfigMigration";
import { EventMonitor, TriggerConfig } from "@/lib/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { EventConfigCard } from "./EventConfigCard";
import { EventTemplateSelector } from "./EventTemplateSelector";

interface OnchainTriggerFormProps {
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

export function OnchainTriggerForm({
  config,
  onChange,
}: OnchainTriggerFormProps) {
  // Normalize config (ensure it's migrated)
  const normalizedConfig = migrateOnchainConfig(config);

  const [mode, setMode] = useState<"single" | "multi">(
    normalizedConfig.mode || "single"
  );
  const [chainId, setChainId] = useState(normalizedConfig.chainId || 1);
  const [events, setEvents] = useState<EventMonitor[]>(
    normalizedConfig.events || []
  );
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templateSelectorForIndex, setTemplateSelectorForIndex] = useState<
    number | null
  >(null);

  // Initialize events if empty (legacy format)
  useEffect(() => {
    if (
      events.length === 0 &&
      normalizedConfig.contractAddress &&
      normalizedConfig.eventName
    ) {
      const legacyEvent: EventMonitor = {
        id: `event_${Date.now()}`,
        contractAddress: normalizedConfig.contractAddress,
        eventName: normalizedConfig.eventName,
        abi: normalizedConfig.abi,
        filters: [],
      };
      setEvents([legacyEvent]);
    }
  }, []);

  // Update parent config when internal state changes
  useEffect(() => {
    const newConfig: TriggerConfig = {
      type: "ONCHAIN",
      mode,
      chainId,
      events,
      // Keep legacy fields for backward compatibility
      contractAddress:
        mode === "single" && events.length > 0
          ? events[0].contractAddress
          : undefined,
      eventName:
        mode === "single" && events.length > 0
          ? events[0].eventName
          : undefined,
      abi: mode === "single" && events.length > 0 ? events[0].abi : undefined,
    };

    onChange(newConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, chainId, events]);

  const handleModeChange = (newMode: "single" | "multi") => {
    setMode(newMode);

    // If switching to single mode and have multiple events, keep first
    if (newMode === "single" && events.length > 1) {
      setEvents([events[0]]);
    }

    // If switching to multi mode and have no events, ensure at least one
    if (newMode === "multi" && events.length === 0) {
      const emptyEvent: EventMonitor = {
        id: `event_${Date.now()}`,
        contractAddress: "",
        eventName: "",
        filters: [],
      };
      setEvents([emptyEvent]);
    }
  };

  const handleChainChange = (value: string) => {
    const newChainId = parseInt(value);
    setChainId(newChainId);

    // Clear ABI when chain changes (user needs to fetch again)
    setEvents(
      events.map((event) => ({
        ...event,
        abi: [],
      }))
    );
  };

  const handleEventUpdate = (index: number, updatedEvent: EventMonitor) => {
    const newEvents = [...events];
    newEvents[index] = updatedEvent;
    setEvents(newEvents);
  };

  const handleEventRemove = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
  };

  const handleAddEvent = () => {
    const newEvent: EventMonitor = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contractAddress: "",
      eventName: "",
      filters: [],
    };
    setEvents([...events, newEvent]);
  };

  const handleTemplateSelect = (eventMonitor: EventMonitor) => {
    if (templateSelectorForIndex !== null) {
      // Update specific event
      handleEventUpdate(templateSelectorForIndex, eventMonitor);
      setTemplateSelectorForIndex(null);
    } else {
      // Add new event or replace first if single mode
      if (mode === "single") {
        setEvents([eventMonitor]);
      } else {
        setEvents([...events, eventMonitor]);
      }
    }
    setShowTemplateSelector(false);
  };

  // Ensure at least one event exists on mount
  useEffect(() => {
    if (
      events.length === 0 &&
      !normalizedConfig.contractAddress &&
      !normalizedConfig.eventName
    ) {
      const emptyEvent: EventMonitor = {
        id: `event_${Date.now()}`,
        contractAddress: "",
        eventName: "",
        filters: [],
      };
      setEvents([emptyEvent]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Chain Selection */}
      <div className="space-y-2">
        <Label htmlFor="chain">Blockchain Network</Label>
        <Select value={chainId.toString()} onValueChange={handleChainChange}>
          <SelectTrigger className="glass">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{chain.name}</span>
                  {chain.testnet && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    >
                      Testnet
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Select the blockchain network
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="space-y-2">
        <Label>Monitor Mode</Label>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="monitor-mode"
              checked={mode === "single"}
              onChange={() => handleModeChange("single")}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm">Single Event</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="monitor-mode"
              checked={mode === "multi"}
              onChange={() => handleModeChange("multi")}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm">Multiple Events</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === "single"
            ? "Monitor a single event from one contract"
            : "Monitor multiple events from one or more contracts"}
        </p>
        {mode === "multi" && (
          <Badge
            variant="outline"
            className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            {events.length} {events.length === 1 ? "Event" : "Events"}{" "}
            configured
          </Badge>
        )}
      </div>

      {/* Event Configuration Cards */}
      <div className="space-y-4">
        {events.map((event, index) => (
          <EventConfigCard
            key={event.id}
            event={event}
            index={index}
            chainId={chainId}
            onUpdate={(updated) => handleEventUpdate(index, updated)}
            onRemove={
              mode === "multi" && events.length > 1
                ? () => handleEventRemove(index)
                : undefined
            }
            showTemplateSelector={() => {
              setTemplateSelectorForIndex(index);
              setShowTemplateSelector(true);
            }}
          />
        ))}
      </div>

      {/* Add Event Button (Multi-mode only) */}
      {mode === "multi" && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddEvent}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Event
        </Button>
      )}

      {/* Template Selector */}
      {showTemplateSelector && (
        <EventTemplateSelector
          onSelectEvent={handleTemplateSelect}
          onClose={() => {
            setShowTemplateSelector(false);
            setTemplateSelectorForIndex(null);
          }}
          chainId={chainId}
        />
      )}
    </div>
  );
}
