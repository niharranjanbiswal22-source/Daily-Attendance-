import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, AlertTriangle, Clock, MapPin, Building2,
  CheckCircle, XCircle, Download, Plus, Navigation, Shield, Award, Calendar, Send
} from 'lucide-react';

export default function AdminPortal({ company, offices, shifts, employees, onRefresh }) {
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor' | 'geofence' | 'employees' | 'approvals' | 'notices'
  const [monitorData, setMonitorData] = useState(null);
  const [regularizations, setRegularizations] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [notices, setNotices] = useState([]);

  // Office edit state
  const [selectedOffice, setSelectedOffice] = useState(offices[0] || null);
  const [officeForm, setOfficeForm] = useState(offices[0] || {});
  const [updatingGps, setUpdatingGps] = useState(false);

  // New Employee modal
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    role: 'Associate', department: 'Operations & Facilities',
    salary: 40000, attendanceType: 'Work from Office'
  });

  // Notice form
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeContent, setNewNoticeContent] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [resMon, resReg, resLeaves, resExp, resNot] = await Promise.all([
        fetch('/api/attendance/live-monitor'),
        fetch('/api/regularizations'),
        fetch('/api/leaves'),
        fetch('/api/expenses'),
        fetch('/api/notices')
      ]);

      setMonitorData(await resMon.json());
      setRegularizations(await resReg.json());
      setLeaves(await resLeaves.json());
      setExpenses(await resExp.json());
      setNotices(await resNot.json());
    } catch (err) {
      console.error("Error loading admin data:", err);
    }
  };

  // Set office coordinates to user's real live GPS coordinates
  const handleSetCurrentLocationAsOffice = () => {
    setUpdatingGps(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setUpdatingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const updated = {
          ...officeForm,
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6))
        };
        setOfficeForm(updated);

        // Save immediately to backend
        try {
          const res = await fetch(`/api/offices/${officeForm.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          });
          if (res.ok) {
            alert(`Office GPS updated to your current position: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}! You are now inside the geofence.`);
            if (onRefresh) onRefresh();
          }
        } catch (err) {
          alert("Failed to save coordinates: " + err.message);
        }
        setUpdatingGps(false);
      },
      (err) => {
        alert("Failed to get location: " + err.message);
        setUpdatingGps(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveOffice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/offices/${officeForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(officeForm)
      });
      if (res.ok) {
        alert("Office geofence settings updated successfully!");
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleActionRegularization = async (id, action) => {
    try {
      const res = await fetch(`/api/regularizations/${id}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: `Reviewed by HR on ${new Date().toLocaleDateString()}` })
      });
      if (res.ok) {
        fetchAdminData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleActionLeave = async (id, action) => {
    try {
      const res = await fetch(`/api/leaves/${id}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, remarks: `Processed by HR` })
      });
      if (res.ok) {
        fetchAdminData();
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empForm)
      });
      if (res.ok) {
        alert("New employee added to STRONGMATE directory!");
        setShowAddEmpModal(false);
        setEmpForm({
          firstName: '', lastName: '', email: '', phone: '',
          role: 'Associate', department: 'Operations & Facilities',
          salary: 40000, attendanceType: 'Work from Office'
        });
        if (onRefresh) onRefresh();
        fetchAdminData();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newNoticeTitle, content: newNoticeContent })
      });
      if (res.ok) {
        alert("Announcement posted to company Noticeboard!");
        setNewNoticeTitle('');
        setNewNoticeContent('');
        fetchAdminData();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // Export CSV attendance register
  const exportToCSV = () => {
    if (!monitorData?.data) return;
    const headers = ['Employee Code', 'Name', 'Department', 'Office', 'Status', 'Check-In', 'Check-Out', 'Late Minutes', 'Geofence Distance'];
    const rows = monitorData.data.map(item => [
      item.employee.employeeCode,
      `"${item.employee.firstName} ${item.employee.lastName}"`,
      `"${item.employee.department}"`,
      `"${item.office?.name || '-'}"`,
      item.status,
      item.attendance?.checkIn || '-',
      item.attendance?.checkOut || '-',
      item.attendance?.lateMinutes || '0',
      item.attendance?.distanceMeters ? `${item.attendance.distanceMeters}m` : '-'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `STRONGMATE_Attendance_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingApprovalsCount = regularizations.filter(r => r.status === 'pending').length +
                                leaves.filter(l => l.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Workforce</span>
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white">{monitorData?.totalEmployees || employees.length}</span>
          <span className="text-[11px] text-slate-500 block mt-1">Active staff enrolled</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Present Today</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400">{monitorData?.presentToday || 0}</span>
          <span className="text-[11px] text-emerald-500/80 block mt-1">
            {monitorData?.activeNow || 0} currently on shift
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Late Mark</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-amber-400">{monitorData?.lateToday || 0}</span>
          <span className="text-[11px] text-amber-500/80 block mt-1">Beyond shift grace period</span>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-indigo-400">{pendingApprovalsCount}</span>
          <span className="text-[11px] text-indigo-500/80 block mt-1">Missed punches & leaves</span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'monitor'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Live Attendance Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab('geofence')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'geofence'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Geofence & Office Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'approvals'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Approvals Center {pendingApprovalsCount > 0 && `(${pendingApprovalsCount})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'employees'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('notices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'notices'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Noticeboard & Policies</span>
        </button>
      </div>

      {/* TAB 1: LIVE ATTENDANCE MONITORING */}
      {activeTab === 'monitor' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Real-Time Daily Attendance Register</h3>
              <p className="text-xs text-slate-400">
                Live attendance status, selfie verification, and GPS geofence radar for all staff
              </p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Excel / CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3">Employee</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Shift</th>
                  <th className="pb-3">Punch In</th>
                  <th className="pb-3">Punch Out</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Geofence Distance</th>
                  <th className="pb-3">Selfie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monitorData?.data?.map((row) => (
                  <tr key={row.employee.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={row.employee.avatar}
                          alt={row.employee.firstName}
                          className="w-8 h-8 rounded-full object-cover border border-emerald-500/40"
                        />
                        <div>
                          <span className="font-bold text-white block">
                            {row.employee.firstName} {row.employee.lastName}
                          </span>
                          <span className="text-[10px] mono-font text-slate-400 font-medium">
                            {row.employee.employeeCode}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-slate-300 font-medium">{row.employee.department}</td>
                    <td className="py-3 text-slate-400">{row.shift?.name || 'General Shift'}</td>
                    <td className="py-3 mono-font font-bold text-slate-200">
                      {row.attendance?.checkIn || '--:--'}
                    </td>
                    <td className="py-3 mono-font text-slate-400">
                      {row.attendance?.checkOut || '--:--'}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        row.status === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : row.status === 'Late'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {row.attendance ? (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {row.attendance.withinGeofence ? 'Inside' : 'Outside'}{' '}
                          ({row.attendance.distanceMeters || 0}m)
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      {row.attendance?.checkInPhoto ? (
                        <img
                          src={row.attendance.checkInPhoto}
                          alt="Selfie"
                          className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-sm cursor-pointer hover:scale-125 transition-transform"
                          onClick={() => window.open(row.attendance.checkInPhoto, '_blank')}
                        />
                      ) : (
                        <span className="text-slate-600">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GEOFENCE & OFFICE SETUP */}
      {activeTab === 'geofence' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Geofence Boundary Configuration</h3>
              <p className="text-xs text-slate-400">
                Staff can punch in only when they are physically within this radius around the office.
              </p>
            </div>

            <form onSubmit={handleSaveOffice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Office Name</label>
                <input
                  type="text"
                  required
                  value={officeForm.name || ''}
                  onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Full Address</label>
                <input
                  type="text"
                  value={officeForm.address || ''}
                  onChange={(e) => setOfficeForm({ ...officeForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={officeForm.latitude || ''}
                    onChange={(e) => setOfficeForm({ ...officeForm, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mono-font"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={officeForm.longitude || ''}
                    onChange={(e) => setOfficeForm({ ...officeForm, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white mono-font"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-400">Geofence Radius (Meters)</label>
                  <span className="text-xs font-bold text-emerald-400 mono-font">{officeForm.geofenceRadius || 100} meters</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="1000"
                  step="10"
                  value={officeForm.geofenceRadius || 100}
                  onChange={(e) => setOfficeForm({ ...officeForm, geofenceRadius: parseInt(e.target.value) })}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* 1-CLICK CURRENT LOCATION SYNC */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400">Are you currently at the office?</h4>
                  <p className="text-[11px] text-slate-400">
                    Click below to set the geofence GPS center exactly to your current location.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSetCurrentLocationAsOffice}
                  disabled={updatingGps}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{updatingGps ? 'Reading GPS...' : 'Use My Current Location'}</span>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition-colors"
                >
                  Save Geofence Settings
                </button>
              </div>
            </form>
          </div>

          {/* Office List sidebar */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Registered Office Branches</h3>
            <div className="space-y-3">
              {offices.map((off) => (
                <div
                  key={off.id}
                  onClick={() => {
                    setSelectedOffice(off);
                    setOfficeForm(off);
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    officeForm.id === off.id
                      ? 'bg-slate-950 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white">{off.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      {off.geofenceRadius}m
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{off.address}</p>
                  <span className="text-[10px] mono-font text-slate-500 block mt-1">
                    {off.latitude}, {off.longitude}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPROVALS CENTER */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Regularizations Section */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Attendance Regularization Requests</h3>
            <p className="text-xs text-slate-400 mb-4">Missed check-in and checkout correction approvals</p>

            <div className="space-y-3">
              {regularizations.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No regularization requests at this time.</p>
              ) : (
                regularizations.map((reg) => (
                  <div key={reg.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {reg.employee?.firstName} {reg.employee?.lastName} ({reg.employee?.employeeCode})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400">
                          {reg.requestType.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400">for {reg.date}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Reason: <span className="italic text-slate-400">"{reg.reason}"</span>
                      </p>
                      <p className="text-[11px] mono-font text-slate-500 mt-0.5">
                        Proposed Timings: {reg.proposedCheckIn} - {reg.proposedCheckOut}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {reg.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleActionRegularization(reg.id, 'approve')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleActionRegularization(reg.id, 'reject')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          reg.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {reg.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Leaves Section */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1">Leave Requests</h3>
            <p className="text-xs text-slate-400 mb-4">Pending holiday & time-off applications</p>

            <div className="space-y-3">
              {leaves.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No leave applications currently pending.</p>
              ) : (
                leaves.map((leave) => (
                  <div key={leave.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {leave.employee?.firstName} {leave.employee?.lastName} ({leave.employee?.employeeCode})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400">
                          {leave.leaveType} LEAVE
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {leave.fromDate} to {leave.toDate} ({leave.days} Day)
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Reason: <span className="italic text-slate-400">"{leave.reason}"</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {leave.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleActionLeave(leave.id, 'approve')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleActionLeave(leave.id, 'reject')}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          leave.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {leave.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EMPLOYEE DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Workforce Directory</h3>
              <p className="text-xs text-slate-400">Manage employee accounts, shifts, and salaries</p>
            </div>
            <button
              onClick={() => setShowAddEmpModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <img
                  src={emp.avatar}
                  alt={emp.firstName}
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{emp.firstName} {emp.lastName}</h4>
                    <span className="text-[10px] mono-font text-emerald-400 font-bold">{emp.employeeCode}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">{emp.role}</p>
                  <p className="text-[10px] text-slate-500">{emp.department}</p>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span>Base: ₹{emp.salary?.toLocaleString()}/mo</span>
                    <span>{emp.attendanceType}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NOTICEBOARD */}
      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white">Noticeboard Announcements</h3>
            {notices.map((n) => (
              <div key={n.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-emerald-400">{n.title}</h4>
                  <span className="text-xs text-slate-500">{n.date}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
                <span className="text-[10px] text-slate-500 font-medium block pt-1">
                  Posted by: {n.author}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl h-fit">
            <h4 className="text-sm font-bold text-white mb-3">Publish New Announcement</h4>
            <form onSubmit={handleCreateNotice} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Holiday Announcement"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Message Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter notice details for all staff..."
                  value={newNoticeContent}
                  onChange={(e) => setNewNoticeContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all shadow-md"
              >
                Broadcast Notice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD EMPLOYEE MODAL */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Add New Employee</h3>
            <p className="text-xs text-slate-400 mb-4">Enroll team member into STRONGMATE Attendance</p>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={empForm.firstName}
                    onChange={(e) => setEmpForm({ ...empForm, firstName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={empForm.lastName}
                    onChange={(e) => setEmpForm({ ...empForm, lastName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={empForm.email}
                  onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={empForm.phone}
                  onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
                  <select
                    value={empForm.department}
                    onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Operations & Facilities">Operations & Facilities</option>
                    <option value="Sales & Business Development">Sales & Business Development</option>
                    <option value="Engineering & IT">Engineering & IT</option>
                    <option value="People & HR">People & HR</option>
                    <option value="Fitness Trainers & Operations">Fitness Trainers & Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    value={empForm.role}
                    onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Base Salary (₹)</label>
                  <input
                    type="number"
                    value={empForm.salary}
                    onChange={(e) => setEmpForm({ ...empForm, salary: parseFloat(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Attendance Mode</label>
                  <select
                    value={empForm.attendanceType}
                    onChange={(e) => setEmpForm({ ...empForm, attendanceType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Work from Office">Work from Office</option>
                    <option value="Hybrid / Field">Hybrid / Field</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
