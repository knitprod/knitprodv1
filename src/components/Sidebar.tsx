/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  ClipboardCopy, 
  LayoutGrid, 
  TrendingUp, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Factory
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
}

export default function Sidebar({ 
  currentPage, 
  onNavigate, 
  collapsed, 
  setCollapsed,
  onLogout 
}: SidebarProps) {

  const menuItems = [
    { name: 'Dashboard', icon: Home, label: 'Dashboard' },
    { name: 'Production Entry', icon: ClipboardCopy, label: 'Production Entry' },
    { name: 'Floor Dashboard', icon: LayoutGrid, label: 'Floor Dashboard' },
    { name: 'Management Dashboard', icon: TrendingUp, label: 'Management Dashboard' },
    { name: 'Reports', icon: FileText, label: 'Reports' },
    { name: 'User Management', icon: Users, label: 'User Management' },
    { name: 'Settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside 
      className={`fixed inset-y-16 left-0 z-30 hidden md:flex flex-col justify-between border-r border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Links */}
      <div className="flex-1 min-h-0 py-4 overflow-y-auto scrollbar-none">
        {/* Toggle Expand / Collapse button on sidebar top corner (desktop) */}
        <div className="hidden justify-end px-3 pb-3 md:flex">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-800 text-gray-400 dark:text-slate-400 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-700 dark:hover:text-slate-250 cursor-pointer"
            aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            id="sidebar-toggle-btn"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1.5 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.name;

            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.name)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-350 shadow-sm shadow-blue-500/5' 
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
                id={`sidebar-nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-colors ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'
                }`} />
                {!collapsed && (
                  <span className="truncate tracking-wide">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout Button */}
      <div className="border-t border-gray-100 dark:border-slate-800 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-500 dark:text-red-400 transition-all hover:bg-red-50/70 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-350 cursor-pointer"
          title={collapsed ? "Logout" : undefined}
          id="sidebar-logout-btn"
        >
          <LogOut className="h-5 w-5 shrink-0 text-red-400 dark:text-red-400" />
          {!collapsed && (
            <span className="truncate tracking-wide">Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
}
