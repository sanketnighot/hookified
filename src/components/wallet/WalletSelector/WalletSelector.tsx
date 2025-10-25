"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Wallet, Plus } from "lucide-react";
import { WalletManager } from "../WalletManager/WalletManager";

interface WalletData {
  id: string;
  address: string;
  label?: string;
  createdAt: string;
}

interface WalletSelectorProps {
  selectedWalletId?: string;
  onWalletChange: (walletId: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function WalletSelector({
  selectedWalletId,
  onWalletChange,
  disabled = false,
  className = "",
}: WalletSelectorProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWalletManager, setShowWalletManager] = useState(false);

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      const response = await fetch("/api/wallets");
      if (!response.ok) throw new Error("Failed to fetch wallets");
      
      const data = await response.json();
      setWallets(data.wallets || []);
    } catch (error) {
      console.error("Failed to fetch wallets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getWalletDisplayName = (wallet: WalletData) => {
    const label = wallet.label || "Unnamed Wallet";
    const address = formatAddress(wallet.address);
    return `${label} (${address})`;
  };

  const handleWalletManagerClose = () => {
    setShowWalletManager(false);
    fetchWallets(); // Refresh wallets after manager closes
  };

  if (showWalletManager) {
    return (
      <WalletManager
        onWalletSelect={(walletId) => {
          onWalletChange(walletId);
          setShowWalletManager(false);
        }}
        selectedWalletId={selectedWalletId}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Wallet</Label>
        <div className="flex items-center justify-center p-4 border border-white/10 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Wallet</Label>
        <div className="p-4 border border-white/10 rounded-lg text-center">
          <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">
            No wallets found. Create one to use contract calls.
          </p>
          <Button
            onClick={() => setShowWalletManager(true)}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Manage Wallets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="wallet-select">Wallet</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowWalletManager(true)}
          className="text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Manage
        </Button>
      </div>
      
      <Select
        value={selectedWalletId || ""}
        onValueChange={(value) => onWalletChange(value || undefined)}
        disabled={disabled}
      >
        <SelectTrigger className="glass">
          <SelectValue placeholder="Select a wallet..." />
        </SelectTrigger>
        <SelectContent>
          {wallets.map((wallet) => (
            <SelectItem key={wallet.id} value={wallet.id}>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" />
                <span>{getWalletDisplayName(wallet)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <p className="text-xs text-muted-foreground">
        Select the wallet to use for signing transactions
      </p>
    </div>
  );
}