import React, { useState, useEffect } from 'react';
import {
  Clock, MapPin, Calendar, FileText, CheckCircle2, AlertTriangle,
  Send, UserCheck, CreditCard, ChevronRight, Briefcase, Award, PlusCircle,
  Coffee, Utensils, CheckSquare, DollarSign, Download, Printer, ShieldCheck
} from 'lucide-react';
import EmployeePunchModal from './EmployeePunchModal.jsx';

export default function EmployeePortal({ employee, office, shift, onRefresh }) {
  const [todayRecord, setTodayRecord] = useState(null);
  const [history, setHistory] = useState([]);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [punchType, setPunchType] = useState('in'); // 'in' | 'out'
  const [timerText, setTimerText] = useState('00:00:00');

  // Break states
  const [breakData, setBreakData] = useState({ breakTypes: [], breaks: [], activeBreak: null });
  const [showBreakPicker, setShowBreakPicker] = useState(false);

  // Tasks & Holidays states
  const [tasks, setTasks] = useState([]);
  const [holidays, setHolidays] = useState([]);

  // Modals
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [payslipData, setPayslipData] = useState(null);

  // Form states
  const [regForm, setRegForm] = useState({ date: new Date().toISOString().split('T')[0], requestType: 'missed_checkout', proposedCheckIn: '09:30', proposedCheckOut: '18:30', reason: '' });
  const [leaveForm, setLeaveForm] = useState({ leaveType: 'CL', fromDate: new Date().toISOString().split('T')[0], toDate: new Date().toISOString().split('T')[0], dayPart: 'full', reason: '' });
  const [expenseForm, setExpenseForm] = useState({ date: new Date().toISOString().split('T')[0], category: 'Client Travel', kmTraveled: '', description: '' });

  useEffect(() => {
    fetchEmployeeData();
  }, [employee.id]);

  // Work session live ticking timer
  useEffect(() => {
    if (!todayRecord || !todayRecord.checkIn || todayRecord.checkOut) {
      if (todayRecord?.durationMins) {
        const hrs = Math.floor(todayRecord.durationMins / 60);
        const mins = todayRecord.durationMins % 60;
        setTimerText(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`);
      } else {
        setTimerText('00:00:00');
      }
      return;
    }

    const interval = setInterval(() => {
      const [h, m, s] = todayRecord.checkIn.split(':').map(Number);
      const start = new Date();
      start.setHours(h, m, s || 0, 0);
      const diffSecs = Math.max(0, Math.floor((new Date() - start) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const minutes = Math.floor((diffSecs % 3600) / 60);
      const seconds = diffSecs % 60;
      setTimerText(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [todayRecord]);

  const fetchEmployeeData = async () => {
    try {
      const [resToday, resHist, resBrk, resTasks, resHol] = await Promise.all([
        fetch(`/api/attendance/today/${employee.id}`),
        fetch(`/api/attendance/history/${employee.id}`),
        fetch(`/api/breaks/today/${employee.id}`),
        fetch('/api/tasks'),
        fetch('/api/holidays')
      ]);

      setTodayRecord(await resToday.json());
      setHistory(await resHist.json());
      setBreakData(await resBrk.json());
      const allTasks = await resTasks.json();
      setTasks(allTasks.filter(t => t.employeeId === employee.id));
      setHolidays(await resHol.json());
    } catch (err) {
      console.error("Error loading employee data:", err);
    }
  };

  const handleStartBreak = async (breakTypeId) => {
    try {
      const res = await fetch('/api/breaks/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id, breakTypeId })
      });
      if (res.ok) {
        setShowBreakPicker(false);
        fetchEmployeeData();
      }
    } catch (err) {
      alert("Break error: " + err.message);
    }
  };

  const handleEndBreak = async () => {
    try {
      const res = await fetch('/api/breaks/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employee.id })
      });
      if (res.ok) {
        fetchEmployeeData();
      }
    } catch (err) {
      alert("Break error: " + err.message);
    }
  };

  const handleToggleTask = async (taskId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchEmployeeData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPayslip = async () => {
    try {
      const res = await fetch(`/api/payslips/${employee.id}`);
      const data = await res.json();
      setPayslipData(data);
      setShowPayslipModal(true);
    } catch (err) {
      alert("Failed to load payslip: " + err.message);
    }
  };

  const handleApplyRegularization = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/regularizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...regForm, employeeId: employee.id })
      });
      if (res.ok) {
        alert("Regularization request submitted for manager approval!");
        setShowRegModal(false);
        setRegForm({ date: new Date().toISOString().split('T')[0], requestType: 'missed_checkout', proposedCheckIn: '09:30', proposedCheckOut: '18:30', reason: '' });
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leaveForm, employeeId: employee.id })
      });
      if (res.ok) {
        alert("Leave application submitted successfully!");
        setShowLeaveModal(false);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleApplyExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...expenseForm, employeeId: employee.id })
      });
      if (res.ok) {
        alert("Travel expense claim submitted!");
        setShowExpenseModal(false);
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Employee Greeting & Shift Summary Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={employee.avatar}
                alt={employee.firstName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-rose-500 shadow-lg shadow-rose-500/20"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Welcome back, {employee.firstName}!
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {employee.role} · <span className="text-rose-400 font-bold">{employee.department}</span>
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-rose-500" />
                  {shift?.name || 'General Shift'} ({shift?.startTime} - {shift?.endTime})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {office?.name}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenPayslip}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition-colors"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>My Payslip</span>
            </button>
            <button
              onClick={() => setShowIdCard(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold rounded-xl text-slate-200 border border-slate-700 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span>Digital ID Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Punch Hero Card + Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Punch Hero Card */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Punch Status</span>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>
            {todayRecord ? (
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                todayRecord.status === 'Present'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {todayRecord.status}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                Pending Punch In
              </span>
            )}
          </div>

          {/* Large Live Timer */}
          <div className="my-6 text-center">
            <div className="inline-block p-6 rounded-3xl bg-slate-950/70 border border-slate-800/80 shadow-inner">
              <span className="text-xs font-medium text-slate-400 block mb-1">Time Elapsed Today</span>
              <span className="text-4xl sm:text-5xl font-black mono-font tracking-tight text-white">
                {timerText}
              </span>
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>STRONGMATE Geofenced Active Session</span>
              </div>
            </div>
          </div>

          {/* Break Status / Action Button if Punched In */}
          {todayRecord && !todayRecord.checkOut && (
            <div className="mb-4">
              {breakData.activeBreak ? (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Coffee className="w-5 h-5 text-amber-400 animate-bounce" />
                    <div>
                      <span className="text-xs font-bold text-amber-400 block">
                        On Break: {breakData.activeBreak.breakTypeName}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Started at {breakData.activeBreak.startTime}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleEndBreak}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-transform active:scale-95"
                  >
                    End Break
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowBreakPicker(!showBreakPicker)}
                    className="w-full py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>Take a Break (Lunch / Tea / Personal)</span>
                  </button>

                  {showBreakPicker && (
                    <div className="absolute top-12 left-0 right-0 z-20 p-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl grid grid-cols-3 gap-2">
                      {breakData.breakTypes.map((bt) => (
                        <button
                          key={bt.id}
                          onClick={() => handleStartBreak(bt.id)}
                          className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 text-center transition-all"
                        >
                          <Utensils className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                          <span className="text-xs font-bold text-white block">{bt.name}</span>
                          <span className="text-[10px] text-slate-500">{bt.allowedMinutes} mins</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Today's Punch Times Bar */}
          <div className="grid grid-cols-2 gap-4 my-2 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60">
            <div>
              <span className="text-xs text-slate-400 block">Check In Time</span>
              <span className="text-sm font-bold text-slate-200">
                {todayRecord?.checkIn || '--:-- --'}
              </span>
              {todayRecord?.lateMinutes > 0 && (
                <span className="text-[11px] text-amber-400 block mt-0.5 font-medium">
                  Late by {todayRecord.lateMinutes} mins
                </span>
              )}
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Check Out Time</span>
              <span className="text-sm font-bold text-slate-200">
                {todayRecord?.checkOut || '--:-- --'}
              </span>
              {todayRecord?.checkOut && (
                <span className="text-[11px] text-emerald-400 block mt-0.5 font-medium">
                  Completed for today
                </span>
              )}
            </div>
          </div>

          {/* Action Button: Punch In or Punch Out */}
          <div className="mt-2">
            {!todayRecord ? (
              <button
                onClick={() => {
                  setPunchType('in');
                  setShowPunchModal(true);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                <span>Punch In (Selfie & Geofence)</span>
              </button>
            ) : !todayRecord.checkOut ? (
              <button
                onClick={() => {
                  setPunchType('out');
                  setShowPunchModal(true);
                }}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-black text-base shadow-lg shadow-rose-600/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <Clock className="w-5 h-5" />
                <span>Punch Out (Complete Day)</span>
              </button>
            ) : (
              <div className="p-3 text-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                ✓ Attendance Completed for Today
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leave Balances & Fast Action Cards */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Leave Balances Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-3">Leave Balance (2026)</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">CL</span>
                <span className="text-xl font-black text-rose-500">{employee.leaveBalances?.CL || 0}</span>
                <span className="text-[10px] text-slate-500 block">Casual</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">SL</span>
                <span className="text-xl font-black text-amber-500">{employee.leaveBalances?.SL || 0}</span>
                <span className="text-[10px] text-slate-500 block">Sick</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">PL</span>
                <span className="text-xl font-black text-emerald-400">{employee.leaveBalances?.PL || 0}</span>
                <span className="text-[10px] text-slate-500 block">Paid</span>
              </div>
            </div>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Quick Action Tiles */}
          <div className="space-y-2">
            <button
              onClick={() => setShowRegModal(true)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                    Attendance Regularization
                  </h4>
                  <p className="text-[11px] text-slate-400">Request missed punch approval</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </button>

            <button
              onClick={() => setShowExpenseModal(true)}
              className="w-full p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-between text-left group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                    Travel & Field Expense
                  </h4>
                  <p className="text-[11px] text-slate-400">Claim KM travel reimbursement</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Row: My Assigned Tasks + Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-white">My Daily Tasks & Field Duties</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {tasks.length} Assigned
            </span>
          </div>

          <div className="space-y-2.5">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No pending tasks assigned today.</p>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    task.status === 'completed'
                      ? 'bg-slate-950/40 border-slate-800 opacity-60'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    readOnly
                    className="mt-1 accent-rose-500 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-white'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{task.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        task.priority === 'urgent' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-slate-500">Due: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Holidays Card */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Official Holidays 2026</h3>
            </div>
            <span className="text-xs text-slate-400">STRONGMATE Calendar</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {holidays.map((h, i) => (
              <div key={i} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{h.name}</span>
                  <span className="text-[10px] text-slate-400">{h.day}</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 font-bold mono-font text-[11px]">
                  {h.date}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Attendance Log Table */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Recent Attendance Records</h3>
            <p className="text-xs text-slate-400">Monthly log and geofence verification details</p>
          </div>
          <span className="text-xs font-medium text-rose-400 font-bold">
            {history.length} Logs recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3">Date</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Duration</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Geofence</th>
                <th className="pb-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No punch records found yet. Use the Punch In button to create your first record!
                  </td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-semibold text-white">{rec.date}</td>
                    <td className="py-3 mono-font text-slate-300">{rec.checkIn || '-'}</td>
                    <td className="py-3 mono-font text-slate-300">{rec.checkOut || '-'}</td>
                    <td className="py-3 text-slate-300">
                      {rec.durationMins ? `${Math.floor(rec.durationMins / 60)}h ${rec.durationMins % 60}m` : '-'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        rec.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-500" />
                        {rec.withinGeofence ? 'Inside' : 'Field / Outside'}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 max-w-xs truncate">{rec.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PUNCH MODAL */}
      {showPunchModal && (
        <EmployeePunchModal
          type={punchType}
          employee={employee}
          office={office}
          onClose={() => setShowPunchModal(false)}
          onSuccess={() => {
            fetchEmployeeData();
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* PAYSLIP MODAL */}
      {showPayslipModal && payslipData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header with logo */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="STRONGMATE" className="w-12 h-12 object-contain rounded-full border border-rose-500/40" />
                <div>
                  <h3 className="text-lg font-black text-white">STRONGMATE CORPORATION</h3>
                  <p className="text-[11px] text-slate-400">Cyber City, Tower B, Sector 24, Gurugram, Haryana</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-400 block">SALARY PAYSLIP</span>
                <span className="text-[11px] text-slate-400">{payslipData.monthYear}</span>
              </div>
            </div>

            {/* Employee Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs mb-4">
              <div>
                <span className="text-slate-500 block">Employee Name:</span>
                <span className="font-bold text-white">{payslipData.employee.firstName} {payslipData.employee.lastName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Employee Code:</span>
                <span className="font-bold text-white mono-font">{payslipData.employee.employeeCode}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department:</span>
                <span className="font-medium text-slate-300">{payslipData.employee.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bank Account:</span>
                <span className="font-medium text-slate-300 mono-font">{payslipData.employee.bankAccount}</span>
              </div>
            </div>

            {/* Attendance Days */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Total Days</span>
                <span className="font-bold text-white">{payslipData.attendanceSummary.totalDays}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Present</span>
                <span className="font-bold text-emerald-400">{payslipData.attendanceSummary.daysPresent}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Paid Leaves</span>
                <span className="font-bold text-teal-400">{payslipData.attendanceSummary.paidLeaves}</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Loss of Pay</span>
                <span className="font-bold text-rose-400">{payslipData.attendanceSummary.lop}</span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5">
              {/* Earnings */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-emerald-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[11px]">
                  Earnings (₹)
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Basic Salary:</span>
                  <span className="font-medium text-white">₹{payslipData.earnings.basic.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">House Rent Allowance (HRA):</span>
                  <span className="font-medium text-white">₹{payslipData.earnings.hra.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Special Allowance:</span>
                  <span className="font-medium text-white">₹{payslipData.earnings.specialAllowance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-emerald-400">
                  <span>Gross Earnings:</span>
                  <span>₹{payslipData.earnings.totalEarnings.toLocaleString()}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-bold text-rose-400 border-b border-slate-800 pb-1.5 uppercase tracking-wider text-[11px]">
                  Deductions (₹)
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Provident Fund (PF 12%):</span>
                  <span className="font-medium text-white">₹{payslipData.deductions.pf.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Professional Tax (PT):</span>
                  <span className="font-medium text-white">₹{payslipData.deductions.pt.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TDS / Income Tax:</span>
                  <span className="font-medium text-white">₹{payslipData.deductions.tds.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-rose-400">
                  <span>Total Deductions:</span>
                  <span>₹{payslipData.deductions.totalDeductions.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-emerald-950/40 border border-rose-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">Net Take-Home Pay (Direct Bank Transfer)</span>
                <span className="text-2xl font-black text-white">₹{payslipData.netSalary.toLocaleString()}</span>
              </div>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>

            <button
              onClick={() => setShowPayslipModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* REGULARIZATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Attendance Regularization</h3>
            <p className="text-xs text-slate-400 mb-4">Request approval for missed or incorrect punch</p>
            <form onSubmit={handleApplyRegularization} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={regForm.date}
                  onChange={(e) => setRegForm({ ...regForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Request Type</label>
                <select
                  value={regForm.requestType}
                  onChange={(e) => setRegForm({ ...regForm, requestType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="missed_checkin">Missed Check-In</option>
                  <option value="missed_checkout">Missed Check-Out</option>
                  <option value="missed_both">Missed Both (Full Day)</option>
                  <option value="incorrect_time">Incorrect Timing Adjustment</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Proposed Check-In</label>
                  <input
                    type="time"
                    value={regForm.proposedCheckIn}
                    onChange={(e) => setRegForm({ ...regForm, proposedCheckIn: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Proposed Check-Out</label>
                  <input
                    type="time"
                    value={regForm.proposedCheckOut}
                    onChange={(e) => setRegForm({ ...regForm, proposedCheckOut: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={regForm.reason}
                  onChange={(e) => setRegForm({ ...regForm, reason: e.target.value })}
                  placeholder="Explain why the punch was missed (e.g. client meeting, network issue)..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAVE MODAL */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Apply for Leave</h3>
            <p className="text-xs text-slate-400 mb-4">Submit time off request for approval</p>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Leave Type</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="CL">Casual Leave (CL) - Bal: {employee.leaveBalances?.CL || 0}</option>
                  <option value="SL">Sick Leave (SL) - Bal: {employee.leaveBalances?.SL || 0}</option>
                  <option value="PL">Paid Leave (PL) - Bal: {employee.leaveBalances?.PL || 0}</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">From Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">To Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.toDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Duration</label>
                <select
                  value={leaveForm.dayPart}
                  onChange={(e) => setLeaveForm({ ...leaveForm, dayPart: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="full">Full Day</option>
                  <option value="first_half">First Half</option>
                  <option value="second_half">Second Half</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason</label>
                <textarea
                  required
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for taking leave..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg"
                >
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRAVEL EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Claim Travel / Field Expense</h3>
            <p className="text-xs text-slate-400 mb-4">Reimbursement rate: ₹8 per kilometer</p>
            <form onSubmit={handleApplyExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Kilometers Traveled</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="e.g. 24"
                  value={expenseForm.kmTraveled}
                  onChange={(e) => setExpenseForm({ ...expenseForm, kmTraveled: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              {expenseForm.kmTraveled && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 font-bold flex justify-between">
                  <span>Calculated Claim:</span>
                  <span>₹{parseFloat(expenseForm.kmTraveled) * 8}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Visit Details / Description</label>
                <textarea
                  required
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Destination, client name, purpose of visit..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIGITAL ID CARD MODAL */}
      {showIdCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-rose-500/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full border border-rose-500/50" />
                <div>
                  <span className="font-extrabold text-white text-xs tracking-tight">STRONG<span className="text-rose-500">MATE™</span></span>
                  <span className="block text-[9px] text-slate-400 font-semibold uppercase">Official Pass</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">VERIFIED</span>
            </div>

            <div className="text-center my-4">
              <img
                src={employee.avatar}
                alt={employee.firstName}
                className="w-24 h-24 mx-auto rounded-2xl object-cover border-2 border-rose-500 shadow-xl mb-3"
              />
              <h4 className="text-lg font-extrabold text-white">{employee.firstName} {employee.lastName}</h4>
              <p className="text-xs text-rose-400 font-bold">{employee.role}</p>
              <p className="text-[11px] text-slate-400">{employee.department}</p>
            </div>

            <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Employee Code:</span>
                <span className="font-bold text-white mono-font">{employee.employeeCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Office Base:</span>
                <span className="font-medium text-slate-200">{office?.name || 'Strongmate HQ'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Official Email:</span>
                <span className="font-medium text-slate-200 truncate max-w-[180px]">{employee.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Phone:</span>
                <span className="font-medium text-slate-200">{employee.phone}</span>
              </div>
            </div>

            <button
              onClick={() => setShowIdCard(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Close ID Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
