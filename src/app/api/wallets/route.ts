import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/services/wallet/WalletService';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wallets = await WalletService.getWalletsByUserId(user.id);
    
    return NextResponse.json({ wallets });
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, privateKey, label } = body;

    let wallet;

    if (type === 'import' && privateKey) {
      // Import existing wallet
      wallet = await WalletService.importWallet(user.id, privateKey, label);
    } else if (type === 'generate') {
      // Generate new wallet
      wallet = await WalletService.generateNewWallet(user.id, label);
    } else {
      return NextResponse.json(
        { error: 'Invalid request. Must specify type: "import" or "generate"' },
        { status: 400 }
      );
    }

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Failed to create wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create wallet' },
      { status: 500 }
    );
  }
}