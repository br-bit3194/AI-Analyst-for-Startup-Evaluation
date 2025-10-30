"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, LayoutDashboard, UserCog, Settings, LogOut } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-white border-r border-gray-200 w-[280px] flex-shrink-0 overflow-y-auto",
        className
      )} style={{ backgroundColor: '#ffffff' }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "h-full px-4 py-4 hidden md:flex md:flex-col bg-white border-r border-gray-200 w-[280px] flex-shrink-0",
        className
      )}
      animate={{
        width: animate ? (open ? "280px" : "80px") : "280px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      initial={false}
      {...props}
    >
      {children}
    </motion.div>
  );
};

const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  const { signOut } = useAuth();
  return (
    <div
      className={cn(
        "h-16 px-4 py-4 flex md:hidden items-center justify-between bg-white border-b border-gray-200 w-full"
      )} style={{ backgroundColor: '#ffffff' }}
      {...props}
    >
      <div className="flex items-center">
        <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="ml-2 font-semibold text-gray-900">Startalytica</span>
      </div>
      <Menu
        className="text-gray-600 cursor-pointer h-6 w-6"
        onClick={() => setOpen(!open)}
      />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween" }}
            className="fixed inset-0 z-50 p-6"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="ml-2 font-semibold text-gray-900">Startalytica</span>
              </div>
              <X
                className="text-gray-600 cursor-pointer h-6 w-6"
                onClick={() => setOpen(false)}
              />
            </div>
            <div className="space-y-2">
              {[
                { label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" />, href: "/dashboard" },
                { label: "Profile", icon: <UserCog className="h-5 w-5" />, href: "/profile" },
                { label: "Settings", icon: <Settings className="h-5 w-5" />, href: "/settings" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <Link
                href="/dashboard"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={async (e) => {
                  e.preventDefault();
                  await signOut();
                  setOpen(false);
                }}
              >
                <span className="mr-3"><LogOut className="h-5 w-5" /></span>
                <span>Logout</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  props?: LinkProps;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors",
        className
      )}
      onClick={onClick}
      {...props}
    >
      <span className="mr-3">{link.icon}</span>
      <motion.span
        animate={{
          opacity: animate ? (open ? 1 : 0) : 1,
          width: animate ? (open ? "auto" : 0) : "auto",
          transition: { duration: 0.2 },
        }}
        className="whitespace-nowrap overflow-hidden"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

export const SidebarSection = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { open } = useSidebar();
  return (
    <div className={cn("mb-8", className)}>
      {title && (
        <motion.h3
          className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4"
          initial={{ opacity: 0 }}
          animate={{
            opacity: open ? 1 : 0,
            height: open ? "auto" : 0,
            marginBottom: open ? "1rem" : 0,
          }}
        >
          {title}
        </motion.h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
};
