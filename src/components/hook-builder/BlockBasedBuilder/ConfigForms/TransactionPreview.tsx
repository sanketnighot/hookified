"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getChainById } from "@/lib/blockchain/chainConfig";
import { ActionConfig } from "@/lib/types";
import { tokenMetadataService } from "@/services/blockchain/TokenMetadataService";
import {
    AlertCircle,
    CheckCircle,
    Copy,
    DollarSign,
    ExternalLink,
    Fuel,
    Loader2
} from "lucide-react";
import { useEffect, useState } from "react";

interface TransactionPreviewProps {
  config: ActionConfig;
  onExecute?: () => void;
  onCancel?: () => void;
  isExecuting?: boolean;
}

export function TransactionPreview({
  config,
  onExecute,
  onCancel,
  isExecuting = false
}: TransactionPreviewProps) {
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const chain = getChainById(config.chainId || 1);
  const isNativeTransfer = config.isNativeTransfer;

  useEffect(() => {
    if (!isNativeTransfer && config.contractAddress && config.chainId) {
      setIsLoadingMetadata(true);
      tokenMetadataService.fetchERC20Metadata(config.contractAddress, config.chainId)
        .then(metadata => {
          setTokenMetadata(metadata);
        })
        .catch(error => {
          console.warn('Failed to fetch token metadata:', error);
        })
        .finally(() => {
          setIsLoadingMetadata(false);
        });
    }
  }, [config.contractAddress, config.chainId, isNativeTransfer]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string, decimals: number = 18, symbol?: string) => {
    try {
      const bigIntAmount = BigInt(amount);
      const divisor = BigInt(10 ** decimals);
      const wholePart = bigIntAmount / divisor;
      const fractionalPart = bigIntAmount % divisor;

      if (fractionalPart === BigInt(0)) {
        return `${wholePart.toString()}${symbol ? ` ${symbol}` : ''}`;
      }

      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '');

      return `${wholePart}.${trimmedFractional}${symbol ? ` ${symbol}` : ''}`;
    } catch {
      return `${amount}${symbol ? ` ${symbol}` : ''}`;
    }
  };

  const getOperationType = () => {
    if (isNativeTransfer) {
      return {
        type: 'Native Transfer',
        icon: '💰',
        color: 'bg-green-500/20 text-green-400 border-green-500/30'
      };
    } else {
      return {
        type: 'Contract Call',
        icon: '📄',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      };
    }
  };

  const operation = getOperationType();

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <span className="text-2xl">{operation.icon}</span>
            Transaction Preview
          </CardTitle>
          <Badge variant="outline" className={operation.color}>
            {operation.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Network Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Network
          </h4>
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <p className="text-sm text-white">{chain?.name}</p>
              <p className="text-xs text-gray-400">Chain ID: {config.chainId}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {chain?.testnet ? 'Testnet' : 'Mainnet'}
            </Badge>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Contract Information */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Contract
          </h4>
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-mono">
                  {formatAddress(config.contractAddress || '')}
                </p>
                {tokenMetadata && (
                  <p className="text-xs text-gray-400">
                    {tokenMetadata.name} ({tokenMetadata.symbol})
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(config.contractAddress || '')}
                className="p-1 h-auto"
              >
                {copiedAddress ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Operation Details */}
        {isNativeTransfer ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Transfer Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-gray-400">Recipient</span>
                <span className="text-sm text-white font-mono">
                  {formatAddress(config.parameters?.[0] || '')}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-gray-400">Amount</span>
                <span className="text-sm text-white">
                  {formatAmount(config.parameters?.[1] || '0', 18, chain?.nativeCurrency.symbol)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Function Call</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white/5 rounded">
                <span className="text-sm text-gray-400">Function</span>
                <span className="text-sm text-white font-mono">
                  {config.functionName}()
                </span>
              </div>
              {config.parameters && config.parameters.length > 0 && (
                <div className="p-2 bg-white/5 rounded">
                  <span className="text-sm text-gray-400 block mb-1">Parameters</span>
                  <div className="space-y-1">
                    {config.parameters.map((param, index) => (
                      <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Param {index + 1}</span>
                        <span className="text-white font-mono">
                          {typeof param === 'string' && param.startsWith('0x')
                            ? formatAddress(param)
                            : String(param)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <Separator className="bg-white/10" />

        {/* Gas Estimation */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Fuel className="w-4 h-4" />
            Gas Estimation
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white/5 rounded text-center">
              <p className="text-xs text-gray-400">Gas Limit</p>
              <p className="text-sm text-white">210,000</p>
            </div>
            <div className="p-2 bg-white/5 rounded text-center">
              <p className="text-xs text-gray-400">Gas Price</p>
              <p className="text-sm text-white">20 Gwei</p>
            </div>
          </div>
          <div className="p-2 bg-white/5 rounded text-center">
            <p className="text-xs text-gray-400">Estimated Cost</p>
            <p className="text-sm text-white flex items-center justify-center gap-1">
              <DollarSign className="w-3 h-3" />
              ~$2.50
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={onExecute}
            disabled={isExecuting}
            className="flex-1"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              'Execute Transaction'
            )}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isExecuting}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-400">
            <p className="font-medium mb-1">Important Notice</p>
            <p>
              This transaction will be executed on the blockchain and cannot be undone.
              Please verify all details before proceeding.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
