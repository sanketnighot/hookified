import { getContractConfig, isContractConfigured } from '@/lib/config';
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  base,
  baseSepolia,
  bsc,
  bscTestnet,
  mainnet,
  polygon,
  polygonAmoy,
  sepolia,
} from "viem/chains";
import { BaseActionExecutor } from '../ActionExecutor';
import {
  ActionExecutionResult,
  ExecutionContext,
  interpolateVariables,
} from "../types";

export interface ContractCallConfig {
  contractAddress: string;
  functionName?: string;
  parameters?: any[];
  chainId?: number;
  isNativeTransfer?: boolean;
  abi?: any[];
  // Private key and RPC URL will be loaded from environment variables
}

export class ContractCallExecutor extends BaseActionExecutor {
  private getChainConfig(chainId: number) {
    const chainMap: Record<number, any> = {
      1: mainnet,
      11155111: sepolia,
      56: bsc,
      97: bscTestnet,
      137: polygon,
      80002: polygonAmoy,
      8453: base,
      84532: baseSepolia,
    };

    return chainMap[chainId] || mainnet;
  }

  private createClients(chainId: number) {
    const chain = this.getChainConfig(chainId);
    const contractConfig = getContractConfig();

    // Create RPC URL with API key if needed
    let rpcUrl = contractConfig.rpcUrl;
    if (rpcUrl.includes("infura.io") && process.env.INFURA_API_KEY) {
      rpcUrl = rpcUrl.replace("v3/", `v3/${process.env.INFURA_API_KEY}`);
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const account = privateKeyToAccount(
      contractConfig.privateKey as `0x${string}`
    );

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    return { publicClient, walletClient };
  }

  async execute(
    actionConfig: ContractCallConfig,
    context: ExecutionContext
  ): Promise<ActionExecutionResult> {
    const startedAt = new Date();
    const actionId = `contract-call-${Date.now()}`;

    try {
      // Validate configuration
      if (!actionConfig.contractAddress) {
        throw new Error(
          "Missing required ContractCall configuration: contractAddress is required"
        );
      }

      if (!actionConfig.chainId) {
        throw new Error(
          "Missing required ContractCall configuration: chainId is required"
        );
      }

      // Validate contract address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(actionConfig.contractAddress)) {
        throw new Error("Invalid contract address format");
      }

      // Get environment variables
      if (!isContractConfigured()) {
        throw new Error(
          "Contract private key or RPC URL not configured in environment variables"
        );
      }

      const { publicClient, walletClient } = this.createClients(
        actionConfig.chainId
      );

      // Resolve variables in parameters
      const resolvedConfig = this.resolveConfigVariables(actionConfig, context);

      let result: any;

      if (resolvedConfig.isNativeTransfer) {
        // Handle native token transfer
        result = await this.executeNativeTransfer(
          resolvedConfig,
          walletClient,
          publicClient
        );
      } else {
        // Handle contract function call
        result = await this.executeContractCall(
          resolvedConfig,
          walletClient,
          publicClient
        );
      }

      return this.createExecutionResult(
        actionId,
        "CONTRACT_CALL",
        startedAt,
        "SUCCESS",
        result
      );
    } catch (error) {
      return this.createExecutionResult(
        actionId,
        "CONTRACT_CALL",
        startedAt,
        "FAILED",
        undefined,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }

  /**
   * Resolve variables in configuration parameters.
   * Supports variable interpolation in parameter values.
   */
  private resolveConfigVariables(
    config: ContractCallConfig,
    context: ExecutionContext
  ): ContractCallConfig {
    const enrichedContext = {
      ...context.variables,
      hookId: context.hookId,
      runId: context.runId,
      timestamp: new Date().toISOString(),
    };

    const resolvedParameters = config.parameters?.map((param) => {
      if (typeof param === "string" && param.includes("{")) {
        return interpolateVariables(param, enrichedContext);
      }
      return param;
    });

    return {
      ...config,
      parameters: resolvedParameters,
    };
  }

  private async executeNativeTransfer(
    config: ContractCallConfig,
    walletClient: any,
    publicClient: any
  ): Promise<any> {
    if (!config.parameters || config.parameters.length < 2) {
      throw new Error("Native transfer requires recipient address and amount");
    }

    const [recipientAddress, amount] = config.parameters;

    // Validate recipient address
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      throw new Error("Invalid recipient address format");
    }

    // Parse amount - assume it's already in wei format from the form
    let weiAmount: bigint;
    try {
      weiAmount = BigInt(amount);
    } catch {
      throw new Error("Invalid amount format");
    }

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();

    // Estimate gas for the transaction
    const gasEstimate = await publicClient.estimateGas({
      account: walletClient.account.address,
      to: recipientAddress as `0x${string}`,
      value: weiAmount,
    });

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: recipientAddress as `0x${string}`,
      value: weiAmount,
      gas: gasEstimate,
      gasPrice,
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    return {
      type: "native_transfer",
      contractAddress: config.contractAddress,
      recipientAddress,
      amount: amount,
      chainId: config.chainId,
      transactionHash: hash,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
    };
  }

  private async executeContractCall(
    config: ContractCallConfig,
    walletClient: any,
    publicClient: any
  ): Promise<any> {
    if (!config.functionName) {
      throw new Error("Function name is required for contract calls");
    }

    if (!config.abi || config.abi.length === 0) {
      throw new Error("Contract ABI is required for contract calls");
    }

    // Create contract instance
    const contract = {
      address: config.contractAddress as `0x${string}`,
      abi: config.abi,
    };

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice();

    // Estimate gas for the function call
    const gasEstimate = await publicClient.estimateContractGas({
      ...contract,
      functionName: config.functionName,
      args: config.parameters || [],
      account: walletClient.account.address,
    });

    // Execute the contract function
    const hash = await walletClient.writeContract({
      ...contract,
      functionName: config.functionName,
      args: config.parameters || [],
      gas: gasEstimate,
      gasPrice,
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Get function return value if it's a view function
    let returnValue = null;
    try {
      const functionAbi = config.abi.find(
        (item: any) =>
          item.type === "function" && item.name === config.functionName
      );

      if (
        functionAbi &&
        functionAbi.outputs &&
        functionAbi.outputs.length > 0
      ) {
        returnValue = await publicClient.readContract({
          ...contract,
          functionName: config.functionName,
          args: config.parameters || [],
        });
      }
    } catch (error) {
      // Ignore read errors for write functions
    }

    return {
      type: "contract_call",
      contractAddress: config.contractAddress,
      functionName: config.functionName,
      parameters: config.parameters || [],
      chainId: config.chainId,
      transactionHash: hash,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      blockNumber: receipt.blockNumber.toString(),
      returnValue,
    };
  }
}
