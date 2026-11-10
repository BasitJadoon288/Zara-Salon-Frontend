export interface SalonService { _id?: string; title: string; description: string; icon: string; duration?: number; visible?: boolean; imageUrl?: string | null; }
// Service save karte waqt: image = nayi picture, removeImage = picture hatao, kuch nahi = picture waisi hi
export interface ServicePayload { _id?: string; title: string; description: string; icon: string; duration?: number; visible?: boolean; image?: string; removeImage?: boolean; }
export type AppointmentStatus = "pending" | "confirmed" | "cancelled";
export interface AppointmentPayload {
  name: string; phone: string; email: string; branch: string; service: string; date: string; time: string;
  stylistId?: string; otp?: string; status?: 'pending' | 'confirmed';
}
export interface Appointment extends Omit<AppointmentPayload, 'status'> {
  _id: string; duration?: number; status: AppointmentStatus; createdAt: string; statusChangedBy?: string; statusChangedAt?: string;
  code?: string; reminderSentAt?: string; stylistName?: string; stylistPicked?: boolean; createdBy?: string; holdExpired?: boolean;
}
// Booking ke baad server ye wapas karta hai
export interface BookingResult { ok: boolean; code: string; status: AppointmentStatus; stylistName: string; duration: number; holdHours: number; }

// Ek din ke time slots (server batata hai kaun sa khali hai, kaun sa booked / break / guzra hua)
export interface TimeSlot { time: string; available: boolean; reason?: 'booked' | 'past' | 'break' | 'unavailable'; label?: string; }
export interface Availability {
  date: string; branch: string; service: string; duration: number; closed: boolean; closedReason: string;
  open: string; close: string; stylistMode: boolean; notice: string; slots: TimeSlot[];
}
// Booking form ko kya dikhana hai
export interface BookingRules { requireEmailOtp: boolean; holdHours: number; customerChanges: boolean; changeCutoffHours: number; }
export interface StylistLite { _id: string; name: string; }
// Team (staff ka schedule) - admin
export interface Stylist { _id?: string; name: string; branch: string; services: string[]; workDays: number[]; startTime: string; endTime: string; active: boolean; }

// Salon ke timing aur booking rules (sirf admin badal sakta hai)
export interface BranchTiming { openTime: string; closeTime: string; chairs: number; closedDays: number[]; }
export interface BreakRule { label: string; start: string; end: string; days: number[]; branch: string; }
export interface Closure { from: string; to: string; branch: string; reason: string; }
export interface TimingSettings {
  openTime: string; closeTime: string; slotStep: number; chairs: number; closedDays: number[];
  branches: Record<string, BranchTiming>; breaks: BreakRule[]; closures: Closure[];
  holdHours: number; maxActivePerPhone: number; requireEmailOtp: boolean; reminderEmail: boolean; customerChanges: boolean; changeCutoffHours: number;
  slotSteps?: number[]; maxChairs?: number; maxBreaks?: number; maxClosures?: number; branchNames?: string[]; emailReady?: boolean;
  affected?: { count: number; items: { name: string; date: string; time: string; branch: string; issue: string }[] };
}
// Customer ka booking code se dekha hua appointment
export interface ManageAppointment {
  code: string; name: string; branch: string; service: string; date: string; time: string; duration: number; stylistName: string;
  pickedStylistId: string; status: AppointmentStatus; canChange: boolean; whyNot: string; waiting: '' | 'pending' | 'expired';
}
export interface ContactPayload { name: string; email: string; phone: string; message: string; }
export interface ContactMessage extends ContactPayload { _id: string; createdAt: string; }
export interface NewsletterPayload { email: string; gender: "Female" | "Male"; }
export interface Promo { image: string; active: boolean; }

export type Role = "admin" | "staff";
export interface LoginResponse { token: string; role?: Role; name?: string; }
export interface Review { _id?: string; name: string; text: string; rating: number; visible: boolean; }
export interface AboutInfo { title: string; text: string; imageUrl?: string | null; }
export interface AboutPayload { title: string; text: string; image?: string; removeImage?: boolean; }
export interface StaffUser { _id: string; name: string; email: string; role: Role; }

export interface Slide { _id?: string; title: string; text: string; visible?: boolean; order?: number; imageUrl?: string | null; }
// Slide save karte waqt: image = nayi picture (naye slide ke liye zaroori), na bhejein = picture waisi hi
export interface SlidePayload { _id?: string; title: string; text: string; visible?: boolean; image?: string; }

// ---------- Gallery ----------
export interface GalleryItem { _id: string; caption: string; visible: boolean; imageUrl: string; thumbUrl: string; }
export interface GalleryPage { items: GalleryItem[]; page: number; pages: number; total: number; perPage: number; max: number; }

// ---------- Careers ----------
export type JobType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract';
export interface Job {
  _id?: string; title: string; department: string; branch: string; type: JobType; description: string; requirements: string;
  salaryText: string; openings: number; closingDate: string; active: boolean; applications?: number;
}
export interface ApplyPayload {
  jobId?: string; name: string; phone: string; email: string; city: string; experience: string; expectedSalary: string; message: string;
  cv?: { name: string; data: string }; website?: string;
}
export type ApplicationStatus = 'new' | 'shortlisted' | 'interview' | 'rejected' | 'hired';
export interface Application {
  _id: string; job: string; jobTitle: string; name: string; phone: string; email: string; city: string; experience: string; expectedSalary: string;
  message: string; hasCv: boolean; cvName: string; cvSize: number; status: ApplicationStatus; notes: string; statusChangedBy: string; createdAt: string;
}
export interface ApplicationsPage { items: Application[]; page: number; pages: number; total: number; perPage: number; newCount: number; }

// Reminder emails abhi bhejne ka nateeja
export interface ReminderResult { enabled: boolean; mailReady: boolean; date: string; found: number; sent: number; failed: number; remaining: number; }
