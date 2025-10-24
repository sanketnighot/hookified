"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { Template, HookBuilderState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, Clock, Zap, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface TemplateQuickStartProps {
  templates: Template[];
  onApplyTemplate: (template: Template) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATE_CATEGORIES = [
  { id: "all", name: "All Templates", icon: Zap },
  { id: "defi", name: "DeFi", icon: Star },
  { id: "notifications", name: "Notifications", icon: Clock },
  { id: "automation", name: "Automation", icon: Zap },
];

export function TemplateQuickStart({ templates, onApplyTemplate, isOpen, onClose }: TemplateQuickStartProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApplyTemplate = (template: Template) => {
    onApplyTemplate(template);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-4xl max-h-[80vh] glass rounded-t-xl lg:rounded-xl border border-white/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Choose a Template</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass"
                />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row h-[60vh]">
              {/* Categories Sidebar */}
              <div className="lg:w-64 border-r border-white/10 p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Categories</h3>
                <div className="space-y-1">
                  {TEMPLATE_CATEGORIES.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={cn(
                          "w-full flex items-center gap-2 p-2 rounded-lg text-sm transition-colors",
                          selectedCategory === category.id
                            ? "bg-white/10 text-white"
                            : "text-muted-foreground hover:bg-white/5"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{category.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={staggerContainerVariants}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {filteredTemplates.map((template) => (
                    <motion.div key={template.id} variants={slideUpVariants}>
                      <Card className="glass border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-base mb-1">{template.name}</CardTitle>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="w-3 h-3" />
                              <span>{template.popularity}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="px-2 py-1 rounded bg-white/10">
                                {template.triggerConfig.type}
                              </span>
                              <ArrowRight className="w-3 h-3" />
                              <span className="px-2 py-1 rounded bg-white/10">
                                {template.actionConfig.type}
                              </span>
                            </div>
                            <Button
                              onClick={() => handleApplyTemplate(template)}
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity aurora-gradient-1"
                            >
                              Use Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Empty State */}
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No templates found</p>
                    <p className="text-sm">Try adjusting your search or category filter</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
