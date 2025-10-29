"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getEventByName, getEvents } from "@/lib/blockchain/abiParser";
import { EventMonitor } from "@/lib/types";
import { AlertCircle, CheckCircle, Eye, Loader2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { EventFilterBuilder } from "./EventFilterBuilder";
import { EventPreview } from "./EventPreview";

interface EventConfigCardProps {
  event: EventMonitor;
  index: number;
  chainId: number;
  onUpdate: (updatedEvent: EventMonitor) => void;
  onRemove?: () => void;
  showTemplateSelector?: () => void;
}

export function EventConfigCard({
  event,
  index,
  chainId,
  onUpdate,
  onRemove,
  showTemplateSelector,
}: EventConfigCardProps) {
  const [contractAddress, setContractAddress] = useState(event.contractAddress || "");
  const [eventName, setEventName] = useState(event.eventName || "");
  const [abi, setAbi] = useState<any[]>(event.abi || []);
  const [showPreview, setShowPreview] = useState(false);

  // Loading and error states
  const [isLoadingABI, setIsLoadingABI] = useState(false);
  const [abiError, setAbiError] = useState<string>("");
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);

  const fetchContractABI = async () => {
    if (!contractAddress || !chainId) return;

    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      setAbiError("Invalid contract address format");
      return;
    }

    setIsLoadingABI(true);
    setAbiError("");

    try {
      const response = await fetch("/api/contract/abi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contractAddress,
          chainId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch contract ABI");
      }

      const { abi: fetchedABI, contractInfo: contractData } = await response.json();

      setAbi(fetchedABI);
      setContractInfo(contractData);

      // Extract available events from ABI
      const events = getEvents(fetchedABI);
      setAvailableEvents(events);

      // Auto-select first event if none selected
      if (!eventName && events.length > 0) {
        const newEventName = events[0].name;
        setEventName(newEventName);
        handleUpdate({ ...event, eventName: newEventName, abi: fetchedABI, contractAddress });
      } else {
        handleUpdate({ ...event, abi: fetchedABI, contractAddress });
      }
    } catch (error) {
      setAbiError(
        error instanceof Error ? error.message : "Failed to fetch contract ABI"
      );
      setAbi([]);
      setAvailableEvents([]);
      setContractInfo(null);
    } finally {
      setIsLoadingABI(false);
    }
  };

  const handleUpdate = (updates: Partial<EventMonitor>) => {
    const updated = { ...event, ...updates };
    onUpdate(updated);
  };

  const handleEventChange = (newEventName: string) => {
    setEventName(newEventName);

    // Get event ABI
    const eventAbi = getEventByName(abi, newEventName);

    handleUpdate({
      eventName: newEventName,
      abi,
      filters: [], // Reset filters when event changes
    });
  };

  const handleFiltersChange = (filters: any[]) => {
    handleUpdate({ filters });
  };

  const handleContractAddressChange = (value: string) => {
    setContractAddress(value);
    setAbi([]);
    setAvailableEvents([]);
    setAbiError("");
    setContractInfo(null);
    setEventName("");
    handleUpdate({ contractAddress: value, abi: [], eventName: "", filters: [] });
  };

  const selectedEventAbi = getEventByName(abi, eventName);
  const eventParameters = selectedEventAbi?.inputs || [];

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-white">
            Event {index + 1}
            {onRemove && (
              <Badge variant="outline" className="ml-2 text-xs">
                Multi-mode
              </Badge>
            )}
          </CardTitle>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contract Address */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`contract-address-${index}`}>Contract Address</Label>
            {showTemplateSelector && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={showTemplateSelector}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Templates
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              id={`contract-address-${index}`}
              placeholder="0x..."
              value={contractAddress}
              onChange={(e) => handleContractAddressChange(e.target.value)}
              className="glass flex-1"
            />
            <Button
              type="button"
              onClick={fetchContractABI}
              disabled={!contractAddress || isLoadingABI}
              variant="outline"
              className="px-4"
            >
              {isLoadingABI ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Fetch"
              )}
            </Button>
          </div>

          {isLoadingABI && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Fetching contract...</span>
            </div>
          )}

          {abiError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{abiError}</span>
            </div>
          )}

          {contractInfo && abi.length > 0 && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>
                {contractInfo.isVerified
                  ? "Verified contract"
                  : "Unverified contract"}
                {contractInfo.name && ` - ${contractInfo.name}`}
                {availableEvents.length > 0 && ` • ${availableEvents.length} events`}
              </span>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            The smart contract address to monitor
          </p>
        </div>

        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor={`event-name-${index}`}>Event Name</Label>
          {availableEvents.length > 0 ? (
            <Select value={eventName} onValueChange={handleEventChange}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((evt) => (
                  <SelectItem key={evt.name} value={evt.name}>
                    <div className="flex items-center gap-2">
                      <span>{evt.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {evt.inputs?.map((i: any) => i.type).join(", ")}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={`event-name-${index}`}
              placeholder="Transfer"
              value={eventName}
              onChange={(e) => handleEventChange(e.target.value)}
              className="glass"
            />
          )}
          <p className="text-xs text-muted-foreground">
            {availableEvents.length > 0
              ? "Select the event to monitor from the contract ABI"
              : "The event name to listen for (e.g., Transfer, Approval)"}
          </p>
        </div>

        {/* Filters */}
        {selectedEventAbi && eventParameters.length > 0 && (
          <EventFilterBuilder
            eventParameters={eventParameters}
            filters={event.filters || []}
            onChange={handleFiltersChange}
          />
        )}

        {/* Preview Toggle */}
        {eventName && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>
        )}

        {/* Event Preview */}
        {showPreview && eventName && (
          <EventPreview event={{ ...event, eventName, abi }} abi={abi} />
        )}

        {/* No ABI loaded message */}
        {abi.length === 0 && !isLoadingABI && !abiError && contractAddress && (
          <div className="flex items-center gap-2 text-yellow-400 p-4 border border-yellow-500/20 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>
              Enter a contract address and click "Fetch" to load available events
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

