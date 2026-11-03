import React, { useState, useEffect, useRef } from 'react';
import { Camera, CheckCircle, ShieldCheck, RefreshCw, UserCheck, Clock, ArrowRight } from 'lucide-react';

export default function KioskPortal({ employees, onRefresh }) {
  const [selectedCode, setSelectedCode] = useState('');
  const [photo, setPhoto] = useState(null);
  const [punchMode, setPunchMode] = useState('in'); // 'in' | 'out'
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Kiosk camera failed:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const captureFrame = () => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.8);
    }
    return null;
  };

  const handleKioskPunch = async (e) => {
    e.preventDefault();
    if (!selectedCode) {
      setErrorMessage("Please enter or select your Employee Code.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const capturedPhoto = captureFrame();

    try {
      const res = await fetch('/api/kiosk/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeCode: selectedCode,
          punchType: punchMode,
          photo: capturedPhoto
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Punch failed');
        setSubmitting(false);
        return;
      }

      setSuccessMessage(data.message);
      setSelectedCode('');
      setSubmitting(false);
      if (onRefresh) onRefresh();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      setErrorMessage("Network error: " + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <img
          src="/logo.png"
          alt="STRONGMATE"
          className="w-20 h-20 mx-auto object-contain rounded-full border-2 border-rose-500 shadow-xl shadow-rose-500/20 bg-white/5"
        />
        <h1 className="text-2xl font-black text-white tracking-tight">
          STRONG<span className="text-rose-500">MATE</span> Kiosk Terminal
        </h1>
        <p className="text-xs text-slate-400">
          Reception & Guard Desk Fast Attendance Station
        </p>
      </div>

      {/* Main Terminal Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Camera Stream */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[16/9] flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute inset-0 border-2 border-rose-500/30 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-40 h-52 border-2 border-dashed border-rose-500/60 rounded-full animate-pulse" />
          </div>
          <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] text-slate-300 flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>Live Kiosk Facial Capture</span>
          </div>
        </div>

        {/* Mode Selector (Punch In vs Punch Out) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPunchMode('in')}
            className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
              punchMode === 'in'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Check In Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setPunchMode('out')}
            className={`py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all ${
              punchMode === 'out'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Check Out Mode</span>
          </button>
        </div>

        {/* Employee Code Input & Fast Picker */}
        <form onSubmit={handleKioskPunch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Enter Employee Code or Select Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. SM-101"
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value.toUpperCase())}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-bold text-white mono-font focus:outline-none focus:border-rose-500 uppercase"
              />
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 rounded-2xl font-black text-xs transition-all active:scale-95 flex items-center gap-2 shadow-xl ${
                  punchMode === 'in' ? 'bg-emerald-500 text-slate-950' : 'bg-rose-600 text-white'
                }`}
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>Punch</span>
              </button>
            </div>
          </div>

          {/* Quick Click Badges */}
          <div>
            <span className="text-[11px] text-slate-500 block mb-2">Quick Staff Select:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {employees.map(emp => (
                <button
                  type="button"
                  key={emp.id}
                  onClick={() => setSelectedCode(emp.employeeCode)}
                  className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2 ${
                    selectedCode === emp.employeeCode
                      ? 'bg-rose-600/20 border-rose-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <img src={emp.avatar} alt={emp.firstName} className="w-6 h-6 rounded-full object-cover" />
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold block truncate">{emp.firstName}</span>
                    <span className="text-[9px] mono-font text-slate-500">{emp.employeeCode}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
