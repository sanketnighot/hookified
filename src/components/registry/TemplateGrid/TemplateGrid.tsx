"use client";

import { slideUpVariants, staggerContainerVariants } from "@/lib/animations";
import { mockTemplates } from "@/lib/mockData";
import { motion } from "framer-motion";
import { TemplateCard } from "../TemplateCard";

interface TemplateGridProps {
  searchQuery: string;
}

export function TemplateGrid({ searchQuery }: TemplateGridProps) {
  const filteredTemplates = mockTemplates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariants}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {filteredTemplates.map((template) => (
        <motion.div key={template.id} variants={slideUpVariants}>
          <TemplateCard template={template} />
        </motion.div>
      ))}
    </motion.div>
  );
}

