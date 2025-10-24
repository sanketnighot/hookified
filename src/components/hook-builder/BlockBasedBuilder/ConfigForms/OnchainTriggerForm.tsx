"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TriggerConfig } from "@/lib/types";
import { useState } from "react";

interface OnchainTriggerFormProps {
  config: TriggerConfig;
  onChange: (config: TriggerConfig) => void;
}

const CHAIN_OPTIONS = [
  { id: 1, name: "Ethereum Mainnet", symbol: "ETH" },
  { id: 137, name: "Polygon", symbol: "MATIC" },
  { id: 56, name: "BSC", symbol: "BNB" },
  { id: 42161, name: "Arbitrum", symbol: "ETH" },
  { id: 10, name: "Optimism", symbol: "ETH" },
];

export function OnchainTriggerForm({ config, onChange }: OnchainTriggerFormProps) {
  const [contractAddress, setContractAddress] = useState(config.contractAddress || "");
  const [eventName, setEventName] = useState(config.eventName || "");
  const [chainId, setChainId] = useState(config.chainId || 1);

  const handleContractChange = (value: string) => {
    setContractAddress(value);
    onChange({
      ...config,
      contractAddress: value,
    });
  };

  const handleEventChange = (value: string) => {
    setEventName(value);
    onChange({
      ...config,
      eventName: value,
    });
  };

  const handleChainChange = (value: string) => {
    const newChainId = parseInt(value);
    setChainId(newChainId);
    onChange({
      ...config,
      chainId: newChainId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="contract-address">Contract Address</Label>
        <Input
          id="contract-address"
          placeholder="0x..."
          value={contractAddress}
          onChange={(e) => handleContractChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          The smart contract address to monitor
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="event-name">Event Name</Label>
        <Input
          id="event-name"
          placeholder="Transfer"
          value={eventName}
          onChange={(e) => handleEventChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          The event name to listen for (e.g., Transfer, Approval)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chain">Blockchain Network</Label>
        <Select value={chainId.toString()} onValueChange={handleChainChange}>
          <SelectTrigger className="glass">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {CHAIN_OPTIONS.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
