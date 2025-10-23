"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slideUpVariants } from "@/lib/animations";
import { useHookStore } from "@/store/useHookStore";
import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export function DashboardHeader() {
  const { searchQuery, setSearchQuery } = useHookStore();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUpVariants}
      className="mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your automation hooks
          </p>
        </div>

        <Link href="/hook">
          <Button className="aurora-gradient-1 hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4 mr-2" />
            Create Hook
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search hooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 glass border-white/10"
        />
      </div>
    </motion.div>
  );
}

