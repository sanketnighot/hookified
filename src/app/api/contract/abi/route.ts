import { etherscanService } from '@/services/blockchain/EtherscanService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, chainId } = await request.json();

    if (!contractAddress || !chainId) {
      return NextResponse.json(
        { error: 'Contract address and chain ID are required' },
        { status: 400 }
      );
    }

    // Validate contract address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return NextResponse.json(
        { error: 'Invalid contract address format' },
        { status: 400 }
      );
    }

    // Fetch ABI and contract info from server-side
    const [abi, contractInfo] = await Promise.all([
      etherscanService.fetchContractABI(contractAddress, chainId),
      etherscanService.getContractInfo(contractAddress, chainId),
    ]);

    return NextResponse.json({
      abi,
      contractInfo,
    });
  } catch (error) {
    console.error('Error fetching contract ABI:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch contract ABI'
      },
      { status: 500 }
    );
  }
}
