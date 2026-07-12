/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, UserPlus, Shield, Terminal, Clock, CheckCircle, Search } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Manager' | 'Supervisor' | 'QA Auditor' | 'Operator';
  floorAllocation: string;
  shift: 'A' | 'B' | 'C' | 'General';
  status: 'Active' | 'Offline' | 'On Leave';
  lastActive: string;
}

const INITIAL_STAFF: Staff[] = [
  { id: 'usr-1', name: 'Zahirul Islam', email: 'zislam@epyllion.com', role: 'Manager', floorAllocation: 'All Floors', shift: 'General', status: 'Active', lastActive: 'Just now' },
  { id: 'usr-2', name: 'Akil Zaman', email: 'azaman@epyllion.com', role: 'Supervisor', floorAllocation: 'EKL Floor', shift: 'C', status: 'Active', lastActive: '5 mins ago' },
  { id: 'usr-3', name: 'Nasrin Akhter', email: 'nakhter@epyllion.com', role: 'QA Auditor', floorAllocation: 'EFL Unit', shift: 'C', status: 'Active', lastActive: '12 mins ago' },
  { id: 'usr-4', name: 'Kamal Hossain', email: 'khossain@epyllion.com', role: 'Supervisor', floorAllocation: 'EFL-2 Floor', shift: 'B', status: 'Offline', lastActive: '2 hrs ago' },
  { id: 'usr-5', name: 'Rashedul Bari', email: 'rbari@epyllion.com', role: 'Operator', floorAllocation: 'Auto Stripe', shift: 'C', status: 'Active', lastActive: '1 hr ago' },
  { id: 'usr-6', name: 'Taslima Begum', email: 'tbegum@epyllion.com', role: 'QA Auditor', floorAllocation: 'EFL-Extension', shift: 'A', status: 'Offline', lastActive: '14 hrs ago' },
];

export default function UserManagementView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Staff['role']>('all');

  const filteredStaff = INITIAL_STAFF.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          staff.floorAllocation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-sans text-xl font-black tracking-tight text-gray-900">
            Personnel & Shift Rosters
          </h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Monitor operator logons, active terminals, and floor assignments
          </p>
        </div>

        <button
          onClick={() => alert('Feature Prototype: Registering new staff accounts is available in the full ERP deployment.')}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-blue-950 shadow-sm cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Personnel</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Terminals list */}
        <div className="space-y-5 lg:col-span-1">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
              <Terminal className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-sans text-xs font-black text-gray-900 uppercase">Synced Terminals</h3>
            </div>

            <div className="space-y-3">
              {[
                { name: 'EKL scale COM-3', ip: '10.120.45.10', status: 'Active' },
                { name: 'EFL tablet UNIT-A', ip: '10.120.45.12', status: 'Active' },
                { name: 'EFL-2 terminal CORE', ip: '10.120.45.15', status: 'Idle' },
                { name: 'ESL gate weighing SCALE-1', ip: '10.120.46.22', status: 'Active' },
              ].map((term, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl bg-gray-50 p-3">
                  <div>
                    <span className="block text-xs font-bold text-gray-800">{term.name}</span>
                    <span className="font-mono text-[9px] text-gray-400">{term.ip}</span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                    term.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {term.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-3 mb-4">
              <Shield className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-sans text-xs font-black text-gray-900 uppercase">Access Rules</h3>
            </div>
            <div className="text-[11px] font-medium text-gray-500 leading-relaxed space-y-2">
              <p>
                - <strong>Shift Managers</strong> have full editing permissions on weights logs within 4 hours of cut time.
              </p>
              <p>
                - <strong>QA Auditors</strong> must sign off on any roll rejected with more than 3.0% waste.
              </p>
              <p>
                - <strong>Terminals</strong> operate in kiosk mode with automatic RFID logon card readers.
              </p>
            </div>
          </div>
        </div>

        {/* Staff Sheet */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs lg:col-span-2">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4.5 w-4.5 text-blue-600" />
              <h3 className="font-sans text-xs font-black text-gray-900 uppercase">Roster Sheet ({filteredStaff.length} members)</h3>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Search className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Search personnel..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-gray-50 py-1 pl-8 pr-3 text-xs font-semibold text-gray-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Roles dropdown */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-700 transition-colors focus:border-blue-500 focus:bg-white focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="Manager">Managers</option>
                <option value="Supervisor">Supervisors</option>
                <option value="QA Auditor">QA Auditors</option>
                <option value="Operator">Operators</option>
              </select>
            </div>
          </div>

          {/* Roster table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase bg-gray-50/50">
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Allocation</th>
                  <th className="px-3 py-2.5">Shift</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{staff.name}</span>
                        <span className="text-[10px] text-gray-400">{staff.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                        staff.role === 'Manager' ? 'bg-blue-50 text-blue-700' :
                        staff.role === 'Supervisor' ? 'bg-amber-50 text-amber-700' :
                        staff.role === 'QA Auditor' ? 'bg-purple-50 text-purple-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-gray-600">{staff.floorAllocation}</td>
                    <td className="px-3 py-3 font-bold text-gray-500">Shift {staff.shift}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider ${
                        staff.status === 'Active' ? 'text-emerald-600' : 'text-gray-400'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${staff.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[10px] text-gray-400">{staff.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
