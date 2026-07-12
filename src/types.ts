/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KPIMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  description: string;
  change: string; // e.g. "+2.4%" or "-0.8%"
  isPositive: boolean;
  color: 'blue' | 'green' | 'orange' | 'red';
  iconName: string;
}

export interface FactoryFloor {
  id: string;
  name: string;
  longName: string;
  status: 'optimal' | 'warning' | 'critical';
  targetKg: number;
  productionKg: number;
  achievementPct: number;
  runningMachines: number;
  totalMachines: number;
  idleMachines: number;
  efficiencyPct: number;
  rejectPct: number;
  lastUpdated: string;
}

export interface ProductionEntry {
  id: string;
  floorId: string;
  timestamp: string;
  machineId: string;
  operatorName: string;
  shift: 'A' | 'B' | 'C';
  yarnType: string;
  fabricType: string;
  productionKg: number;
  rejectKg: number;
  remarks?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  floorId?: string;
  type: 'production' | 'alert' | 'maintenance' | 'system';
  message: string;
  status: 'info' | 'success' | 'warning' | 'danger';
}

export interface ChartDataPoint {
  label: string;
  value1: number; // Target / Primary value
  value2?: number; // Actual / Secondary value
  value3?: number; // Reject / Tertiary value
}
