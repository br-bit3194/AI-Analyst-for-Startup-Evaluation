"use client";

import * as React from 'react';
import { SidebarBody, SidebarLink, SidebarSection, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, UserCog, Settings, LogOut, BarChart3, FileText, Users, MessageSquare, SearchCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export function SidebarContent() {
  const { open } = useSidebar();
  const [isMounted, setIsMounted] = React.useState(false);
  const { signOut } = useAuth();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return (
    <SidebarBody className="h-full py-6">
      <div className="px-4 mb-8">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center w-8 h-8">
            <div className="h-8 w-8 rounded-md overflow-hidden flex-shrink-0">
              <img 
                src="/startalytica_icon.jpeg" 
                alt="Startalytica" 
                className="h-full w-full object-cover"
              />
            </div>
            {isMounted && (
              <AnimatePresence>
                {open ? (
                  <motion.span 
                    key="text"
                    className="font-semibold text-gray-900 whitespace-nowrap ml-2"
                    initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                    animate={{ 
                      opacity: 1, 
                      width: 'auto',
                      marginLeft: '0.5rem',
                    }}
                    exit={{ 
                      opacity: 0, 
                      width: 0,
                      marginLeft: 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    Startalytica
                  </motion.span>
                ) : (
                  <span className="hidden">Startalytica</span>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarSection>
          <SidebarLink
            link={{
              label: "Dashboard",
              href: "/dashboard",
              icon: <LayoutDashboard className="h-5 w-5" />,
            }}
          />
          <SidebarLink
            link={{
              label: "Deal Analysis",
              href: "/dashboard/deal-analysis",
              icon: <SearchCheck className="h-5 w-5" />,
            }}
          />
          <SidebarLink
            link={{
              label: "Past Deals",
              href: "/dashboard/analytics",
              icon: <BarChart3 className="h-5 w-5" />,
            }}
          />
        </SidebarSection>

        <SidebarSection className="mt-auto mb-4">
          <SidebarLink 
            link={{
              label: "Settings",
              href: "/dashboard/settings",
              icon: <Settings className="h-5 w-5" />
            }}
          />
          <SidebarLink 
            link={{
              label: "Account",
              href: "/dashboard/account",
              icon: <UserCog className="h-5 w-5" />
            }}
          />
          <SidebarLink 
            link={{
              label: "Logout",
              href: "/dashboard",
              icon: <LogOut className="h-5 w-5" />
            }}
            onClick={async (e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              await signOut();
            }}
          />
        </SidebarSection>
      </div>
    </SidebarBody>
  );
}
