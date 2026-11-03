import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data', 'database.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Initial seed data for STRONGMATE
const defaultData = {
  company: {
    id: "comp_strongmate_1",
    name: "STRONGMATE Corporation",
    code: "SM-CORP",
    tagline: "Fitness & Wellness Workforce Solutions",
    logoUrl: "/circular_strongmat.jpg",
    primaryColor: "#e11d48", // Strongmate red
    secondaryColor: "#0a0a0c",
    email: "hr@strongmate.in",
    phone: "+91 98765 43210",
    address: "Cyber City, Tower B, 5th Floor, Sector 24, Gurugram, Haryana - 122002",
    timezone: "Asia/Kolkata",
    currency: "INR",
    travelRatePerKm: 8,
    lateGracePeriodMins: 15,
    halfDayThresholdHours: 4,
    sandwichLeaveEnabled: true
  },
  offices: [
    {
      id: "off_hq",
      name: "STRONGMATE HQ - Gurugram",
      address: "Cyber City, Tower B, Sector 24, Gurugram, Haryana",
      latitude: 28.4950,
      longitude: 77.0890,
      geofenceRadius: 150, // in meters
      isActive: true
    },
    {
      id: "off_blr",
      name: "STRONGMATE Regional Hub - Bengaluru",
      address: "Indiranagar 100ft Road, Bengaluru, Karnataka",
      latitude: 12.9716,
      longitude: 77.5946,
      geofenceRadius: 100,
      isActive: true
    }
  ],
  shifts: [
    {
      id: "shift_gen",
      name: "General Shift",
      startTime: "09:30",
      endTime: "18:30",
      lateGracePeriodMins: 15, // till 09:45 is on time
      lateHalfDayThresholdMins: 90, // after 11:00 is half day
      workingHoursRequired: 9,
      weeklyOffs: ["Saturday", "Sunday"]
    },
    {
      id: "shift_early",
      name: "Morning Shift",
      startTime: "07:00",
      endTime: "16:00",
      lateGracePeriodMins: 15,
      lateHalfDayThresholdMins: 90,
      workingHoursRequired: 9,
      weeklyOffs: ["Sunday"]
    },
    {
      id: "shift_evening",
      name: "Evening Shift",
      startTime: "13:00",
      endTime: "22:00",
      lateGracePeriodMins: 15,
      lateHalfDayThresholdMins: 90,
      workingHoursRequired: 9,
      weeklyOffs: ["Monday"]
    }
  ],
  breakTypes: [
    { id: "brk_lunch", name: "Lunch Break", allowedMinutes: 45, icon: "utensils" },
    { id: "brk_tea", name: "Tea & Coffee Break", allowedMinutes: 15, icon: "coffee" },
    { id: "brk_personal", name: "Short Personal Break", allowedMinutes: 15, icon: "user" }
  ],
  departments: [
    { id: "dept_ops", name: "Operations & Facilities" },
    { id: "dept_sales", name: "Sales & Business Development" },
    { id: "dept_tech", name: "Engineering & IT" },
    { id: "dept_hr", name: "People & HR" },
    { id: "dept_fit", name: "Fitness Trainers & Operations" }
  ],
  employees: [
    {
      id: "emp_101",
      employeeCode: "SM-101",
      firstName: "Rahul",
      lastName: "Sharma",
      email: "rahul.sharma@strongmate.in",
      phone: "+91 98112 34567",
      role: "Field Executive",
      department: "Sales & Business Development",
      officeId: "off_hq",
      shiftId: "shift_gen",
      attendanceType: "Hybrid / Field",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      dateOfJoining: "2024-01-15",
      salary: 45000,
      bankAccount: "HDFC **** 4591",
      panNumber: "ABCPS1234F",
      leaveBalances: { CL: 7, SL: 5, PL: 12 }
    },
    {
      id: "emp_102",
      employeeCode: "SM-102",
      firstName: "Priya",
      lastName: "Patel",
      email: "priya.patel@strongmate.in",
      phone: "+91 98223 45678",
      role: "HR & Operations Specialist",
      department: "People & HR",
      officeId: "off_hq",
      shiftId: "shift_gen",
      attendanceType: "Work from Office",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      dateOfJoining: "2023-06-10",
      salary: 58000,
      bankAccount: "ICICI **** 8920",
      panNumber: "BCQPP5678K",
      leaveBalances: { CL: 6, SL: 6, PL: 14 }
    },
    {
      id: "emp_103",
      employeeCode: "SM-103",
      firstName: "Amit",
      lastName: "Verma",
      email: "amit.verma@strongmate.in",
      phone: "+91 98334 56789",
      role: "Lead Systems Engineer",
      department: "Engineering & IT",
      officeId: "off_hq",
      shiftId: "shift_gen",
      attendanceType: "Work from Office",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      dateOfJoining: "2022-11-01",
      salary: 75000,
      bankAccount: "SBI **** 1142",
      panNumber: "CDEPV9012M",
      leaveBalances: { CL: 8, SL: 6, PL: 15 }
    },
    {
      id: "emp_104",
      employeeCode: "SM-104",
      firstName: "Neha",
      lastName: "Singh",
      email: "neha.singh@strongmate.in",
      phone: "+91 98445 67890",
      role: "Senior Fitness Specialist",
      department: "Fitness Trainers & Operations",
      officeId: "off_hq",
      shiftId: "shift_early",
      attendanceType: "Work from Office",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
      dateOfJoining: "2024-03-20",
      salary: 48000,
      bankAccount: "AXIS **** 6733",
      panNumber: "DEFPS3456P",
      leaveBalances: { CL: 8, SL: 5, PL: 10 }
    }
  ],
  attendance: [
    {
      id: "att_prev_1",
      employeeId: "emp_101",
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      checkIn: "09:28:15",
      checkOut: "18:35:40",
      status: "Present",
      durationMins: 547,
      withinGeofence: true,
      distanceMeters: 25,
      checkInPhoto: null,
      notes: "Routine punch"
    },
    {
      id: "att_prev_2",
      employeeId: "emp_102",
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      checkIn: "09:48:20",
      checkOut: "18:40:10",
      status: "Late",
      durationMins: 531,
      lateMinutes: 18,
      withinGeofence: true,
      distanceMeters: 40,
      checkInPhoto: null,
      notes: "Traffic on highway"
    }
  ],
  breaks: [],
  regularizations: [
    {
      id: "reg_1",
      employeeId: "emp_101",
      date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
      requestType: "missed_checkout",
      proposedCheckIn: "09:30",
      proposedCheckOut: "18:30",
      reason: "Forgot to punch out due to client meeting at site",
      status: "pending",
      appliedOn: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  leaves: [
    {
      id: "leave_1",
      employeeId: "emp_103",
      leaveType: "CL",
      fromDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      toDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      days: 1,
      dayPart: "full",
      reason: "Personal family commitment",
      status: "pending",
      appliedOn: new Date().toISOString()
    }
  ],
  expenses: [
    {
      id: "exp_1",
      employeeId: "emp_101",
      date: new Date().toISOString().split('T')[0],
      category: "Client Travel",
      kmTraveled: 35,
      ratePerKm: 8,
      totalAmount: 280,
      description: "Visit to Corporate Wellness Partner site",
      status: "pending"
    }
  ],
  tasks: [
    {
      id: "tsk_1",
      employeeId: "emp_101",
      title: "Corporate Client Attendance Review",
      description: "Meet with Gold's Gym Cyberhub branch manager for monthly corporate workout check-ins.",
      priority: "high",
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: "in_progress"
    },
    {
      id: "tsk_2",
      employeeId: "emp_102",
      title: "Complete Payroll Audit for Q4",
      description: "Verify attendance regularization requests and overtime hours before salary dispatch.",
      priority: "urgent",
      dueDate: new Date().toISOString().split('T')[0],
      status: "pending"
    },
    {
      id: "tsk_3",
      employeeId: "emp_103",
      title: "Biometric Geofence Accuracy Calibration",
      description: "Ensure GPS radius and WiFi SSID crosswalk is active for Gurugram Tower B.",
      priority: "normal",
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      status: "completed"
    }
  ],
  holidays: [
    { date: "2026-01-26", name: "Republic Day", day: "Monday" },
    { date: "2026-03-04", name: "Holi (Festival of Colors)", day: "Wednesday" },
    { date: "2026-03-21", name: "Eid-ul-Fitr", day: "Saturday" },
    { date: "2026-04-14", name: "Dr. B.R. Ambedkar Jayanti", day: "Tuesday" },
    { date: "2026-05-01", name: "Labour Day / Maharashtra Day", day: "Friday" },
    { date: "2026-08-15", name: "Independence Day", day: "Saturday" },
    { date: "2026-10-02", name: "Mahatma Gandhi Jayanti", day: "Friday" },
    { date: "2026-10-20", name: "Dussehra / Vijayadashami", day: "Tuesday" },
    { date: "2026-11-08", name: "Diwali (Deepavali)", day: "Sunday" },
    { date: "2026-12-25", name: "Christmas Day", day: "Friday" }
  ],
  notices: [
    {
      id: "not_1",
      title: "Welcome to STRONGMATE Daily Attendance Platform",
      content: "All team members are requested to ensure front-camera selfie punches are completed within office geofence by 09:45 AM. Welcome aboard!",
      date: new Date().toISOString().split('T')[0],
      author: "STRONGMATE HR"
    },
    {
      id: "not_2",
      title: "Quarterly Fitness Challenge & Best Attendance Awards",
      content: "Employees with 100% on-time attendance this quarter will receive the STRONGMATE Performance Bonus and fitness vouchers.",
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      author: "Management"
    }
  ]
};

// Database in-memory cache with auto-flush
let db = null;

export function getDB() {
  if (!db) {
    if (fs.existsSync(DB_FILE)) {
      try {
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        // Ensure new collections exist in existing DB
        if (!db.tasks) db.tasks = defaultData.tasks;
        if (!db.holidays) db.holidays = defaultData.holidays;
        if (!db.breakTypes) db.breakTypes = defaultData.breakTypes;
        if (!db.breaks) db.breaks = defaultData.breaks;
        if (!db.company.logoUrl) db.company.logoUrl = "/logo.png";
      } catch (e) {
        db = defaultData;
        saveDB();
      }
    } else {
      db = defaultData;
      saveDB();
    }
  }
  return db;
}

export function saveDB() {
  if (db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  }
}
