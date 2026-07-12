/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FactoryFloor } from '../types';
import { 
  Play, 
  Pause, 
  Wrench, 
  Activity, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertCircle,
  Cpu,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { FABRIC_TYPES } from '../data';

interface FloorDashboardViewProps {
  floors: FactoryFloor[];
  selectedFloorId: string | null;
  onSelectFloor: (floorId: string | null) => void;
}

// Mock Knitting machines list per floor
interface KnittingMachine {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'maintenance' | 'stopped';
  rpm: number;
  gsm: number;
  fabricType: string;
  efficiency: number;
  stopReason?: string;
}

const MACHINE_TEMPLATES: KnittingMachine[] = [
  { id: 'm01', name: 'M-01 (Mayer & Cie)', status: 'running', rpm: 22, gsm: 160, fabricType: 'Single Jersey', efficiency: 96.4 },
  { id: 'm02', name: 'M-02 (Mayer & Cie)', status: 'running', rpm: 21, gsm: 180, fabricType: '1x1 Rib', efficiency: 94.2 },
  { id: 'm03', name: 'M-03 (Terrot)', status: 'running', rpm: 20, gsm: 220, fabricType: 'Interlock', efficiency: 95.8 },
  { id: 'm04', name: 'M-04 (Terrot)', status: 'idle', rpm: 0, gsm: 240, fabricType: 'French Terry', efficiency: 82.0, stopReason: 'Awaiting Yarn' },
  { id: 'm05', name: 'M-05 (Fukuhara)', status: 'running', rpm: 23, gsm: 140, fabricType: 'Single Jersey', efficiency: 97.1 },
  { id: 'm06', name: 'M-06 (Fukuhara)', status: 'maintenance', rpm: 0, gsm: 0, fabricType: 'None', efficiency: 0.0, stopReason: 'Sinker Replacement' },
  { id: 'm07', name: 'M-07 (Pai Lung)', status: 'running', rpm: 18, gsm: 300, fabricType: 'Fleece', efficiency: 91.5 },
  { id: 'm08', name: 'M-08 (Pai Lung)', status: 'stopped', rpm: 0, gsm: 160, fabricType: 'Single Jersey', efficiency: 45.0, stopReason: 'Needle Breakage' },
];

export default function FloorDashboardView({ floors, selectedFloorId, onSelectFloor }: FloorDashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'idle' | 'warning'>('all');

  const currentFloor = floors.find(f => f.id === (selectedFloorId || 'ekl')) || floors[0];

  // Helper status styling
  const floorStyles = {
    optimal: {
      text: 'text-emerald-700 bg-emerald-50 border-emerald-100',
      pulse: 'bg-emerald-500',
      label: 'Optimal Output'
    },
    warning: {
      text: 'text-amber-700 bg-amber-50 border-amber-100',
      pulse: 'bg-amber-500',
      label: 'Minor Hold / Setup'
    },
    critical: {
      text: 'text-red-700 bg-red-50 border-red-100',
      pulse: 'bg-red-500',
      label: 'Major Machine Stop'
    }
  }[currentFloor.status];

  // Map floor specific machines (with slight procedural variation to look highly realistic)
  const getFloorMachines = (floorId: string): KnittingMachine[] => {
    return MACHINE_TEMPLATES.map((m, index) => {
      // Procedural variation based on floor characteristics
      if (floorId === 'efl-ext' && (index === 2 || index === 4 || index === 7)) {
        return { ...m, status: 'stopped', rpm: 0, efficiency: 30, stopReason: 'Lycra feed break' };
      }
      if (floorId === 'efl-2' && index === 5) {
        return { ...m, status: 'idle', rpm: 0, efficiency: 70, stopReason: 'Clean and oiling' };
      }
      return m;
    });
  };

  const machines = getFloorMachines(currentFloor.id);

  // Filters
  const filteredMachines = machines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.fabricType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.stopReason && m.stopReason.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'running') return matchesSearch && m.status === 'running';
    if (statusFilter === 'idle') return matchesSearch && m.status === 'idle';
    if (statusFilter === 'warning') return matchesSearch && (m.status === 'stopped' || m.status === 'maintenance');
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top floor selector tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h2 className="font-sans text-xl font-black tracking-tight text-gray-900">
            Floor Production Console
          </h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Deep drilldown across circular & jacquard machinery
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-xl bg-gray-50 p-1">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectFloor(f.id)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold uppercase transition-all ${
                currentFloor.id === f.id 
                  ? 'bg-blue-900 text-white shadow-xs' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}
              id={`floor-tab-${f.id}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* Floor Overview Header Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Floor general metrics */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Operational Status</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${floorStyles.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${floorStyles.pulse}`} />
              {floorStyles.label}
            </span>
          </div>
          <div className="mt-4">
            <span className="block text-xs font-semibold text-gray-400 uppercase">Active Floor Unit</span>
            <span className="text-lg font-black text-gray-900 leading-tight">
              {currentFloor.longName}
            </span>
          </div>
        </div>

        {/* Floor production stats */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Today's Shift Production</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-blue-900">
              {currentFloor.productionKg.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-400">Kg / {currentFloor.targetKg.toLocaleString()} target</span>
          </div>
          {/* Progress bar */}
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full" 
                style={{ width: `${Math.min(currentFloor.achievementPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase">
              <span>Overall Achievement</span>
              <span>{currentFloor.achievementPct}%</span>
            </div>
          </div>
        </div>

        {/* active frame details */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Active Knitting Frames</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-gray-900">
              {currentFloor.runningMachines}
            </span>
            <span className="text-xs font-bold text-gray-400">of {currentFloor.totalMachines} installed</span>
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> {currentFloor.idleMachines} Idle</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> {currentFloor.totalMachines - currentFloor.runningMachines - currentFloor.idleMachines} Down</span>
          </div>
        </div>

        {/* Scrap rates */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Average Floor Quality</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-black text-red-700">
              {currentFloor.rejectPct}%
            </span>
            <span className="text-xs font-bold text-gray-400">scrap rate</span>
          </div>
          <p className="mt-2 text-[10px] text-gray-500 font-medium">
            Knitting efficiency averages <strong className="text-gray-800">{currentFloor.efficiencyPct}%</strong> across active cylinders.
          </p>
        </div>
      </div>

      {/* Machine layout monitoring block */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
        {/* Controls bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="font-sans text-sm font-black text-gray-900 uppercase">
              Interactive Machine Matrix ({filteredMachines.length} frames)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search inputs */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search machine structure..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-3.5 text-xs font-semibold text-gray-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Status filters */}
            <div className="flex gap-1.5 rounded-lg bg-gray-50 p-1 border border-gray-200">
              {(['all', 'running', 'idle', 'warning'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    statusFilter === f 
                      ? 'bg-white text-blue-700 shadow-xs' 
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'warning' ? 'Alerts' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Machine cards matrix */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredMachines.map((m) => {
            
            // Map Machine State
            const machineStatus = {
              running: {
                border: 'border-emerald-100 hover:border-emerald-300 bg-linear-to-b from-white to-emerald-50/10',
                statusDot: 'bg-emerald-500',
                statusText: 'Running',
                iconBg: 'bg-emerald-50 text-emerald-700',
              },
              idle: {
                border: 'border-amber-100 hover:border-amber-300 bg-linear-to-b from-white to-amber-50/10',
                statusDot: 'bg-amber-500',
                statusText: m.stopReason || 'Idle',
                iconBg: 'bg-amber-50 text-amber-700',
              },
              maintenance: {
                border: 'border-red-100 hover:border-red-300 bg-linear-to-b from-white to-red-50/10',
                statusDot: 'bg-red-500',
                statusText: m.stopReason || 'Maintenance',
                iconBg: 'bg-red-50 text-red-700',
              },
              stopped: {
                border: 'border-red-100 hover:border-red-300 bg-linear-to-b from-white to-red-50/10',
                statusDot: 'bg-red-500',
                statusText: m.stopReason || 'Alert Stop',
                iconBg: 'bg-red-50 text-red-700',
              }
            }[m.status];

            return (
              <div 
                key={m.id}
                className={`rounded-xl border p-4 shadow-2xs transition-all duration-200 hover:-translate-y-1 ${machineStatus.border}`}
              >
                {/* Machine top bar */}
                <div className="flex items-center justify-between">
                  <span className="font-sans text-xs font-black text-gray-900">{m.name}</span>
                  <div className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${machineStatus.statusDot}`} />
                    <span className="text-[9px] font-bold text-gray-500 uppercase">{machineStatus.statusText}</span>
                  </div>
                </div>

                {/* Machine specifics */}
                <div className="mt-4 space-y-2 border-b border-gray-50 pb-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-400">Knitting Structure:</span>
                    <span className="text-gray-800">{m.fabricType !== 'None' ? m.fabricType : '—'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-400">Cylinder Speed:</span>
                    <span className="text-gray-800 font-mono flex items-center gap-1">
                      <Gauge className="h-3 w-3 text-blue-500" />
                      {m.rpm} RPM
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-gray-400">Target Density (GSM):</span>
                    <span className="text-gray-800 font-mono">{m.gsm !== 0 ? `${m.gsm}g` : '—'}</span>
                  </div>
                </div>

                {/* Machine bottom efficiency */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">Efficiency Ratio</span>
                    <span className="font-mono text-xs font-black text-gray-900">{m.efficiency}%</span>
                  </div>
                  <div className="h-1 w-20 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${m.efficiency >= 90 ? 'bg-emerald-500' : m.efficiency >= 70 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${m.efficiency}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMachines.length === 0 && (
            <div className="col-span-full py-12 text-center text-xs font-bold text-gray-400">
              No machinery match the specified parameters. Try clearing the search filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
