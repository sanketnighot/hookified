"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputParameter } from "@/lib/types";
import { tokenMetadataService } from "@/services/blockchain/TokenMetadataService";
import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

interface UintInputProps {
  parameter: InputParameter;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  decimals?: number;
  tokenSymbol?: string;
  tokenAddress?: string;
  chainId?: number;
}

export function UintInput({
  parameter,
  value,
  onChange,
  error,
  decimals = 18,
  tokenSymbol,
  tokenAddress,
  chainId
}: UintInputProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<{
    symbol: string;
    decimals: number;
  } | null>(null);

  // Auto-fetch token metadata if tokenAddress is provided
  useEffect(() => {
    if (tokenAddress && chainId && !tokenSymbol) {
      setIsLoadingMetadata(true);
      tokenMetadataService.fetchERC20Metadata(tokenAddress, chainId)
        .then(metadata => {
          setTokenMetadata({
            symbol: metadata.symbol,
            decimals: metadata.decimals
          });
        })
        .catch(error => {
          console.warn('Failed to fetch token metadata:', error);
        })
        .finally(() => {
          setIsLoadingMetadata(false);
        });
    }
  }, [tokenAddress, chainId, tokenSymbol]);

  useEffect(() => {
    if (value) {
      try {
        // Try to parse as BigInt to validate
        BigInt(value);
        setIsValid(true);
      } catch {
        setIsValid(false);
      }
    } else {
      setIsValid(true);
    }
  }, [value]);

  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);
    onChange(newValue);
  };

  const formatWithDecimals = (rawValue: string) => {
    if (!rawValue || rawValue === '0') return '0';

    try {
      const bigIntValue = BigInt(rawValue);
      const divisor = BigInt(10 ** decimals);
      const wholePart = bigIntValue / divisor;
      const fractionalPart = bigIntValue % divisor;

      if (fractionalPart === BigInt(0)) {
        return wholePart.toString();
      }

      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '');

      return `${wholePart}.${trimmedFractional}`;
    } catch {
      return rawValue;
    }
  };

  const parseToWei = (displayValue: string) => {
    if (!displayValue || displayValue === '0') return '0';

    try {
      const [whole, fractional = ''] = displayValue.split('.');
      const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals);
      const weiValue = BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFractional);
      return weiValue.toString();
    } catch {
      return displayValue;
    }
  };

  const handleMaxClick = async () => {
    if (tokenAddress && chainId) {
      try {
        // This would need the user's wallet address - for now just set a reasonable default
        const balance = await tokenMetadataService.getTokenBalance(
          '0x0000000000000000000000000000000000000000', // Placeholder - would need actual user address
          tokenAddress,
          chainId
        );
        handleChange(balance);
      } catch (error) {
        console.warn('Failed to fetch token balance:', error);
      }
    }
  };

  const refreshMetadata = () => {
    if (tokenAddress && chainId) {
      setIsLoadingMetadata(true);
      tokenMetadataService.fetchERC20Metadata(tokenAddress, chainId)
        .then(metadata => {
          setTokenMetadata({
            symbol: metadata.symbol,
            decimals: metadata.decimals
          });
        })
        .catch(error => {
          console.warn('Failed to fetch token metadata:', error);
        })
        .finally(() => {
          setIsLoadingMetadata(false);
        });
    }
  };

  const currentSymbol = tokenSymbol || tokenMetadata?.symbol || '';
  const currentDecimals = tokenMetadata?.decimals || decimals;

  return (
    <div className="space-y-2">
      <Label htmlFor={`param-${parameter.name}`}>
        {parameter.name || 'Amount'}
        {parameter.name && (
          <span className="text-xs text-muted-foreground ml-2">
            ({parameter.type})
          </span>
        )}
        {currentSymbol && (
          <span className="text-xs text-blue-400 ml-2">
            ({currentSymbol})
          </span>
        )}
        {tokenAddress && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={refreshMetadata}
            disabled={isLoadingMetadata}
            className="ml-2 p-1 h-auto text-xs text-gray-400 hover:text-gray-300"
          >
            {isLoadingMetadata ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <RefreshCw className="w-3 h-3" />
            )}
          </Button>
        )}
      </Label>
      <div className="relative">
        <Input
          id={`param-${parameter.name}`}
          type="text"
          placeholder="0"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          className={`glass ${!isValid ? 'border-red-500' : ''}`}
        />
        {currentSymbol && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
            {currentSymbol}
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {!isValid && value && (
        <p className="text-xs text-red-500">Invalid number format</p>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          onClick={() => handleChange('0')}
          className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
        >
          Clear
        </Button>
        {currentSymbol && (
          <Button
            type="button"
            onClick={handleMaxClick}
            className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
          >
            Max
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {currentDecimals > 0 ? `Enter amount (${currentDecimals} decimals)` : 'Enter numeric value'}
      </p>
    </div>
  );
}
