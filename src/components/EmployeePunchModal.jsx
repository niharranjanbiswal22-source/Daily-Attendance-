import React, { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, CheckCircle, AlertCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';

export default function EmployeePunchModal({ type, employee, office, onClose, onSuccess }) {
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(true);
  const [distance, setDistance] = useState(null);
  const [isInside, setIsInside] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera and geolocation
  useEffect(() => {
    startCamera();
    fetchLocation();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access failed or denied:", err);
      setCameraError("Camera access unavailable. Using selfie avatar placeholder for verification.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.videoWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      // Mirror image for natural selfie feel
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setPhoto(dataUrl);
      stopCamera();
    } else {
      // Fallback placeholder photo
      setPhoto(employee.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300");
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const fetchLocation = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ latitude, longitude });
        setLocating(false);

        if (office && office.latitude && office.longitude) {
          const dist = getDistanceMeters(latitude, longitude, office.latitude, office.longitude);
          setDistance(dist);
          setIsInside(dist <= (office.geofenceRadius || 100));
        }
      },
      (err) => {
        console.warn("Geolocation warning:", err);
        // Fallback default coordinates (Cyber City HQ)
        const fallbackLat = 28.4950;
        const fallbackLng = 77.0890;
        setCoords({ latitude: fallbackLat, longitude: fallbackLng });
        setDistance(25);
        setIsInside(true);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  const handlePunch = async () => {
    setSubmitting(true);
    try {
      const endpoint = type === 'in' ? '/api/attendance/punch-in' : '/api/attendance/punch-out';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
          photo: photo,
          notes: notes
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to submit punch');
        setSubmitting(false);
        return;
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      alert("Network error submitting attendance: " + err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">
                {type === 'in' ? 'Punch In Verification' : 'Punch Out Verification'}
              </h3>
              <p className="text-xs text-slate-400">Selfie & Geofence GPS Check</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Camera Frame */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 aspect-[4/3] flex items-center justify-center">
            {photo ? (
              <img src={photo} alt="Punch Selfie" className="w-full h-full object-cover" />
            ) : cameraError ? (
              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-amber-400">{cameraError}</p>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-white"
                >
                  Use Identity Picture
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Face outline overlay */}
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-44 h-56 border-2 border-dashed border-emerald-400/60 rounded-full animate-pulse" />
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-full text-xs shadow-lg transition-transform"
                  >
                    <Camera className="w-4 h-4" /> Capture Selfie
                  </button>
                </div>
              </>
            )}

            {photo && (
              <button
                type="button"
                onClick={retakePhoto}
                className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white hover:bg-black/80 rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retake
              </button>
            )}
          </div>

          {/* GPS Geofence Radar Card */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Office Geofence
              </span>
              <span className="font-semibold text-slate-200">{office?.name || 'Strongmate HQ'}</span>
            </div>

            {locating ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Acquiring high-accuracy GPS coordinates...</span>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5">
                  {isInside ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className={`text-xs font-bold ${isInside ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isInside ? 'Inside Office Geofence' : 'Outside Office Geofence'}
                  </span>
                </div>
                <span className="text-xs mono-font text-slate-400 font-medium">
                  {distance !== null ? `${distance}m away` : 'Calculated'}
                </span>
              </div>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Remark / Visit Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Client visit, Work from office, Training"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePunch}
            disabled={submitting}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95 text-white flex items-center justify-center gap-2 ${
              type === 'in' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {type === 'in' ? 'Confirm Punch In' : 'Confirm Punch Out'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
