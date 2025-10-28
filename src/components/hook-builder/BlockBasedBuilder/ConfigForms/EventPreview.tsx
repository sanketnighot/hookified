"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateEventSignatureFromABI, getEventByName } from "@/lib/blockchain/abiParser";
import { EventFilter, EventMonitor } from "@/lib/types";

interface EventPreviewProps {
  event: EventMonitor;
  abi?: any[];
}

export function EventPreview({ event, abi }: EventPreviewProps) {
  // Get event ABI if available
  let eventAbi = null;
  if (abi && abi.length > 0) {
    eventAbi = getEventByName(abi, event.eventName);
  }

  // Generate signature
  const signature = event.eventSignature || (eventAbi
    ? generateEventSignatureFromABI(eventAbi)
    : `${event.eventName}(...)`);

  // Get inputs from ABI
  const inputs = eventAbi?.inputs || [];

  // Generate example event data
  const generateExampleData = () => {
    if (!inputs || inputs.length === 0) {
      return { eventName: event.eventName };
    }

    const example: any = {
      eventName: event.eventName,
      args: {}
    };

    inputs.forEach((input: any) => {
      if (input.type === 'address') {
        example.args[input.name] = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
      } else if (input.type.includes('uint')) {
        example.args[input.name] = '1000000000000000000';
      } else if (input.type === 'bool') {
        example.args[input.name] = true;
      } else if (input.type === 'string') {
        example.args[input.name] = 'example';
      } else {
        example.args[input.name] = '...';
      }
    });

    return example;
  };

  const exampleData = generateExampleData();
  const filters = event.filters || [];

  return (
    <Card className="glass border-white/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-white">Event Preview</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Event signature */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Signature</h4>
          <div className="font-mono text-sm bg-white/5 p-3 rounded border border-white/10">
            {signature}
          </div>
        </div>

        {/* Parameters */}
        {inputs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Parameters</h4>
            <div className="space-y-2">
              {inputs.map((input: any, index: number) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-2 bg-white/5 rounded border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                      {input.name || `param${index + 1}`}
                    </span>
                    {input.indexed && (
                      <Badge variant="outline" className="text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                        Indexed
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {input.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active filters */}
        {filters.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Active Filters</h4>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter: EventFilter, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                >
                  {filter.parameter} {filter.operator} {String(filter.value)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Example data structure */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Example Event Data</h4>
          <pre className="text-xs bg-white/5 p-3 rounded overflow-auto border border-white/10">
            {JSON.stringify(exampleData, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

