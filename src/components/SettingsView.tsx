/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Save, AlertTriangle, Image, Mail, Cpu, Sparkles, CheckCircle } from 'lucide-react';

export default function SettingsView() {
  const [rejectThreshold, setRejectThreshold] = useState(() => localStorage.getItem('setting_rejectThreshold') || '2.5');
  const [maxIdleMachines, setMaxIdleMachines] = useState(() => localStorage.getItem('setting_maxIdleMachines') || '4');
  const [alarmEmail, setAlarmEmail] = useState(() => localStorage.getItem('setting_alarmEmail') || 'knitprod-alerts@epyllion.com');
  
  // Unit-wise Capacity targets states
  const [targetEKL, setTargetEKL] = useState(() => localStorage.getItem('target_capacity_EKL') || '7500');
  const [targetEFL, setTargetEFL] = useState(() => localStorage.getItem('target_capacity_EFL') || '15000');
  const [targetEFL2, setTargetEFL2] = useState(() => localStorage.getItem('target_capacity_EFL-2') || '15000');
  const [targetAutoStripe, setTargetAutoStripe] = useState(() => localStorage.getItem('target_capacity_Auto Stripe') || '12000');
  const [targetEFLExt, setTargetEFLExt] = useState(() => localStorage.getItem('target_capacity_EFL-Extension') || '15000');
  const [targetESLExt, setTargetESLExt] = useState(() => localStorage.getItem('target_capacity_ESL-Extension') || '10000');

  // Total Machine states initialized with current default configurations
  const [machinesEKL, setMachinesEKL] = useState(() => localStorage.getItem('total_machines_EKL') || '48');
  const [machinesEFL, setMachinesEFL] = useState(() => localStorage.getItem('total_machines_EFL') || '40');
  const [machinesEFL2, setMachinesEFL2] = useState(() => localStorage.getItem('total_machines_EFL-2') || '35');
  const [machinesAutoStripe, setMachinesAutoStripe] = useState(() => localStorage.getItem('total_machines_Auto Stripe') || '20');
  const [machinesEFLExt, setMachinesEFLExt] = useState(() => localStorage.getItem('total_machines_EFL-Extension') || '25');
  const [machinesESLExt, setMachinesESLExt] = useState(() => localStorage.getItem('total_machines_ESL-Extension') || '16');

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save standard thresholds & fallback standard target
    localStorage.setItem('setting_targetWeight', targetEFL);
    localStorage.setItem('setting_rejectThreshold', rejectThreshold);
    localStorage.setItem('setting_maxIdleMachines', maxIdleMachines);
    localStorage.setItem('setting_alarmEmail', alarmEmail);

    // Save individual unit-wise capacity targets
    localStorage.setItem('target_capacity_EKL', targetEKL);
    localStorage.setItem('target_capacity_EFL', targetEFL);
    localStorage.setItem('target_capacity_EFL-2', targetEFL2);
    localStorage.setItem('target_capacity_Auto Stripe', targetAutoStripe);
    localStorage.setItem('target_capacity_EFL-Extension', targetEFLExt);
    localStorage.setItem('target_capacity_ESL-Extension', targetESLExt);

    // Save total machines per floor unit
    localStorage.setItem('total_machines_EKL', machinesEKL);
    localStorage.setItem('total_machines_EFL', machinesEFL);
    localStorage.setItem('total_machines_EFL-2', machinesEFL2);
    localStorage.setItem('total_machines_Auto Stripe', machinesAutoStripe);
    localStorage.setItem('total_machines_EFL-Extension', machinesEFLExt);
    localStorage.setItem('total_machines_ESL-Extension', machinesESLExt);

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
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xs lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <h3 className="font-sans text-sm font-black text-gray-900 uppercase border-b border-gray-50 pb-2 flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-blue-600" />
              General Threshold Settings
            </h3>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* Unit-wise Target Capacities */}
              <div className="col-span-1 sm:col-span-2 space-y-3 bg-blue-50/25 dark:bg-slate-900/40 p-4 rounded-xl border border-blue-100/50 dark:border-slate-800">
                <label className="text-[10px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-400 block border-b border-blue-100/30 dark:border-slate-800/80 pb-1.5">
                  Unit-wise Target Capacity (Kg)
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">EKL Target</label>
                    <input
                      type="number"
                      value={targetEKL}
                      onChange={(e) => setTargetEKL(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">EFL Target</label>
                    <input
                      type="number"
                      value={targetEFL}
                      onChange={(e) => setTargetEFL(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">EFL-2 Target</label>
                    <input
                      type="number"
                      value={targetEFL2}
                      onChange={(e) => setTargetEFL2(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Auto Stripe Target</label>
                    <input
                      type="number"
                      value={targetAutoStripe}
                      onChange={(e) => setTargetAutoStripe(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">EFL-Extension</label>
                    <input
                      type="number"
                      value={targetEFLExt}
                      onChange={(e) => setTargetEFLExt(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">ESL-Extension</label>
                    <input
                      type="number"
                      value={targetESLExt}
                      onChange={(e) => setTargetESLExt(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono font-bold text-gray-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>


            </div>

            <h3 className="font-sans text-sm font-black text-gray-900 uppercase border-b border-gray-50 pt-4 pb-2 flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-indigo-600" />
              Total Machine Update
            </h3>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">EKL Unit Machines</label>
                <input
                  type="number"
                  value={machinesEKL}
                  onChange={(e) => setMachinesEKL(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">EFL Unit Machines</label>
                <input
                  type="number"
                  value={machinesEFL}
                  onChange={(e) => setMachinesEFL(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">EFL-2 Unit Machines</label>
                <input
                  type="number"
                  value={machinesEFL2}
                  onChange={(e) => setMachinesEFL2(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Auto Stripe Machines</label>
                <input
                  type="number"
                  value={machinesAutoStripe}
                  onChange={(e) => setMachinesAutoStripe(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">EFL-Extension</label>
                <input
                  type="number"
                  value={machinesEFLExt}
                  onChange={(e) => setMachinesEFLExt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">ESL-Extension</label>
                <input
                  type="number"
                  value={machinesESLExt}
                  onChange={(e) => setMachinesESLExt(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-800 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>
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
