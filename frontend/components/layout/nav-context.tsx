"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type NavContextValue = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const NavContext = createContext<NavContextValue | null>(null);

/** Session-only UI state for the sidebar collapse toggle and mobile drawer.
 *  No persistence — resets on reload, per spec ("no persistence needed yet"). */
export function NavProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const value: NavContextValue = {
    isCollapsed,
    toggleCollapsed: () => setIsCollapsed((prev) => !prev),
    isDrawerOpen,
    openDrawer: () => setIsDrawerOpen(true),
    closeDrawer: () => setIsDrawerOpen(false),
  };

  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within a NavProvider");
  return ctx;
}
