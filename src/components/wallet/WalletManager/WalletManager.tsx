"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Plus, Key, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface WalletData {
  id: string;
  address: string;
  label?: string;
  createdAt: string;
}

interface WalletManagerProps {
  onWalletSelect?: (walletId: string) => void;
  selectedWalletId?: string;
}

export function WalletManager({ onWalletSelect, selectedWalletId }: WalletManagerProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importKey, setImportKey] = useState("");
  const [walletLabel, setWalletLabel] = useState("");

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
      toast.error("Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  };

  const generateWallet = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "generate",
          label: walletLabel || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate wallet");
      }

      const data = await response.json();
      setWallets(prev => [data.wallet, ...prev]);
      setWalletLabel("");
      setIsDialogOpen(false);
      toast.success("Wallet generated successfully");
    } catch (error) {
      console.error("Failed to generate wallet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate wallet");
    } finally {
      setIsGenerating(false);
    }
  };

  const importWallet = async () => {
    if (!importKey.trim()) {
      toast.error("Please enter a private key");
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "import",
          privateKey: importKey.trim(),
          label: walletLabel || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to import wallet");
      }

      const data = await response.json();
      setWallets(prev => [data.wallet, ...prev]);
      setImportKey("");
      setWalletLabel("");
      setIsDialogOpen(false);
      toast.success("Wallet imported successfully");
    } catch (error) {
      console.error("Failed to import wallet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to import wallet");
    } finally {
      setIsImporting(false);
    }
  };

  const deleteWallet = async (walletId: string) => {
    if (!confirm("Are you sure you want to delete this wallet?")) return;

    try {
      const response = await fetch(`/api/wallets/${walletId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete wallet");
      }

      setWallets(prev => prev.filter(w => w.id !== walletId));
      toast.success("Wallet deleted successfully");
    } catch (error) {
      console.error("Failed to delete wallet:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete wallet");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Wallet Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Wallet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Wallet</DialogTitle>
              <DialogDescription>
                Generate a new wallet or import an existing one
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="wallet-label">Wallet Label (Optional)</Label>
                <Input
                  id="wallet-label"
                  placeholder="My Wallet"
                  value={walletLabel}
                  onChange={(e) => setWalletLabel(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="import-key">Private Key (for import)</Label>
                <Input
                  id="import-key"
                  type="password"
                  placeholder="0x..."
                  value={importKey}
                  onChange={(e) => setImportKey(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateWallet}
                  disabled={isGenerating || isImporting}
                  className="flex-1"
                >
                  {isGenerating ? "Generating..." : "Generate New"}
                </Button>
                <Button
                  onClick={importWallet}
                  disabled={isGenerating || isImporting || !importKey.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {isImporting ? "Importing..." : "Import Existing"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Wallets Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first wallet to start using contract call actions
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <Card 
              key={wallet.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedWalletId === wallet.id 
                  ? "ring-2 ring-blue-500 bg-blue-50/10" 
                  : ""
              }`}
              onClick={() => onWalletSelect?.(wallet.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-sm">
                      {wallet.label || "Unnamed Wallet"}
                    </CardTitle>
                  </div>
                  {selectedWalletId === wallet.id && (
                    <Badge variant="default" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
                <CardDescription className="font-mono text-xs">
                  {formatAddress(wallet.address)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Key className="w-3 h-3" />
                    <span>Encrypted</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWallet(wallet.id);
                    }}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}