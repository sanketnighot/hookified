import { getWriteFunctions, parseABI } from '@/lib/blockchain/abiParser';
import { etherscanService } from '@/services/blockchain/EtherscanService';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractAddress = searchParams.get('address');
    const chainId = parseInt(searchParams.get('chainId') || '1');

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'Contract address is required' },
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

    // Fetch contract ABI and info
    const [abi, contractInfo] = await Promise.all([
      etherscanService.fetchContractABI(contractAddress, chainId),
      etherscanService.getContractInfo(contractAddress, chainId)
    ]);

    // Parse ABI
    const parsedABI = parseABI(abi);
    const writeFunctions = getWriteFunctions(abi);

    return NextResponse.json({
      success: true,
      data: {
        contractInfo,
        abi: parsedABI,
        writeFunctions: writeFunctions.map(func => ({
          name: func.name,
          inputs: func.inputs,
          signature: `${func.name}(${func.inputs.map(i => i.type).join(', ')})`,
          stateMutability: func.stateMutability
        })),
        isERC20: parsedABI.isERC20,
        isERC721: parsedABI.isERC721
      }
    });

  } catch (error) {
    console.error('Contract test error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractAddress, chainId, functionName, parameters } = body;

    if (!contractAddress || !chainId) {
      return NextResponse.json(
        { error: 'Contract address and chain ID are required' },
        { status: 400 }
      );
    }

    // This would be used for testing contract execution
    // For now, just return a success response
    return NextResponse.json({
      success: true,
      message: 'Contract call test endpoint - execution not implemented yet',
      data: {
        contractAddress,
        chainId,
        functionName,
        parameters
      }
    });

  } catch (error) {
    console.error('Contract execution test error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}
