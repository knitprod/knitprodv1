/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  User, 
  Clock, 
  Calendar, 
  Check, 
  AlertCircle, 
  Menu, 
  X, 
  Home, 
  ClipboardCopy, 
  LayoutGrid, 
  TrendingUp, 
  FileText, 
  Users, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import { ActivityLog } from '../types';

interface HeaderProps {
  notifications: ActivityLog[];
  onNotificationClick: (floorId?: string) => void;
  onNavigate: (tab: string) => void;
  currentPage: string;
  onLogout?: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export default function Header({ 
  notifications, 
  onNotificationClick, 
  onNavigate, 
  currentPage,
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen,
  isDark,
  onToggleDark
}: HeaderProps) {
  const [time, setTime] = useState<string>('21:28:37');
  const [date, setDate] = useState<string>('Friday, July 10, 2026');
  const [showNotifications, setShowNotifications] = useState(false);

  // Live ticking clock as requested by "Current Time (Live Placeholder)"
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false }));
      setDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const alertNotifications = notifications.filter(n => n.type === 'alert');

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 sm:px-6 backdrop-blur-md text-gray-900 dark:text-slate-100">
      {/* Left side: Company Logo Placeholder & Title */}
      <div className="flex items-center gap-1.5 sm:gap-4">
        {/* Hamburger Menu Toggle for Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors md:hidden shrink-0 cursor-pointer"
          aria-label="Toggle mobile menu"
          id="header-hamburger-btn"
        >
          {mobileMenuOpen ? <X className="h-5 w-5 text-blue-600 dark:text-blue-400" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Clearly marked Company Logo Placeholder (always visible now to show logo as requested) */}
        <div 
          className="group relative flex h-9 w-9 sm:h-10 sm:w-10 cursor-pointer items-center justify-center rounded-lg border border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 transition-all hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 shrink-0"
          title="Placeholder: Click to replace with logo"
        >
          <span className="font-mono text-xs font-black tracking-tight text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">EKL</span>
          <div className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 text-[8px] text-white">
            +
          </div>
          {/* Tooltip */}
          <div className="absolute left-12 top-0 hidden w-48 rounded bg-gray-900 p-2 text-[10px] text-white group-hover:block shadow-md z-50">
            Click to replace with your official <strong>Epyllion Knitex Logo</strong> (e.g. 120x40 px)
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <span className="font-sans text-[11px] sm:text-sm md:text-base font-black tracking-tight sm:tracking-wider text-gray-950 dark:text-slate-100 uppercase truncate max-w-[120px] sm:max-w-none">
            Epyllion Knitex Ltd.
          </span>
          <span className="font-sans text-[8px] sm:text-[10px] md:text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400 truncate max-w-[120px] sm:max-w-none">
            Knitting Performance System
          </span>
        </div>
      </div>

      {/* Right side: Live Date/Time, Theme Toggle, Alerts, Settings, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-5 shrink-0">
        {/* Live Date Indicator (Tablet & Up) */}
        <div className="hidden items-center gap-2 rounded-lg bg-gray-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-gray-500 dark:text-slate-400 xl:flex">
          <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span className="font-medium">{date}</span>
        </div>

        {/* Live Clock Indicator */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 px-2 py-1 sm:px-3 sm:py-1.5 font-mono text-[10px] sm:text-xs font-bold text-blue-700 dark:text-blue-300 shrink-0">
          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <span>{time}</span>
        </div>

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          onClick={onToggleDark}
          className="hidden md:flex rounded-lg p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Toggle Dark/Light Mode"
          id="theme-toggle-btn"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5 text-slate-500" />}
        </button>

        {/* Alerts & Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Toggle notifications"
            id="notification-bell-btn"
          >
            <Bell className="h-5 w-5" />
            {alertNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600"></span>
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2.5 w-80 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl ring-1 ring-black/5 z-50">
                <div className="flex items-center justify-between border-b border-gray-50 dark:border-slate-800 px-3 py-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-slate-100">Floor Alerts & Updates</span>
                  <span className="rounded-full bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                    {alertNotifications.length} Critical
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        onNotificationClick(n.floorId);
                        setShowNotifications(false);
                      }}
                      className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                        n.status === 'danger' ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400' :
                        n.status === 'warning' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
                        n.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' : 
                        'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      }`}>
                        {n.status === 'danger' || n.status === 'warning' ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <p className="text-xs font-medium text-gray-800 dark:text-slate-200 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="mt-1 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase">
                          Floor: {n.floorId?.toUpperCase() || 'SYSTEM'} • {n.timestamp}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="border-t border-gray-50 dark:border-slate-800 p-1.5 text-center">
                  <button 
                    onClick={() => {
                      onNavigate('Floor Dashboard');
                      setShowNotifications(false);
                    }}
                    className="w-full rounded-lg py-1.5 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    View All Live Floor Dashboards
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={() => onNavigate('Settings')}
          className="hidden md:flex rounded-lg p-2 text-gray-400 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          aria-label="Settings"
          id="header-settings-btn"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* User Profile Component */}
        <div className="hidden md:flex items-center gap-2.5 border-l border-gray-100 dark:border-slate-800 pl-3 md:pl-5">
          <div className="flex flex-col text-right">
            <span className="text-xs font-bold text-gray-950 dark:text-slate-200">knitprod@gmail.com</span>
            <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
              Sr. Production Manager
            </span>
          </div>
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-black text-white shadow-sm ring-2 ring-blue-50 dark:ring-slate-800 hover:opacity-90 transition-opacity">
            KM
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
          </div>
        </div>
      </div>
    </header>
  );
}
