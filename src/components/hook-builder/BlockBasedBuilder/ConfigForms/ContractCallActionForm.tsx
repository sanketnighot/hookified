"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ActionConfig } from "@/lib/types";
import { useState } from "react";

interface ContractCallActionFormProps {
  config: ActionConfig;
  onChange: (config: ActionConfig) => void;
}

export function ContractCallActionForm({ config, onChange }: ContractCallActionFormProps) {
  const [contractAddress, setContractAddress] = useState(config.contractAddress || "");
  const [functionName, setFunctionName] = useState(config.functionName || "");
  const [parameters, setParameters] = useState(
    config.parameters ? JSON.stringify(config.parameters, null, 2) : ""
  );

  const handleContractChange = (value: string) => {
    setContractAddress(value);
    onChange({
      ...config,
      contractAddress: value,
    });
  };

  const handleFunctionChange = (value: string) => {
    setFunctionName(value);
    onChange({
      ...config,
      functionName: value,
    });
  };

  const handleParametersChange = (value: string) => {
    setParameters(value);
    try {
      const parsedParams = JSON.parse(value);
      onChange({
        ...config,
        parameters: parsedParams,
      });
    } catch {
      // Invalid JSON, don't update config
    }
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
          The smart contract address to call
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="function-name">Function Name</Label>
        <Input
          id="function-name"
          placeholder="transfer"
          value={functionName}
          onChange={(e) => handleFunctionChange(e.target.value)}
          className="glass"
        />
        <p className="text-xs text-muted-foreground">
          The function to call on the contract
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parameters">Parameters (JSON)</Label>
        <textarea
          id="parameters"
          placeholder='["0x...", "1000000000000000000"]'
          value={parameters}
          onChange={(e) => handleParametersChange(e.target.value)}
          className="w-full min-h-[80px] p-3 rounded-md glass border border-white/10 bg-transparent text-sm resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Function parameters as JSON array
        </p>
      </div>
    </div>
  );
}
