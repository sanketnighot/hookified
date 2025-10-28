"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ALL_EVENT_TEMPLATES,
    EventTemplate,
    PresetEvent,
} from "@/lib/blockchain/eventTemplates";
import { EventMonitor } from "@/lib/types";
import { Code, Coins, Image, Search, X, Zap } from "lucide-react";
import { useState } from "react";

interface EventTemplateSelectorProps {
  onSelectEvent: (eventMonitor: EventMonitor) => void;
  onClose: () => void;
  chainId: number;
}

const CATEGORY_ICONS = {
  'ERC-20': Coins,
  'ERC-721': Image,
  'ERC-1155': Image,
  'DeFi': Zap,
  'DAO': Code,
  'NFT': Image,
  'Utility': Code,
};

const CATEGORY_COLORS = {
  'ERC-20': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'ERC-721': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'ERC-1155': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'DeFi': 'bg-green-500/20 text-green-400 border-green-500/30',
  'DAO': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'NFT': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  'Utility': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

export function EventTemplateSelector({
  onSelectEvent,
  onClose,
  chainId,
}: EventTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = ['all', ...new Set(ALL_EVENT_TEMPLATES.map(t => t.category))];

  const filteredTemplates = ALL_EVENT_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.events.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleEventSelect = (template: EventTemplate, presetEvent: PresetEvent) => {
    const eventMonitor: EventMonitor = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contractAddress: '', // User will fill in contract address
      eventName: presetEvent.name,
      eventSignature: presetEvent.signature,
      abi: template.events.map(e => e.abi),
      filters: presetEvent.filterExamples?.[0]?.filters || [],
      description: presetEvent.description,
    };

    onSelectEvent(eventMonitor);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Event Templates</h2>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search templates or events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              {categories.slice(1).map(category => {
                const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || Code;
                return (
                  <TabsTrigger key={category} value={category} className="text-xs">
                    <Icon className="w-3 h-3 mr-1" />
                    {category}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <TabsContent value={selectedCategory} className="space-y-4">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found matching your search.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.map(template => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelectEvent={handleEventSelect}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: EventTemplate;
  onSelectEvent: (template: EventTemplate, presetEvent: PresetEvent) => void;
}

function TemplateCard({ template, onSelectEvent }: TemplateCardProps) {
  const Icon = CATEGORY_ICONS[template.category] || Code;
  const colorClass = CATEGORY_COLORS[template.category] || CATEGORY_COLORS['Utility'];

  return (
    <Card className="glass border-white/10 hover:border-white/20 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-white text-sm">{template.name}</CardTitle>
              <CardDescription className="text-xs text-gray-400 mt-1">
                {template.description}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={`text-xs ${colorClass}`}>
            {template.category}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Events */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-300">Available Events</h4>
          <div className="space-y-1">
            {template.events.map((presetEvent) => (
              <div
                key={presetEvent.name}
                className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium">{presetEvent.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {presetEvent.description}
                  </p>
                  {presetEvent.isCommon && (
                    <Badge variant="outline" className="mt-1 text-xs bg-green-500/20 text-green-400 border-green-500/30">
                      Common
                    </Badge>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSelectEvent(template, presetEvent)}
                  className="text-xs px-2 py-1 h-auto text-blue-400 hover:text-blue-300"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Contracts */}
        {template.popularContracts && template.popularContracts.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <h4 className="text-xs font-medium text-gray-300 mb-2">Popular Contracts</h4>
            <div className="space-y-1">
              {template.popularContracts.slice(0, 2).map(contract => (
                <div key={contract.address} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{contract.name}</p>
                    <p className="text-xs text-gray-400 truncate">{contract.description}</p>
                  </div>
                  <Badge variant="outline" className="text-xs text-green-400 border-green-500/30">
                    Verified
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

