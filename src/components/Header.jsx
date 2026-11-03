import React, { useState, useEffect } from 'react';
import { Shield, Users, Clock, Tablet } from 'lucide-react';

export default function Header({ currentRole, setRole, employees, selectedEmployee, setSelectedEmployee }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with User's Official Logo Image */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <img
              src="/logo.png"
              alt="STRONGMATE"
              className="w-10 h-10 object-contain rounded-full border border-rose-500/40 shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform bg-white/5"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                STRONG<span className="text-rose-500">MATE</span><span className="text-xs text-rose-400 align-super">™</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Attendance OS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Workforce & HRMS Platform</p>
          </div>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <Clock className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-xs font-semibold mono-font text-slate-200">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[11px] text-slate-500 border-l border-slate-800 pl-2">
            {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Controls: Role Switcher & Employee Picker */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Active Employee selector for Employee Mode */}
          {currentRole === 'employee' && (
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-2 py-1 rounded-xl">
              <img
                src={selectedEmployee?.avatar}
                alt={selectedEmployee?.firstName}
                className="w-6 h-6 rounded-full object-cover border border-rose-500/50"
              />
              <select
                value={selectedEmployee?.id}
                onChange={(e) => {
                  const emp = employees.find(x => x.id === e.target.value);
                  if (emp) setSelectedEmployee(emp);
                }}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[130px] sm:max-w-none truncate"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id} className="bg-slate-900 text-white">
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Role Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setRole('employee')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'employee'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Employee</span>
            </button>
            <button
              onClick={() => setRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'admin'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">HR Admin</span>
            </button>
            <button
              onClick={() => setRole('kiosk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentRole === 'kiosk'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kiosk</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
