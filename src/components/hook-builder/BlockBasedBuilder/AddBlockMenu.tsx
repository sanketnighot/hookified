"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { registry } from "@/lib/plugins";
import { ActionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Code, GitBranch, Plus, Search, Send, Webhook, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface AddBlockMenuProps {
  onAddAction: (type: ActionType) => void;
  disabled?: boolean;
}

// Map action types to shortcuts
const ACTION_SHORTCUTS: Record<string, string> = {
  TELEGRAM: "/telegram",
  WEBHOOK: "/webhook",
  CONTRACT_CALL: "/contract",
  CHAIN: "/chain",
};

const ACTION_ICONS = {
  TELEGRAM: Send,
  WEBHOOK: Webhook,
  CONTRACT_CALL: Code,
  CHAIN: GitBranch,
};

export function AddBlockMenu({
  onAddAction,
  disabled = false,
}: AddBlockMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [slashCommand, setSlashCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Get actions from registry
  const actions = useMemo(() => {
    return registry.getAllActions().map((action) => ({
      type: action.type,
      title: action.name,
      description: action.description,
      shortcut:
        ACTION_SHORTCUTS[action.type] || `/${action.type.toLowerCase()}`,
    }));
  }, []);

  const filteredActions = actions.filter(
    (action) =>
      action.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.shortcut.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSlashCommand = (command: string) => {
    const action = actions.find((a) => a.shortcut === command.toLowerCase());
    if (action) {
      onAddAction(action.type as ActionType);
      setSlashCommand("");
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/") {
      setSlashCommand("/");
      setIsOpen(true);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setSlashCommand("");
      setSearchQuery("");
    } else if (e.key === "Enter" && slashCommand) {
      handleSlashCommand(slashCommand);
    }
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Add Button */}
      <Button
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="w-full glass border-white/20 hover:border-white/30 transition-all duration-300"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Action Block
        <span className="ml-auto text-xs text-muted-foreground">
          Press / for shortcuts
        </span>
      </Button>

      {/* Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass rounded-xl border border-white/20 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Action Block</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  placeholder="Search actions or type / for shortcuts..."
                  value={slashCommand || searchQuery}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.startsWith("/")) {
                      setSlashCommand(value);
                      setSearchQuery("");
                    } else {
                      setSearchQuery(value);
                      setSlashCommand("");
                    }
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-10 glass"
                />
              </div>

              {/* Actions List */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainerVariants}
                className="space-y-2 max-h-64 overflow-y-auto"
              >
                {filteredActions.map((action) => {
                  const Icon =
                    ACTION_ICONS[action.type as keyof typeof ACTION_ICONS];
                  return (
                    <motion.div key={action.type} variants={slideUpVariants}>
                      <button
                        onClick={() => {
                          onAddAction(action.type as ActionType);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "w-full p-3 rounded-lg glass border border-white/10",
                          "hover:border-white/20 hover:bg-white/5",
                          "transition-all duration-200 text-left"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg aurora-gradient-2 flex items-center justify-center">
                            {Icon && <Icon className="w-4 h-4 text-white" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {action.title}
                              </span>
                              <span className="text-xs text-muted-foreground bg-white/10 px-2 py-0.5 rounded">
                                {action.shortcut}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Slash Command Help */}
              {slashCommand && (
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    Type a shortcut: /telegram, /webhook, /contract, /chain
                  </p>
                </div>
              )}

              {/* Empty State */}
              {filteredActions.length === 0 && searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No actions found for "{searchQuery}"</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
