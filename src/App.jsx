import React, { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import EmployeePortal from './components/EmployeePortal.jsx';
import AdminPortal from './components/AdminPortal.jsx';
import KioskPortal from './components/KioskPortal.jsx';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState('employee'); // 'employee' | 'admin' | 'kiosk'
  const [company, setCompany] = useState(null);
  const [offices, setOffices] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [resComp, resOff, resShifts, resEmps] = await Promise.all([
        fetch('/api/company'),
        fetch('/api/offices'),
        fetch('/api/shifts'),
        fetch('/api/employees')
      ]);

      const comp = await resComp.json();
      const offs = await resOff.json();
      const shfts = await resShifts.json();
      const emps = await resEmps.json();

      setCompany(comp);
      setOffices(offs);
      setShifts(shfts);
      setEmployees(emps);

      if (emps.length > 0 && !selectedEmployee) {
        setSelectedEmployee(emps[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading application state:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <img
          src="/logo.png"
          alt="STRONGMATE"
          className="w-20 h-20 object-contain rounded-full border-2 border-rose-500 shadow-xl mb-4 animate-pulse bg-white/5"
        />
        <h2 className="font-extrabold text-xl tracking-tight">STRONG<span className="text-rose-500">MATE™</span></h2>
        <p className="text-xs text-slate-400 mt-1">Starting Enterprise Attendance Engine...</p>
      </div>
    );
  }

  const currentOffice = offices.find(o => o.id === selectedEmployee?.officeId) || offices[0];
  const currentShift = shifts.find(s => s.id === selectedEmployee?.shiftId) || shifts[0];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header
        company={company}
        currentRole={role}
        setRole={setRole}
        employees={employees}
        selectedEmployee={selectedEmployee}
        setSelectedEmployee={setSelectedEmployee}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {role === 'employee' && selectedEmployee && (
          <EmployeePortal
            employee={selectedEmployee}
            office={currentOffice}
            shift={currentShift}
            onRefresh={loadInitialData}
          />
        )}

        {role === 'admin' && (
          <AdminPortal
            company={company}
            offices={offices}
            shifts={shifts}
            employees={employees}
            onRefresh={loadInitialData}
          />
        )}

        {role === 'kiosk' && (
          <KioskPortal
            employees={employees}
            onRefresh={loadInitialData}
          />
        )}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <img src="/logo.png" alt="Logo" className="w-5 h-5 rounded-full inline-block" />
        <p>© 2026 STRONGMATE™ Corporation. All rights reserved. Reverse engineered & built with REA integration.</p>
      </footer>
    </div>
  );
}
