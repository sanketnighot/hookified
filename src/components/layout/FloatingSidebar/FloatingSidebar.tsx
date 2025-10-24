"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FloatingSidebarProps, NavItem } from "./FloatingSidebar.types";

const navItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home, href: "/" },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  { id: "create", label: "Create Hook", icon: Plus, href: "/hook" },
  { id: "registry", label: "Registry", icon: Library, href: "/registry" },
];

export function FloatingSidebar({ className }: FloatingSidebarProps) {
  const pathname = usePathname();

  // Don't show dock on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
      }}
      className={cn(
        "glass-strong rounded-2xl px-4 py-3",
        "holographic-border backdrop-blur-xl",
        "shadow-2xl border border-white/10",
        "transform-gpu will-change-transform",
        "bg-red-500/80", // Debug: Very visible background
        className
      )}
    >
      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link key={item.id} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-3 rounded-xl",
                  "transition-all duration-200 cursor-pointer",
                  "relative overflow-hidden min-w-[80px]",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <motion.div
                      layoutId="dockActiveIndicator"
                      className="absolute -inset-2 aurora-gradient-1 rounded-lg -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
