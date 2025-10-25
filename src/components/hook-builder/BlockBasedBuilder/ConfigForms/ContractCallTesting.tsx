"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionConfig } from "@/lib/types";
import { contractValidationService } from "@/services/blockchain/ContractValidationService";
import { errorParserService, ParsedError } from "@/services/blockchain/ErrorParserService";
import { GasEstimationResult, gasEstimationService } from "@/services/blockchain/GasEstimationService";
import { SimulationResult, transactionSimulationService } from "@/services/blockchain/TransactionSimulationService";
import {
    AlertCircle,
    CheckCircle,
    Fuel,
    Info,
    Loader2,
    Play,
    Shield,
    Zap
} from "lucide-react";
import { useState } from "react";

interface ContractCallTestingProps {
  config: ActionConfig;
  onExecute?: () => void;
  onClose?: () => void;
}

export function ContractCallTesting({ config, onExecute, onClose }: ContractCallTestingProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<GasEstimationResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [parsedErrors, setParsedErrors] = useState<ParsedError[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");

  const runTests = async () => {
    setIsRunning(true);
    setCurrentStep("Validating parameters...");

    try {
      // Step 1: Parameter Validation
      if (!config.isNativeTransfer && config.abi && config.functionName) {
        const functionDef = config.abi.find((item: any) =>
          item.type === 'function' && item.name === config.functionName
        );

        if (functionDef) {
          const validationResults = contractValidationService.validateFunctionParameters(
            functionDef,
            config.parameters || []
          );
          setValidationResults(validationResults);
        }
      }

      // Step 2: Gas Estimation
      setCurrentStep("Estimating gas costs...");
      const gasEstimate = await gasEstimationService.estimateGasForTransaction(
        config.chainId || 1,
        {
          to: config.contractAddress as `0x${string}`,
          value: config.isNativeTransfer ? BigInt(config.parameters?.[1] || '0') : BigInt(0),
          data: config.isNativeTransfer ? '0x' : undefined,
        }
      );
      setGasEstimate(gasEstimate);

      // Step 3: Transaction Simulation
      setCurrentStep("Simulating transaction...");
      let simulation: SimulationResult;

      if (config.isNativeTransfer) {
        simulation = await transactionSimulationService.simulateNativeTransfer(
          config.chainId || 1,
          config.parameters?.[0] as `0x${string}`,
          BigInt(config.parameters?.[1] || '0')
        );
      } else {
        simulation = await transactionSimulationService.simulateContractCall(
          config.chainId || 1,
          config.contractAddress as `0x${string}`,
          config.abi || [],
          config.functionName || '',
          config.parameters || []
        );
      }
      setSimulationResult(simulation);

      // Step 4: Error Analysis
      setCurrentStep("Analyzing potential issues...");
      const errors: ParsedError[] = [];

      if (!simulation.success && simulation.error) {
        const parsedError = errorParserService.parseError(simulation.error, {
          chainId: config.chainId,
          contractAddress: config.contractAddress,
          functionName: config.functionName,
          gasLimit: gasEstimate.estimate.gasLimit,
          gasPrice: gasEstimate.estimate.gasPrice,
        });
        errors.push(parsedError);
      }

      // Add validation errors
      validationResults.forEach(result => {
        if (!result.isValid && result.error) {
          const parsedError = errorParserService.parseError(result.error);
          errors.push(parsedError);
        }
      });

      setParsedErrors(errors);

    } catch (error) {
      console.error('Testing failed:', error);
      const parsedError = errorParserService.parseError(error);
      setParsedErrors([parsedError]);
    } finally {
      setIsRunning(false);
      setCurrentStep("");
    }
  };

  const getOverallStatus = () => {
    if (parsedErrors.length > 0) {
      const hasErrors = parsedErrors.some(e => e.severity === 'error');
      return hasErrors ? 'error' : 'warning';
    }
    if (simulationResult?.success && gasEstimate?.confidence === 'high') {
      return 'success';
    }
    return 'warning';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            overallStatus === 'success' ? 'bg-green-500/20 text-green-400' :
            overallStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {overallStatus === 'success' ? <CheckCircle className="w-5 h-5" /> :
             overallStatus === 'warning' ? <AlertCircle className="w-5 h-5" /> :
             <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Contract Call Testing</h3>
            <p className="text-sm text-gray-400">
              {isRunning ? currentStep : 'Dry-run analysis and validation'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? 'Testing...' : 'Run Tests'}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Test Results */}
      {!isRunning && (gasEstimate || simulationResult || validationResults.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gas Estimation */}
          {gasEstimate && (
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Fuel className="w-4 h-4" />
                  Gas Estimation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Gas Limit</span>
                  <span className="text-sm text-white font-mono">
                    {gasEstimate.estimate.gasLimit.toString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Gas Price</span>
                  <span className="text-sm text-white font-mono">
                    {gasEstimate.estimate.gasPrice.toString()} wei
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Total Cost</span>
                  <span className="text-sm text-white font-mono">
                    {gasEstimate.estimate.totalCost.toString()} wei
                  </span>
                </div>
                {gasEstimate.estimate.costInUSD && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">USD Cost</span>
                    <span className="text-sm text-white font-mono">
                      ${gasEstimate.estimate.costInUSD.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Confidence</span>
                  <Badge variant="outline" className={
                    gasEstimate.confidence === 'high' ? 'text-green-400 border-green-500/30' :
                    gasEstimate.confidence === 'medium' ? 'text-yellow-400 border-yellow-500/30' :
                    'text-red-400 border-red-500/30'
                  }>
                    {gasEstimate.confidence}
                  </Badge>
                </div>
                {gasEstimate.warnings.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <p className="text-xs text-yellow-400 font-medium mb-1">Warnings:</p>
                    <ul className="text-xs text-yellow-300 space-y-1">
                      {gasEstimate.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Simulation Results */}
          {simulationResult && (
            <Card className="glass border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Simulation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Status</span>
                  <Badge variant="outline" className={
                    simulationResult.success ? 'text-green-400 border-green-500/30' :
                    'text-red-400 border-red-500/30'
                  }>
                    {simulationResult.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Gas Used</span>
                  <span className="text-sm text-white font-mono">
                    {simulationResult.gasUsed.toString()}
                  </span>
                </div>
                {simulationResult.returnValue && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Return Value</span>
                    <span className="text-sm text-white font-mono">
                      {String(simulationResult.returnValue)}
                    </span>
                  </div>
                )}
                {simulationResult.logs.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Events</span>
                    <span className="text-sm text-white">
                      {simulationResult.logs.length} events
                    </span>
                  </div>
                )}
                {simulationResult.warnings.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                    <p className="text-xs text-yellow-400 font-medium mb-1">Warnings:</p>
                    <ul className="text-xs text-yellow-300 space-y-1">
                      {simulationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Validation Results */}
      {validationResults.length > 0 && (
        <Card className="glass border-white/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Parameter Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {validationResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div className="flex-1">
                    <p className="text-sm text-white">{result.parameter.name}</p>
                    <p className="text-xs text-gray-400">{result.parameter.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {result.isValid ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    {result.error && (
                      <span className="text-xs text-red-400">{result.error}</span>
                    )}
                    {result.warning && (
                      <span className="text-xs text-yellow-400">{result.warning}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Analysis */}
      {parsedErrors.length > 0 && (
        <Card className="glass border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              Error Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsedErrors.map((error, index) => (
                <div key={index} className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-medium text-red-400">{error.title}</h4>
                    <Badge variant="outline" className="text-xs text-red-400 border-red-500/30">
                      {error.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-red-300 mb-2">{error.message}</p>
                  {error.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs text-red-400 font-medium mb-1">Suggestions:</p>
                      <ul className="text-xs text-red-300 space-y-1">
                        {error.suggestions.map((suggestion, suggestionIndex) => (
                          <li key={suggestionIndex}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {!isRunning && overallStatus === 'success' && onExecute && (
        <div className="flex justify-center">
          <Button
            onClick={onExecute}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Zap className="w-4 h-4" />
            Execute Transaction
          </Button>
        </div>
      )}
    </div>
  );
}
