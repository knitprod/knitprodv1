/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Save, AlertTriangle, Image, Mail, Cpu, Sparkles, CheckCircle } from 'lucide-react';

export default function SettingsView() {
  const [targetWeight, setTargetWeight] = useState('15000');
  const [rejectThreshold, setRejectThreshold] = useState('2.5');
  const [maxIdleMachines, setMaxIdleMachines] = useState('4');
  const [alarmEmail, setAlarmEmail] = useState('knitprod-alerts@epyllion.com');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-sans text-xl font-black tracking-tight text-gray-900">
          Knitting Performance System Configuration
        </h2>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Configure default floor plans, quality tolerances, and notification hooks
        </p>
      </div>

      {isSaved && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 shadow-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <span>Application configurations successfully committed to central cache registry.</span>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Settings Form */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="font-sans text-sm font-black text-gray-900 uppercase border-b border-gray-50 pb-2 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-blue-600" />
              General Threshold Settings
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Default Floor Target */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Standard Floor Target (Kg)
                </label>
                <input
                  type="number"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Scrap Alarm Threshold */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Defect Scrap Alarm Threshold (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={rejectThreshold}
                  onChange={(e) => setRejectThreshold(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Max Idle frames warning */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Max Idle Machinery Limit
                </label>
                <input
                  type="number"
                  value={maxIdleMachines}
                  onChange={(e) => setMaxIdleMachines(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* QA Alert Email hook */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  QA Alert Notification Email
                </label>
                <input
                  type="email"
                  value={alarmEmail}
                  onChange={(e) => setAlarmEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-amber-50/50 border border-amber-100 p-4">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Automatic Alarm System Trigger Rules</span>
              </div>
              <p className="text-[11px] font-medium text-amber-900/70 leading-relaxed">
                If active floor waste exceeds <strong className="text-amber-950">{rejectThreshold}%</strong> or idle machines count exceeds <strong className="text-amber-950">{maxIdleMachines} frames</strong>, an automated digest is dispatched immediately to the floor supervisor and logged to <strong className="text-amber-950">{alarmEmail}</strong>.
              </p>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-900 py-3 text-sm font-black text-white hover:bg-blue-950 transition-all shadow-md cursor-pointer"
            >
              <Save className="h-4.5 w-4.5" />
              <span>Save System Settings</span>
            </button>
          </form>
        </div>

        {/* Logo Customization guidelines */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
              <Image className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-sans text-xs font-black text-gray-900 uppercase">Logo Customization</h3>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
                  <Image className="h-5 w-5" />
                </div>
                <span className="mt-2 block text-xs font-bold text-gray-700">Company Logo Placeholder</span>
                <span className="mt-1 block text-[10px] text-gray-400">Recommended size: 160 x 50 pixels (PNG with alpha channel transparent)</span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase">Step-by-step Replacement Guide:</h4>
                <div className="text-[11px] font-medium text-gray-500 leading-relaxed space-y-2.5">
                  <p>
                    1. Save your company logo as a transparent PNG asset under the name <strong>company_logo.png</strong>.
                  </p>
                  <p>
                    2. Drag and upload that image into the <strong>/public/</strong> directory of the applet using the file browser.
                  </p>
                  <p>
                    3. Modify the placeholder image element in <strong>src/components/Header.tsx</strong> to reference your newly uploaded asset.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-blue-50/50 p-3.5 text-center">
            <span className="block text-[10px] font-black uppercase tracking-widest text-blue-800">
              Epyllion Knitex ERP Portal
            </span>
            <span className="mt-1 block text-[9px] text-blue-600 font-semibold">
              Software Version: 1.0.0 Stable Build
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
