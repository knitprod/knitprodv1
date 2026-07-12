/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Home, 
  ClipboardCopy, 
  LayoutGrid, 
  TrendingUp, 
  FileText, 
  Users, 
  Settings, 
  X, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import WelcomeBanner from './components/WelcomeBanner';
import KPICards from './components/KPICards';
import FactoryFloors from './components/FactoryFloors';
import DashboardCharts from './components/DashboardCharts';
import RightPanel from './components/RightPanel';
import ProductionEntryView from './components/ProductionEntryView';
import FloorDashboardView from './components/FloorDashboardView';
import ReportsView from './components/ReportsView';
import UserManagementView from './components/UserManagementView';
import SettingsView from './components/SettingsView';

import { FactoryFloor, ProductionEntry, ActivityLog } from './types';
import { INITIAL_FLOORS, INITIAL_KPIS, INITIAL_ACTIVITY_LOGS } from './data';

// Define rich starting production logs for the Reports spreadsheet on load
const INITIAL_ENTRIES: ProductionEntry[] = [
  {
    id: 'ent-1',
    floorId: 'ekl',
    timestamp: '21:24',
    machineId: 'M-01',
    operatorName: 'Akil Zaman',
    shift: 'C',
    yarnType: '30s Cotton Combed',
    fabricType: 'Single Jersey',
    productionKg: 180.0,
    rejectKg: 1.5,
    remarks: 'Stitch length verified.',
  },
  {
    id: 'ent-2',
    floorId: 'efl',
    timestamp: '21:05',
    machineId: 'M-05',
    operatorName: 'Nasrin Akhter',
    shift: 'C',
    yarnType: '34s Cotton Combed',
    fabricType: '1x1 Rib',
    productionKg: 175.4,
    rejectKg: 2.1,
    remarks: 'Grey scale test passed.',
  },
  {
    id: 'ent-3',
    floorId: 'efl-2',
    timestamp: '20:45',
    machineId: 'M-03',
    operatorName: 'Kamal Hossain',
    shift: 'B',
    yarnType: '40s Cotton Combed',
    fabricType: 'Interlock',
    productionKg: 190.2,
    rejectKg: 3.5,
    remarks: 'Yarn tension stabilized.',
  },
  {
    id: 'ent-4',
    floorId: 'auto-stripe',
    timestamp: '20:10',
    machineId: 'M-07',
    operatorName: 'Rashedul Bari',
    shift: 'B',
    yarnType: '50D Lycra',
    fabricType: 'Fleece',
    productionKg: 210.0,
    rejectKg: 1.2,
    remarks: 'Stripe alignment ok.',
  },
  {
    id: 'ent-5',
    floorId: 'efl-ext',
    timestamp: '19:30',
    machineId: 'M-02',
    operatorName: 'Taslima Begum',
    shift: 'B',
    yarnType: '30s Grey Melange',
    fabricType: 'Pique',
    productionKg: 145.0,
    rejectKg: 4.8,
    remarks: 'Awaiting motor calibration.',
  },
];

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Dark mode state with local storage persistence
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Apply dark class to document root for Tailwind class-based dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const handleToggleDark = () => {
    setIsDark((prev) => !prev);
  };

  // Core Application Database States
  const [floors, setFloors] = useState<FactoryFloor[]>(INITIAL_FLOORS);
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>(INITIAL_ENTRIES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Automatically collapse sidebar on small/tablet devices
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize(); // trigger initial layout sizing
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute live cumulative KPIs dynamically based on current floors state
  const kpis = useMemo(() => {
    return INITIAL_KPIS(floors);
  }, [floors]);

  // Handler: Drill down floor filter via sidebar click or notification click
  const handleSelectFloor = (floorId: string | null) => {
    setSelectedFloorId(floorId);
    setCurrentPage('Floor Dashboard');
  };

  // Handler: Record new fabric roll submission
  const handleAddProductionEntry = (newEntry: Omit<ProductionEntry, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const newId = `ent-${productionEntries.length + 1}`;

    const completedEntry: ProductionEntry = {
      ...newEntry,
      id: newId,
      timestamp,
    };

    // 1. Prepend to list of records
    setProductionEntries((prev) => [completedEntry, ...prev]);

    // 2. Prepend a live activity notification
    const newLog: ActivityLog = {
      id: `act-${activityLogs.length + 1}`,
      timestamp,
      floorId: newEntry.floorId,
      type: 'production',
      message: `${newEntry.operatorName} logged ${newEntry.productionKg} Kg of ${newEntry.fabricType} on Machine ${newEntry.machineId}.`,
      status: newEntry.rejectKg > 4.0 ? 'warning' : 'success',
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    // 3. Recalculate target floor performance
    setFloors((prevFloors) =>
      prevFloors.map((floor) => {
        if (floor.id === newEntry.floorId) {
          const updatedProduction = floor.productionKg + newEntry.productionKg;
          const updatedAchievement = Math.round((updatedProduction / floor.targetKg) * 1000) / 10;
          const updatedRejectPct = Math.round(((floor.rejectPct * floor.productionKg + newEntry.rejectKg * 100) / (floor.productionKg + newEntry.productionKg)) * 100) / 100;
          
          return {
            ...floor,
            productionKg: updatedProduction,
            achievementPct: updatedAchievement,
            rejectPct: updatedRejectPct,
            lastUpdated: 'Just now',
          };
        }
        return floor;
      })
    );
  };

  // Handler: Simulated User Logout
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to exit Epyllion Knitting System?')) {
      alert('Session Terminated. Re-authenticating with enterprise active directory...');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* 1. Primary Header */}
      <Header 
        notifications={activityLogs} 
        onNotificationClick={handleSelectFloor} 
        onNavigate={setCurrentPage} 
        currentPage={currentPage}
        onLogout={handleLogout}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isDark={isDark}
        onToggleDark={handleToggleDark}
      />

      {/* Responsive Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu Drawer */}
          <div className="fixed top-0 bottom-0 left-0 z-[60] flex w-72 flex-col justify-between border-r border-blue-950/40 bg-[#0A192F] text-white p-4 shadow-2xl animate-slide-right md:hidden overflow-y-auto scrollbar-none">
            <div className="space-y-6 flex-1">
              <div className="flex items-center gap-3 border-b border-blue-900/40 pb-4 pt-4">
                {/* User Avatar */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-black text-white shadow-sm ring-2 ring-blue-500/25">
                  KM
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0A192F] bg-emerald-500" />
                </div>
                
                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <span className="block text-[9px] font-bold uppercase tracking-wider text-blue-400">Enterprise Navigation</span>
                  <span className="block text-xs font-bold text-blue-100 truncate">knitprod@gmail.com</span>
                  <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wide truncate">Sr. Production Manager</span>
                </div>
                
                {/* Actions: Theme Toggle & Close Menu */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={handleToggleDark}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-900/30 hover:text-white transition-colors cursor-pointer"
                    aria-label="Toggle Dark/Light Mode"
                    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  >
                    {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-300" />}
                  </button>
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-900/30 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <nav className="space-y-1.5">
                {[
                  { name: 'Dashboard', icon: Home, label: 'Dashboard' },
                  { name: 'Production Entry', icon: ClipboardCopy, label: 'Production Entry' },
                  { name: 'Floor Dashboard', icon: LayoutGrid, label: 'Floor Dashboard' },
                  { name: 'Management Dashboard', icon: TrendingUp, label: 'Management Dashboard' },
                  { name: 'Reports', icon: FileText, label: 'Reports' },
                  { name: 'User Management', icon: Users, label: 'User Management' },
                  { name: 'Settings', icon: Settings, label: 'Settings' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setCurrentPage(item.name);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left text-sm font-bold transition-all duration-150 cursor-pointer ${
                        isActive 
                          ? 'bg-[#0F4C81] text-white shadow-md ring-1 ring-blue-400/20' 
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                      id={`mobile-nav-${item.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate tracking-wide">{item.label}</span>
                      {isActive && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Logout on mobile menu drawer */}
            <div className="border-t border-blue-900/40 pt-4 pb-2 mt-6 shrink-0">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex w-full items-center gap-3.5 rounded-xl px-4 py-3 text-left text-sm font-bold text-red-400 transition-all hover:bg-red-950/40 hover:text-red-300 cursor-pointer"
                id="mobile-nav-logout"
              >
                <LogOut className="h-5 w-5 shrink-0 text-red-400" />
                <span className="truncate tracking-wide">Logout Account</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. Main Layout Container */}
      <div className="flex pt-16">
        {/* Sidebar Left Component */}
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          onLogout={handleLogout}
        />

        {/* Main Workspace Frame */}
        <main 
          className={`flex-1 min-h-[calc(100vh-4rem)] p-4 sm:p-6 transition-all duration-300 ease-in-out ${
            sidebarCollapsed ? 'pl-4 md:pl-20' : 'pl-4 md:pl-72'
          }`}
        >
          <div className="mx-auto max-w-7xl space-y-6">
            
            {/* Page View Switcher */}
            {currentPage === 'Dashboard' && (
              <div className="space-y-6 animate-fade-in">
                {/* Large Welcome banner */}
                <WelcomeBanner floors={floors} onNavigate={setCurrentPage} />

                {/* KPI metrics row */}
                <KPICards kpis={kpis} />

                {/* Floor indicators & Activity feed */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <FactoryFloors 
                      floors={floors} 
                      selectedFloorId={selectedFloorId} 
                      onSelectFloor={handleSelectFloor} 
                    />
                    
                    {/* Integrated dashboard graphs */}
                    <DashboardCharts />
                  </div>

                  <div className="lg:col-span-1">
                    <RightPanel 
                      activityLogs={activityLogs} 
                      onNotificationClick={handleSelectFloor} 
                    />
                  </div>
                </div>
              </div>
            )}

            {currentPage === 'Production Entry' && (
              <div className="animate-fade-in">
                <ProductionEntryView 
                  floors={floors} 
                  onSubmitEntry={handleAddProductionEntry} 
                />
              </div>
            )}

            {currentPage === 'Floor Dashboard' && (
              <div className="animate-fade-in">
                <FloorDashboardView
                  floors={floors}
                  selectedFloorId={selectedFloorId}
                  onSelectFloor={setSelectedFloorId}
                />
              </div>
            )}

            {currentPage === 'Management Dashboard' && (
              <div className="space-y-6 animate-fade-in">
                <div className="border-b border-gray-100 pb-3">
                  <h2 className="font-sans text-xl font-black tracking-tight text-gray-900">
                    Executive Control Center
                  </h2>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    High-level aggregate target projections
                  </p>
                </div>
                <DashboardCharts />
              </div>
            )}

            {currentPage === 'Reports' && (
              <div className="animate-fade-in">
                <ReportsView floors={floors} productionEntries={productionEntries} />
              </div>
            )}

            {currentPage === 'User Management' && (
              <div className="animate-fade-in">
                <UserManagementView />
              </div>
            )}

            {currentPage === 'Settings' && (
              <div className="animate-fade-in">
                <SettingsView />
              </div>
            )}

            {/* 3. Corporate Footer */}
            <footer className="mt-12 border-t border-gray-100 py-6 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="flex flex-col items-center justify-between gap-2 sm:flex-row sm:gap-0">
                <span>© {new Date().getFullYear()} Epyllion Knitex Ltd.</span>
                <span>Knitting Performance System • Version 1.0</span>
                <span className="text-blue-600/80">Designed for Production Management</span>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
