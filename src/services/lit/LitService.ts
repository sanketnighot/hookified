import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LitAuthClient } from '@lit-protocol/lit-auth-client';
import { LitContracts } from '@lit-protocol/contracts-sdk';
import { AuthMethodScope } from '@lit-protocol/constants';
import { createHash } from 'crypto';

export interface LitConfig {
  litNodeClient: LitNodeClient;
  litAuthClient: LitAuthClient;
  litContracts: LitContracts;
}

export interface WalletEncryptionResult {
  encryptedKey: string;
  accessControlConditions: any[];
  litAcl: string;
}

export interface WalletDecryptionResult {
  privateKey: string;
}

export class LitService {
  private static instance: LitService;
  private litNodeClient: LitNodeClient;
  private litAuthClient: LitAuthClient;
  private litContracts: LitContracts;
  private isConnected = false;

  private constructor() {
    this.litNodeClient = new LitNodeClient({
      litNetwork: 'cayenne', // Use testnet for development
      debug: process.env.NODE_ENV === 'development',
    });

    this.litAuthClient = new LitAuthClient({
      litRelayConfig: {
        relayApiKey: process.env.LIT_RELAY_API_KEY || '',
      },
      litNodeClient: this.litNodeClient,
    });

    this.litContracts = new LitContracts({
      litNodeClient: this.litNodeClient,
    });
  }

  public static getInstance(): LitService {
    if (!LitService.instance) {
      LitService.instance = new LitService();
    }
    return LitService.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.litNodeClient.connect();
      await this.litContracts.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Failed to connect to Lit Protocol:', error);
      throw new Error('Failed to connect to Lit Protocol');
    }
  }

  public async encryptWallet(
    privateKey: string,
    userId: string,
    walletAddress: string
  ): Promise<WalletEncryptionResult> {
    await this.connect();

    // Create access control conditions for the specific user
    const accessControlConditions = [
      {
        contractAddress: '',
        standardContractType: '',
        chain: 'ethereum',
        method: '',
        parameters: [':userAddress'],
        returnValueTest: {
          comparator: '=',
          value: userId,
        },
      },
    ];

    // Convert private key to Uint8Array
    const privateKeyBytes = new Uint8Array(
      privateKey.startsWith('0x') 
        ? privateKey.slice(2).match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
        : privateKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    try {
      // Encrypt the private key
      const { ciphertext, dataToEncryptHash } = await this.litNodeClient.encrypt(
        {
          accessControlConditions,
          authSig: await this.getAuthSig(),
          chain: 'ethereum',
          dataToEncrypt: privateKeyBytes,
        }
      );

      // Create a hash of the access control conditions for storage
      const litAcl = createHash('sha256')
        .update(JSON.stringify(accessControlConditions))
        .digest('hex');

      return {
        encryptedKey: Buffer.from(ciphertext).toString('base64'),
        accessControlConditions,
        litAcl,
      };
    } catch (error) {
      console.error('Failed to encrypt wallet:', error);
      throw new Error('Failed to encrypt wallet private key');
    }
  }

  public async decryptWallet(
    encryptedKey: string,
    litAcl: string,
    userId: string
  ): Promise<WalletDecryptionResult> {
    await this.connect();

    try {
      // Reconstruct access control conditions from stored hash
      // In a real implementation, you'd store the full conditions
      const accessControlConditions = [
        {
          contractAddress: '',
          standardContractType: '',
          chain: 'ethereum',
          method: '',
          parameters: [':userAddress'],
          returnValueTest: {
            comparator: '=',
            value: userId,
          },
        },
      ];

      // Convert base64 encrypted key back to Uint8Array
      const encryptedKeyBytes = new Uint8Array(
        Buffer.from(encryptedKey, 'base64')
      );

      // Decrypt the private key
      const decryptedData = await this.litNodeClient.decrypt(
        {
          accessControlConditions,
          ciphertext: encryptedKeyBytes,
          dataToEncryptHash: '', // This would need to be stored separately
          authSig: await this.getAuthSig(),
          chain: 'ethereum',
        }
      );

      // Convert decrypted bytes back to hex string
      const privateKey = '0x' + Array.from(decryptedData)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

      return { privateKey };
    } catch (error) {
      console.error('Failed to decrypt wallet:', error);
      throw new Error('Failed to decrypt wallet private key');
    }
  }

  private async getAuthSig(): Promise<any> {
    // This is a simplified auth signature for server-side use
    // In a real implementation, you'd need proper authentication
    return {
      sig: '0x',
      derivedVia: 'web3.eth.personal.sign',
      signedMessage: 'Lit Protocol authentication',
      address: '0x',
    };
  }

  public async generateWallet(): Promise<{ address: string; privateKey: string }> {
    // Generate a new wallet using crypto
    const crypto = require('crypto');
    const privateKey = '0x' + crypto.randomBytes(32).toString('hex');
    
    // For now, we'll use a simplified address generation
    // In production, you should use ethers.utils.computeAddress or similar
    const address = '0x' + crypto.randomBytes(20).toString('hex');
    
    return { address, privateKey };
  }

  public async validateWalletAccess(
    walletId: string,
    userId: string
  ): Promise<boolean> {
    // Validate that the user has access to the wallet
    // This would check database permissions
    return true; // Placeholder
  }
}

export const litService = LitService.getInstance();