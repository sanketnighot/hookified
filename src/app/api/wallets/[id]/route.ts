import { NextRequest, NextResponse } from 'next/server';
import { WalletService } from '@/services/wallet/WalletService';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wallet = await WalletService.getWalletById(params.id, user.id);
    
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Failed to fetch wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { label } = body;

    const wallet = await WalletService.updateWallet(params.id, user.id, { label });

    return NextResponse.json({ wallet });
  } catch (error) {
    console.error('Failed to update wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update wallet' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await WalletService.deleteWallet(params.id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete wallet:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete wallet' },
      { status: 500 }
    );
  }
}