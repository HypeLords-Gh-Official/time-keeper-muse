import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, ClockStatus, ActivityType, AttendanceRecord } from '@/types/attendance';

// Mock users for demo
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Kwame Asante',
    email: 'kwame@nkyinkyim.org',
    role: 'staff',
    department: 'Tours',
    pin: '1234',
  },
  {
    id: '2',
    name: 'Akua Mensah',
    email: 'akua@nkyinkyim.org',
    role: 'supervisor',
    department: 'Exhibitions',
    pin: '5678',
  },
  {
    id: '3',
    name: 'Kofi Owusu',
    email: 'kofi@nkyinkyim.org',
    role: 'admin',
    department: 'Administration',
    pin: '0000',
  },
];

interface ClockState {
  status: ClockStatus;
  currentActivity: ActivityType | null;
  clockInTime: Date | null;
  todayRecords: AttendanceRecord[];
}

interface AuthContextType {
  user: User | null;
  clockState: ClockState;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  clockIn: (activity: ActivityType) => void;
  clockOut: () => void;
  switchActivity: (activity: ActivityType) => void;
  getTodayHours: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [clockState, setClockState] = useState<ClockState>({
    status: 'clocked-out',
    currentActivity: null,
    clockInTime: null,
    todayRecords: [],
  });

  const login = useCallback(async (pin: string): Promise<boolean> => {
    const foundUser = MOCK_USERS.find((u) => u.pin === pin);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setClockState({
      status: 'clocked-out',
      currentActivity: null,
      clockInTime: null,
      todayRecords: [],
    });
  }, []);

  const clockIn = useCallback((activity: ActivityType) => {
    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user?.id || '',
      clockInTime: now,
      activity,
    };

    setClockState((prev) => ({
      status: 'clocked-in',
      currentActivity: activity,
      clockInTime: now,
      todayRecords: [...prev.todayRecords, newRecord],
    }));
  }, [user]);

  const clockOut = useCallback(() => {
    setClockState((prev) => {
      const updatedRecords = prev.todayRecords.map((record, index) => {
        if (index === prev.todayRecords.length - 1 && !record.clockOutTime) {
          return { ...record, clockOutTime: new Date() };
        }
        return record;
      });

      return {
        status: 'clocked-out',
        currentActivity: null,
        clockInTime: null,
        todayRecords: updatedRecords,
      };
    });
  }, []);

  const switchActivity = useCallback((activity: ActivityType) => {
    if (activity === 'break') {
      setClockState((prev) => ({
        ...prev,
        status: 'on-break',
        currentActivity: activity,
      }));
    } else {
      setClockState((prev) => ({
        ...prev,
        status: 'clocked-in',
        currentActivity: activity,
      }));
    }
  }, []);

  const getTodayHours = useCallback((): number => {
    let totalMs = 0;
    clockState.todayRecords.forEach((record) => {
      const end = record.clockOutTime || new Date();
      totalMs += end.getTime() - record.clockInTime.getTime();
    });
    return totalMs / (1000 * 60 * 60);
  }, [clockState.todayRecords]);

  return (
    <AuthContext.Provider
      value={{
        user,
        clockState,
        login,
        logout,
        clockIn,
        clockOut,
        switchActivity,
        getTodayHours,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
