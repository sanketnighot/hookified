"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FloatingSidebarProps, NavItem } from "./FloatingSidebar.types";

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "create", label: "Create Hook", icon: Plus, href: "/hook" },
  { id: "registry", label: "Registry", icon: Library, href: "/registry" },
];

export function FloatingSidebar({ className }: FloatingSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Don't show sidebar on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-6 top-1/2 -translate-y-1/2 z-50",
        "glass-strong rounded-2xl p-3",
        "holographic-border transition-all duration-300",
        isExpanded ? "w-48" : "w-16",
        className
      )}
      onHoverStart={() => setIsExpanded(true)}
      onHoverEnd={() => setIsExpanded(false)}
    >
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.id} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl",
                  "transition-all duration-200 cursor-pointer",
                  "relative overflow-hidden",
                  isActive
                    ? "aurora-gradient-1 text-white"
                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <motion.span
                  initial={false}
                  animate={{
                    opacity: isExpanded ? 1 : 0,
                    width: isExpanded ? "auto" : 0,
                  }}
                  className="text-sm font-medium whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 aurora-gradient-1 -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}

