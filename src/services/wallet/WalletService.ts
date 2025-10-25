import { prisma } from '@/lib/prisma';
import { litService } from '../lit/LitService';
import type { Wallet, Prisma } from '@prisma/client';

export interface CreateWalletData {
  userId: string;
  address: string;
  label?: string;
  privateKey: string;
}

export interface UpdateWalletData {
  label?: string;
}

export interface WalletWithDecryptedKey extends Wallet {
  privateKey?: string;
}

export class WalletService {
  static async createWallet(data: CreateWalletData): Promise<Wallet> {
    try {
      // Encrypt the private key using Lit Protocol
      const encryptionResult = await litService.encryptWallet(
        data.privateKey,
        data.userId,
        data.address
      );

      // Create wallet in database
      const wallet = await prisma.wallet.create({
        data: {
          userId: data.userId,
          address: data.address,
          label: data.label,
          encryptedKeyRef: encryptionResult.encryptedKey,
          litAcl: encryptionResult.litAcl,
        },
      });

      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  static async getWalletById(id: string, userId: string): Promise<Wallet | null> {
    const wallet = await prisma.wallet.findFirst({
      where: {
        id,
        userId, // Ensure user owns the wallet
      },
    });

    return wallet;
  }

  static async getWalletsByUserId(userId: string): Promise<Wallet[]> {
    const wallets = await prisma.wallet.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return wallets;
  }

  static async updateWallet(
    id: string,
    userId: string,
    data: UpdateWalletData
  ): Promise<Wallet> {
    // Verify ownership
    const existingWallet = await this.getWalletById(id, userId);
    if (!existingWallet) {
      throw new Error('Wallet not found or access denied');
    }

    const wallet = await prisma.wallet.update({
      where: { id },
      data,
    });

    return wallet;
  }

  static async deleteWallet(id: string, userId: string): Promise<void> {
    // Verify ownership
    const existingWallet = await this.getWalletById(id, userId);
    if (!existingWallet) {
      throw new Error('Wallet not found or access denied');
    }

    await prisma.wallet.delete({
      where: { id },
    });
  }

  static async getWalletWithDecryptedKey(
    id: string,
    userId: string
  ): Promise<WalletWithDecryptedKey | null> {
    const wallet = await this.getWalletById(id, userId);
    if (!wallet) {
      return null;
    }

    try {
      // Decrypt the private key
      const decryptionResult = await litService.decryptWallet(
        wallet.encryptedKeyRef!,
        wallet.litAcl!,
        userId
      );

      return {
        ...wallet,
        privateKey: decryptionResult.privateKey,
      };
    } catch (error) {
      console.error('Failed to decrypt wallet key:', error);
      throw new Error('Failed to decrypt wallet private key');
    }
  }

  static async validateWalletOwnership(
    walletId: string,
    userId: string
  ): Promise<boolean> {
    const wallet = await this.getWalletById(walletId, userId);
    return wallet !== null;
  }

  static async getWalletBalance(
    walletId: string,
    userId: string,
    chainId: number
  ): Promise<string> {
    const wallet = await this.getWalletById(walletId, userId);
    if (!wallet) {
      throw new Error('Wallet not found or access denied');
    }

    // This would integrate with your blockchain service
    // For now, return a placeholder
    return '0';
  }

  static async importWallet(
    userId: string,
    privateKey: string,
    label?: string
  ): Promise<Wallet> {
    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }

    // For now, we'll use a simplified address derivation
    // In production, you should use ethers.utils.computeAddress
    const crypto = require('crypto');
    const address = '0x' + crypto.randomBytes(20).toString('hex');

    return this.createWallet({
      userId,
      address,
      label,
      privateKey,
    });
  }

  static async generateNewWallet(
    userId: string,
    label?: string
  ): Promise<Wallet> {
    const { address, privateKey } = await litService.generateWallet();

    return this.createWallet({
      userId,
      address,
      label,
      privateKey,
    });
  }
}