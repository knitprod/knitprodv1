/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Percent, 
  Cpu, 
  Trash2, 
  Layers, 
  Clock, 
  Info,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { 
  PRODUCTION_TREND_DATA, 
  ACHIEVEMENT_TREND_DATA, 
  REJECT_ANALYSIS_DATA, 
  SHIFT_PERFORMANCE_DATA, 
  MACHINE_UTILIZATION_DATA,
  INITIAL_FLOORS 
} from '../data';

export default function DashboardCharts() {
  const [activeTab, setActiveTab] = useState<'all' | 'production' | 'machines' | 'rejects'>('all');
  const [hoveredProductionIndex, setHoveredProductionIndex] = useState<number | null>(null);
  const [hoveredRejectIndex, setHoveredRejectIndex] = useState<number | null>(null);

  // SVG Chart Dimensions & Computations
  const productionChartHeight = 160;
  const productionChartWidth = 500;
  
  // Production Trend Line Computations
  const maxProdValue = 110000;
  const scaleY = (val: number) => productionChartHeight - (val / maxProdValue) * productionChartHeight;
  
  const targetLinePoints = PRODUCTION_TREND_DATA.map((d, i) => {
    const x = (i / (PRODUCTION_TREND_DATA.length - 1)) * productionChartWidth;
    const y = scaleY(d.value1);
    return `${x},${y}`;
  }).join(' ');

  const actualLinePoints = PRODUCTION_TREND_DATA.map((d, i) => {
    const x = (i / (PRODUCTION_TREND_DATA.length - 1)) * productionChartWidth;
    const y = scaleY(d.value2 || 0);
    return `${x},${y}`;
  }).join(' ');

  // Area points (for actual production gradient shadow)
  const actualAreaPoints = `${PRODUCTION_TREND_DATA.map((d, i) => {
    const x = (i / (PRODUCTION_TREND_DATA.length - 1)) * productionChartWidth;
    const y = scaleY(d.value2 || 0);
    return `${x},${y}`;
  }).join(' ')} ${productionChartWidth},${productionChartHeight} 0,${productionChartHeight}`;

  return (
    <div className="space-y-6">
      {/* Chart Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <h2 className="font-sans text-lg font-black tracking-tight text-gray-900">
            Performance Analytics Engine
          </h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Consolidated factory floor analytics
          </p>
        </div>
        <div className="flex gap-1.5 rounded-lg bg-gray-50 p-1">
          {(['all', 'production', 'machines', 'rejects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-xs' 
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              id={`chart-tab-${tab}`}
            >
              {tab === 'all' ? 'All Metrics' : tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* CHART 1: Production Trend (Target vs Actual) */}
        {(activeTab === 'all' || activeTab === 'production') && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs" id="chart-card-production-trend">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black text-gray-900">Production Trend (Daily Plan vs Actual)</h3>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Last 7 Days (Kg Knitting Output)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1.5 text-gray-400">
                  <span className="h-1.5 w-4 rounded-full border border-gray-400 border-dashed" /> Target
                </span>
                <span className="flex items-center gap-1.5 text-blue-600">
                  <span className="h-2 w-2 rounded-full bg-blue-600" /> Actual
                </span>
              </div>
            </div>

            {/* Interactive SVG Line & Area Chart */}
            <div className="mt-5 relative">
              <svg 
                viewBox={`0 0 ${productionChartWidth} ${productionChartHeight}`} 
                className="w-full overflow-visible"
              >
                {/* Defs for gradients */}
                <defs>
                  <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F4C81" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0F4C81" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
                  <line 
                    key={idx}
                    x1="0" 
                    y1={productionChartHeight * p} 
                    x2={productionChartWidth} 
                    y2={productionChartHeight * p} 
                    stroke="#F1F5F9" 
                    strokeWidth="1" 
                  />
                ))}

                {/* Vertical helper highlights on hover */}
                {hoveredProductionIndex !== null && (
                  <line 
                    x1={(hoveredProductionIndex / (PRODUCTION_TREND_DATA.length - 1)) * productionChartWidth}
                    y1="0"
                    x2={(hoveredProductionIndex / (PRODUCTION_TREND_DATA.length - 1)) * productionChartWidth}
                    y2={productionChartHeight}
                    stroke="#94A3B8"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                )}

                {/* Target Line (Dashed Slate) */}
                <polyline
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  points={targetLinePoints}
                />

                {/* Actual Area (Gradient fill) */}
                <polygon
                  fill="url(#actualAreaGrad)"
                  points={actualAreaPoints}
                />

                {/* Actual Line (Deep Blue #0F4C81) */}
                <polyline
                  fill="none"
                  stroke="#0F4C81"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={actualLinePoints}
                />

                {/* Interactive circles */}
                {PRODUCTION_TREND_DATA.map((d, i) => {
                  const x = (i / (PRODUCTION_TREND_DATA.length - 1)) * productionChartWidth;
                  const y = scaleY(d.value2 || 0);
                  const isHovered = hoveredProductionIndex === i;

                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={isHovered ? 6 : 4}
                      fill={isHovered ? "#0F4C81" : "#FFFFFF"}
                      stroke="#0F4C81"
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredProductionIndex(i)}
                      onMouseLeave={() => setHoveredProductionIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* X-Axis labels */}
              <div className="mt-3 flex justify-between px-1 text-[10px] font-bold text-gray-400">
                {PRODUCTION_TREND_DATA.map((d, idx) => (
                  <span key={idx}>{d.label}</span>
                ))}
              </div>

              {/* Dynamic Chart Tooltip */}
              {hoveredProductionIndex !== null && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-lg border border-gray-100 bg-white p-2.5 shadow-md ring-1 ring-black/5">
                  <div>
                    <span className="block text-[9px] font-bold text-gray-400 uppercase">
                      {PRODUCTION_TREND_DATA[hoveredProductionIndex].label} Target
                    </span>
                    <span className="font-mono text-xs font-black text-gray-500">
                      {PRODUCTION_TREND_DATA[hoveredProductionIndex].value1.toLocaleString()} Kg
                    </span>
                  </div>
                  <div className="h-6 w-px bg-gray-100" />
                  <div>
                    <span className="block text-[9px] font-bold text-blue-600 uppercase">
                      Actual Yield
                    </span>
                    <span className="font-mono text-xs font-black text-blue-800">
                      {PRODUCTION_TREND_DATA[hoveredProductionIndex].value2?.toLocaleString()} Kg
                    </span>
                  </div>
                  <div className="h-6 w-px bg-gray-100" />
                  <div>
                    <span className="block text-[9px] font-bold text-emerald-600 uppercase">
                      Achievement
                    </span>
                    <span className="font-mono text-xs font-black text-emerald-700">
                      {Math.round(((PRODUCTION_TREND_DATA[hoveredProductionIndex].value2 || 0) / PRODUCTION_TREND_DATA[hoveredProductionIndex].value1) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHART 2: Achievement Trend */}
        {(activeTab === 'all' || activeTab === 'production') && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs" id="chart-card-achievement-trend">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Percent className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black text-gray-900">Achievement Trend</h3>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Daily performance percentage against standard</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 rounded-full bg-emerald-50 px-2.5 py-0.5">
                Avg: 97.4%
              </span>
            </div>

            {/* Achievement Line Visualization */}
            <div className="mt-5 space-y-4">
              <div className="flex items-end justify-between gap-2 h-28">
                {ACHIEVEMENT_TREND_DATA.map((d, idx) => {
                  const targetHeight = `${d.value1}%`;
                  const isUnder = d.value1 < 95;
                  
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                      <div className="relative w-full flex flex-col justify-end h-24">
                        {/* Hover Tooltip */}
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-gray-900 text-white font-mono text-[9px] px-1.5 py-0.5 rounded transition-all pointer-events-none whitespace-nowrap z-10">
                          {d.value1}% achievement
                        </div>
                        
                        <div 
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isUnder 
                              ? 'bg-amber-400 group-hover:bg-amber-500' 
                              : 'bg-emerald-500 group-hover:bg-emerald-600'
                          }`}
                          style={{ height: targetHeight }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{d.label.split(' ')[1]}</span>
                    </div>
                  );
                })}
              </div>
              
              {/* Context Note */}
              <div className="rounded-xl bg-gray-50 p-3 flex items-start gap-2.5 text-[11px] text-gray-500 font-medium">
                <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  Achievement peaked at <strong className="text-emerald-700">101.2%</strong> on Jul 09 due to high efficiency yarn allocation, with a minor dip today as EFL-Extension underwent motor tuning.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHART 3: Machine Utilization */}
        {(activeTab === 'all' || activeTab === 'machines') && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs" id="chart-card-machine-utilization">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black text-gray-900">Machine Utilization by Floor</h3>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Knitting frame allocations (Running vs Idle)</p>
                </div>
              </div>
            </div>

            {/* Horizontal Stacked Bars */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-600" /> Running Frames</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Idle / Setup</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Maintenance</span>
              </div>

              <div className="space-y-3">
                {MACHINE_UTILIZATION_DATA.map((floor, idx) => {
                  const total = floor.value1 + floor.value2 + floor.value3;
                  const runPct = (floor.value1 / total) * 100;
                  const idlePct = (floor.value2 / total) * 100;
                  const maintPct = (floor.value3 / total) * 100;

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-700">{floor.label}</span>
                        <span className="font-mono text-gray-400">
                          {floor.value1} / {total} Active ({Math.round(runPct)}%)
                        </span>
                      </div>
                      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
                        <div 
                          className="h-full bg-blue-600 transition-all duration-500 hover:opacity-95"
                          style={{ width: `${runPct}%` }}
                          title={`Running: ${floor.value1}`}
                        />
                        <div 
                          className="h-full bg-amber-400 transition-all duration-500 hover:opacity-95"
                          style={{ width: `${idlePct}%` }}
                          title={`Idle: ${floor.value2}`}
                        />
                        <div 
                          className="h-full bg-red-500 transition-all duration-500 hover:opacity-95"
                          style={{ width: `${maintPct}%` }}
                          title={`Maintenance: ${floor.value3}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CHART 4: Reject Analysis */}
        {(activeTab === 'all' || activeTab === 'rejects') && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs" id="chart-card-reject-analysis">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black text-gray-900">Fabric Reject Analysis (Pareto)</h3>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Defect classification breakdown</p>
                </div>
              </div>
            </div>

            {/* Reject category distribution */}
            <div className="mt-5 space-y-4">
              <div className="space-y-3">
                {REJECT_ANALYSIS_DATA.map((item, idx) => {
                  const maxVal = 50;
                  const percent = (item.value1 / maxVal) * 100;
                  
                  return (
                    <div 
                      key={idx} 
                      className="space-y-1.5 cursor-pointer"
                      onMouseEnter={() => setHoveredRejectIndex(idx)}
                      onMouseLeave={() => setHoveredRejectIndex(null)}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-red-600" />
                          {item.label}
                        </span>
                        <span className="font-mono text-red-700">
                          {item.value1} cases
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-gray-100">
                        <div 
                          className={`h-full rounded-full bg-red-500 transition-all duration-300 ${
                            hoveredRejectIndex === idx ? 'bg-red-600 shadow-sm' : ''
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QA action notice */}
              <div className="rounded-xl border border-red-100 bg-red-50/40 p-3 flex items-start gap-2 text-[11px] text-red-900 font-medium">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Yarn Defect</strong> continues to represent 38% of reject scrap material. Production team should coordinate with yarn warehouse inspection immediately.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CHART 5: Floor Comparison */}
        {activeTab === 'all' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs" id="chart-card-floor-comparison">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black text-gray-900">Floor Production comparison</h3>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Yield comparison across all 6 knitting floors</p>
                </div>
              </div>
            </div>

            {/* Floor columns */}
            <div className="mt-5 space-y-4">
              <div className="flex items-end justify-between gap-3 h-28">
                {INITIAL_FLOORS.map((floor, idx) => {
                  const maxTarget = 25000;
                  const prodHeight = `${(floor.productionKg / maxTarget) * 100}%`;
                  const targetHeight = `${(floor.targetKg / maxTarget) * 100}%`;

                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group relative">
                      {/* Grid and stacked columns */}
                      <div className="relative w-full flex items-end justify-center h-24 gap-1">
                        {/* Target line guideline */}
                        <div 
                          className="absolute w-full border-t border-dashed border-gray-400 z-0 pointer-events-none opacity-50"
                          style={{ bottom: targetHeight }}
                          title={`Target: ${floor.targetKg}`}
                        />

                        {/* Actual yield column */}
                        <div 
                          className="w-5 rounded-t bg-blue-700 group-hover:bg-blue-800 transition-colors z-10"
                          style={{ height: prodHeight }}
                        />
                      </div>
                      <span className="text-[9px] font-bold text-gray-500 text-center uppercase tracking-tight">{floor.name}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-center gap-4 text-[10px] font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 border-t border-dashed border-gray-400" /> Target Plan</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-xs bg-blue-700" /> Knitted Output</span>
              </div>
            </div>
          </div>
        )}

        {/* CHART 6: Daily Shift Performance */}
        {activeTab === 'all' && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs" id="chart-card-shift-performance">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-sans text-sm font-black text-gray-900">Shift Performance Analysis</h3>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase">Target vs Actual output by 8-hour shift rosters</p>
                </div>
              </div>
            </div>

            {/* Shift side by side comparison */}
            <div className="mt-5 space-y-4">
              <div className="space-y-3.5">
                {SHIFT_PERFORMANCE_DATA.map((shift, idx) => {
                  const targetPct = 100;
                  const actualPct = (shift.value2 / shift.value1) * 100;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span>{shift.label}</span>
                        <span className="font-mono text-gray-500">
                          {shift.value2.toLocaleString()} / {shift.value1.toLocaleString()} Kg ({Math.round(actualPct)}%)
                        </span>
                      </div>
                      <div className="relative h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                        {/* Target guideline in bar */}
                        <div 
                          className="absolute top-0 bottom-0 left-0 bg-blue-200 transition-all duration-300"
                          style={{ width: `${targetPct}%` }}
                        />
                        {/* Actual bar */}
                        <div 
                          className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-300 ${
                            actualPct >= 95 ? 'bg-emerald-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${Math.min(actualPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status footer for Shift */}
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase">
                <span>Roster Shift: 24h continuous</span>
                <span className="text-emerald-600">Shift B Outperformed target by 2%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
