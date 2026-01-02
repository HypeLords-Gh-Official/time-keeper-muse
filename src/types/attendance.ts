export type UserRole = 'staff' | 'supervisor' | 'admin';

export type ClockStatus = 'clocked-in' | 'clocked-out' | 'on-break';

export type ActivityType = 
  | 'guided-tour'
  | 'exhibition'
  | 'administrative'
  | 'maintenance'
  | 'field-work'
  | 'off-site'
  | 'break'
  | 'meeting'
  | 'training'
  | 'other';

export interface Activity {
  id: ActivityType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  pin: string;
  avatarUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  activity: ActivityType;
  notes?: string;
  location?: string;
}

export interface DailyAttendance {
  date: Date;
  records: AttendanceRecord[];
  totalHours: number;
  overtime: number;
}

export const ACTIVITIES: Activity[] = [
  {
    id: 'guided-tour',
    label: 'Guided Tour',
    icon: '🎭',
    description: 'Leading visitors through exhibitions',
    color: 'hsl(var(--primary))',
  },
  {
    id: 'exhibition',
    label: 'Exhibition',
    icon: '🖼️',
    description: 'Setting up or managing exhibitions',
    color: 'hsl(var(--accent))',
  },
  {
    id: 'administrative',
    label: 'Administrative',
    icon: '📋',
    description: 'Office and paperwork duties',
    color: 'hsl(var(--gold))',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: '🔧',
    description: 'Building and equipment maintenance',
    color: 'hsl(var(--muted-foreground))',
  },
  {
    id: 'field-work',
    label: 'Field Work',
    icon: '🌍',
    description: 'Off-site research or collection',
    color: 'hsl(var(--forest-light))',
  },
  {
    id: 'off-site',
    label: 'Off-Site Assignment',
    icon: '🚗',
    description: 'Working at external locations',
    color: 'hsl(var(--terracotta-light))',
  },
  {
    id: 'meeting',
    label: 'Meeting',
    icon: '👥',
    description: 'Staff or external meetings',
    color: 'hsl(var(--secondary-foreground))',
  },
  {
    id: 'training',
    label: 'Training',
    icon: '📚',
    description: 'Professional development activities',
    color: 'hsl(var(--success))',
  },
  {
    id: 'break',
    label: 'Break',
    icon: '☕',
    description: 'Scheduled break time',
    color: 'hsl(var(--warning))',
  },
  {
    id: 'other',
    label: 'Other',
    icon: '📝',
    description: 'Other work activities',
    color: 'hsl(var(--muted-foreground))',
  },
];
