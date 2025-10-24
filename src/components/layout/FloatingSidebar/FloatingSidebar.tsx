"use client";

import { AuthModal } from "@/components/auth/AuthModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/AuthProvider";
import { motion } from "framer-motion";
import { Home, LayoutDashboard, Library, LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const { user, isLoading, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Don't show dock on landing page
  if (pathname === "/") {
    return null;
  }

  return (
    <>
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

          {/* Auth Section */}
          <div className="ml-2 pl-2 border-l border-white/10">
            {isLoading ? (
              <div className="flex items-center justify-center w-16 h-16">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : user ? (
              <UserMenu user={user} onSignOut={signOut} />
            ) : (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAuthModalOpen(true)}
                className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <LogIn className="w-5 h-5" />
                <span className="text-xs font-medium text-center leading-tight">
                  Sign In
                </span>
              </motion.button>
            )}
          </div>
        </nav>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
