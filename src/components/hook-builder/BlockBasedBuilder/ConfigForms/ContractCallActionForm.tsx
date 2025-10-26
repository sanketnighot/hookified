"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getWriteFunctions } from "@/lib/blockchain/abiParser";
import { SUPPORTED_CHAINS, getChainById } from "@/lib/blockchain/chainConfig";
import {
  ContractTemplate,
  PresetFunction,
} from "@/lib/blockchain/contractTemplates";
import { getFunctionDescription } from "@/lib/blockchain/functionDescriptions";
import { ActionConfig } from "@/lib/types";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  Loader2,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DynamicParameterForm } from "../../DynamicForm/DynamicParameterForm";
import { ContractTemplateSelector } from "./ContractTemplateSelector";
import { TransactionPreview } from "./TransactionPreview";

interface ContractCallActionFormProps {
  config: ActionConfig;
  onChange: (config: ActionConfig) => void;
}

export function ContractCallActionForm({
  config,
  onChange,
}: ContractCallActionFormProps) {
  const [chainId, setChainId] = useState<number>(config.chainId || 1);
  const [contractAddress, setContractAddress] = useState(
    config.contractAddress || ""
  );
  const [isNativeTransfer, setIsNativeTransfer] = useState(
    config.isNativeTransfer || false
  );
  const [selectedFunction, setSelectedFunction] = useState<string>(
    config.functionName || ""
  );
  const [parameters, setParameters] = useState<any[]>(config.parameters || []);
  const [abi, setAbi] = useState<any[]>(config.abi || []);

  // Loading and error states
  const [isLoadingABI, setIsLoadingABI] = useState(false);
  const [abiError, setAbiError] = useState<string>("");
  const [contractInfo, setContractInfo] = useState<any>(null);

  // Native transfer fields
  const [recipientAddress, setRecipientAddress] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  // Template and preview states
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<ContractTemplate | null>(null);

  const selectedChain = getChainById(chainId);
  const writeFunctions = abi.length > 0 ? getWriteFunctions(abi) : [];
  const selectedFunc = writeFunctions.find((f) => f.name === selectedFunction);

  // Update config when any field changes
  useEffect(() => {
    const newConfig: ActionConfig = {
      ...config,
      chainId,
      contractAddress,
      isNativeTransfer,
      abi,
      functionName: selectedFunction,
      parameters,
    };

    if (isNativeTransfer) {
      // Convert human-readable amount to wei (18 decimals)
      const convertToWei = (amount: string): string => {
        if (!amount || amount === "0") return "0";
        try {
          const [whole, fractional = ""] = amount.split(".");
          const paddedFractional = fractional.padEnd(18, "0").slice(0, 18);
          const weiValue =
            BigInt(whole) * BigInt(10 ** 18) + BigInt(paddedFractional);
          return weiValue.toString();
        } catch {
          return amount;
        }
      };

      newConfig.parameters = [recipientAddress, convertToWei(transferAmount)];
    }

    onChange(newConfig);
  }, [
    chainId,
    contractAddress,
    isNativeTransfer,
    selectedFunction,
    parameters,
    abi,
    recipientAddress,
    transferAmount,
  ]);

  const handleChainChange = (newChainId: string) => {
    const chainIdNum = parseInt(newChainId);
    setChainId(chainIdNum);
    setAbi([]);
    setSelectedFunction("");
    setParameters([]);
    setAbiError("");
    setContractInfo(null);
  };

  const handleContractAddressChange = (value: string) => {
    setContractAddress(value);
    setAbi([]);
    setSelectedFunction("");
    setParameters([]);
    setAbiError("");
    setContractInfo(null);
  };

  const fetchContractABI = async () => {
    if (!contractAddress || !chainId) return;

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

      const { abi: fetchedABI, contractInfo: contractData } =
        await response.json();

      setAbi(fetchedABI);
      setContractInfo(contractData);

      // Auto-select first write function if available
      const writeFuncs = getWriteFunctions(fetchedABI);
      if (writeFuncs.length > 0) {
        setSelectedFunction(writeFuncs[0].name);
      }
    } catch (error) {
      setAbiError(
        error instanceof Error ? error.message : "Failed to fetch contract ABI"
      );
    } finally {
      setIsLoadingABI(false);
    }
  };

  const handleFunctionChange = (functionName: string) => {
    setSelectedFunction(functionName);
    setParameters([]);
  };

  const handleParametersChange = (newParameters: any[]) => {
    setParameters(newParameters);
  };

  const handleTemplateSelect = (template: ContractTemplate) => {
    setSelectedTemplate(template);
    setAbi(template.abi);
    setContractInfo({
      name: template.name,
      isVerified: true,
    });
    setShowTemplateSelector(false);
  };

  const handlePresetFunctionSelect = (
    template: ContractTemplate,
    presetFunction: PresetFunction
  ) => {
    setSelectedTemplate(template);
    setAbi(template.abi);
    setSelectedFunction(presetFunction.name);

    // Initialize parameters with default values
    const defaultParams = presetFunction.examples?.[0]?.parameters || [];
    setParameters(defaultParams);

    setContractInfo({
      name: template.name,
      isVerified: true,
    });
    setShowTemplateSelector(false);
  };

  const handlePreviewToggle = () => {
    setShowPreview(!showPreview);
  };

  const renderContractStatus = () => {
    if (isLoadingABI) {
      return (
        <div className="flex items-center gap-2 text-blue-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Fetching contract...</span>
        </div>
      );
    }

    if (abiError) {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <XCircle className="w-4 h-4" />
          <span className="text-sm">{abiError}</span>
        </div>
      );
    }

    if (contractInfo) {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">
            {contractInfo.isVerified
              ? "Verified contract"
              : "Unverified contract"}
            {contractInfo.name && ` - ${contractInfo.name}`}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chain Selection */}
      <div className="space-y-2">
        <Label htmlFor="chain-select">Chain</Label>
        <Select value={chainId.toString()} onValueChange={handleChainChange}>
          <SelectTrigger className="glass">
            <SelectValue placeholder="Select chain..." />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_CHAINS.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                <div className="flex items-center gap-2">
                  <span>{chain.name}</span>
                  {chain.testnet && (
                    <span className="text-xs text-yellow-400">(Testnet)</span>
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

      {/* Contract Address */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="contract-address">Contract Address</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="text-xs"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              Templates
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviewToggle}
              className="text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            id="contract-address"
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
        {renderContractStatus()}
        <p className="text-xs text-muted-foreground">
          The smart contract address to interact with
        </p>
      </div>

      {/* Operation Type */}
      <div className="space-y-2">
        <Label>Operation Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="operation-type"
              checked={isNativeTransfer}
              onChange={() => setIsNativeTransfer(true)}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm">Native Transfer</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="operation-type"
              checked={!isNativeTransfer}
              onChange={() => setIsNativeTransfer(false)}
              className="w-4 h-4 text-blue-600 bg-transparent border-white/30 focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm">Contract Function Call</span>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          Choose between native token transfer or smart contract interaction
        </p>
      </div>

      {/* Native Transfer Form */}
      {isNativeTransfer && (
        <div className="space-y-4 p-4 border border-white/10 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400">Native Transfer</h4>

          <div className="space-y-2">
            <Label htmlFor="recipient-address">Recipient Address</Label>
            <Input
              id="recipient-address"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="glass"
            />
            <p className="text-xs text-muted-foreground">
              Address to receive the native token
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount</Label>
            <div className="relative">
              <Input
                id="transfer-amount"
                type="text"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="glass"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                {selectedChain?.nativeCurrency.symbol}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Amount to transfer in {selectedChain?.nativeCurrency.symbol}{" "}
              (e.g., 0.1 = 0.1 {selectedChain?.nativeCurrency.symbol})
            </p>
          </div>
        </div>
      )}

      {/* Contract Function Form */}
      {!isNativeTransfer && abi.length > 0 && (
        <div className="space-y-4 p-4 border border-white/10 rounded-lg">
          <h4 className="text-sm font-medium text-blue-400">
            Contract Function
          </h4>

          {/* Function Selection */}
          <div className="space-y-2">
            <Label htmlFor="function-select">Function</Label>
            <Select
              value={selectedFunction}
              onValueChange={handleFunctionChange}
            >
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select function..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {writeFunctions.map((func) => {
                  // Show simplified signature in dropdown
                  const params = func.inputs
                    .map((input) => input.name || input.type)
                    .join(", ");
                  const isSelected = selectedFunction === func.name;

                  return (
                    <SelectItem
                      key={func.name}
                      value={func.name}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-blue-500/20 border-l-2 border-blue-400"
                          : "hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span
                          className={`font-medium ${
                            isSelected ? "text-blue-300" : ""
                          }`}
                        >
                          {func.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex-1">
                          ({params})
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose what action to perform on the contract
            </p>
          </div>

          {/* Function Description Card */}
          {selectedFunc &&
            (() => {
              const description = getFunctionDescription(selectedFunc.name);
              if (!description) return null;

              return (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-300 mb-1">
                        {description.description}
                      </p>
                      <p className="text-xs text-blue-400/70">
                        {description.example}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

          {/* Function Parameters */}
          {selectedFunc && (
            <div className="space-y-2">
              <Label>Parameters</Label>
              <DynamicParameterForm
                parameters={selectedFunc.inputs}
                values={parameters}
                onChange={handleParametersChange}
              />
            </div>
          )}
        </div>
      )}

      {/* No ABI loaded message */}
      {!isNativeTransfer && abi.length === 0 && !isLoadingABI && !abiError && (
        <div className="flex items-center gap-2 text-yellow-400 p-4 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            Enter a contract address and click "Fetch" to load available
            functions
          </span>
        </div>
      )}

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <ContractTemplateSelector
          onSelectTemplate={handleTemplateSelect}
          onSelectFunction={handlePresetFunctionSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* Transaction Preview */}
      {showPreview && (
        <div className="mt-6">
          <TransactionPreview
            config={{
              type: "CONTRACT_CALL",
              contractAddress,
              functionName: selectedFunction,
              parameters: isNativeTransfer
                ? [recipientAddress, transferAmount]
                : parameters,
              chainId,
              isNativeTransfer,
              abi,
            }}
            onCancel={() => setShowPreview(false)}
          />
        </div>
      )}
    </div>
  );
}
