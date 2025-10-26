import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/services/wallet/WalletService';
import { litService } from '@/services/lit/LitService';

export async function GET(request: NextRequest) {
  try {
    // Test Lit Protocol connection
    await litService.connect();
    
    // Test wallet generation
    const { address, privateKey } = await litService.generateWallet();
    
    // Test encryption/decryption
    const testUserId = 'test-user-123';
    const encryptionResult = await litService.encryptWallet(
      privateKey,
      testUserId,
      address
    );
    
    const decryptionResult = await litService.decryptWallet(
      encryptionResult.encryptedKey,
      encryptionResult.litAcl,
      testUserId
    );

    return NextResponse.json({
      success: true,
      message: 'Wallet integration test passed',
      data: {
        generatedWallet: { address, privateKey: privateKey.slice(0, 10) + '...' },
        encryption: {
          encryptedKey: encryptionResult.encryptedKey.slice(0, 20) + '...',
          litAcl: encryptionResult.litAcl,
        },
        decryption: {
          decryptedKey: decryptionResult.privateKey.slice(0, 10) + '...',
          matches: decryptionResult.privateKey === privateKey,
        },
      },
    });
  } catch (error) {
    console.error('Wallet integration test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}