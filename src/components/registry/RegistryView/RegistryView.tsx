"use client";

import { Input } from "@/components/ui/input";
import { slideUpVariants } from "@/lib/animations";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";
import { TemplateGrid } from "../TemplateGrid";

export function RegistryView() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpVariants}
      className="space-y-8"
    >
      <div className="space-y-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">Hook Registry</h1>
          <p className="text-muted-foreground">
            Browse and use pre-built automation templates
          </p>
        </div>

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass border-white/10"
          />
        </div>
      </div>

      <TemplateGrid searchQuery={searchQuery} />
    </motion.div>
  );
}

