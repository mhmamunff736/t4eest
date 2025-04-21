export interface License {
  id?: string;
  licenseId: string;
  expiryDate: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  lastUpdated?: string;
  customer?: {
    name?: string;
    email?: string;
    company?: string;
  };
  tags?: string[];
}

export interface ActivityLog {
  id?: string;
  action: 'create' | 'update' | 'delete' | 'import' | 'export';
  licenseId: string;
  timestamp: string;
  details: string;
  user?: string;
}

export interface LicenseAnalytics {
  totalCount: number;
  activeCount: number;
  expiredCount: number;
  expiringIn30Days: number;
  expiringIn90Days: number;
  expiryByMonth: Record<string, number>;
  activePercentage: number;
  expiredPercentage: number;
}

export interface DashboardStats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  expiringLicenses: number;
  recentActivity?: ActivityLog[];
  analyticsData?: LicenseAnalytics;
}

export interface UserProfile {
  id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'user' | 'viewer';
  avatarUrl?: string;
  createdAt?: string;
  lastLogin?: string;
  preferences?: {
    darkMode?: boolean;
    notificationsEnabled?: boolean;
    emailAlerts?: boolean;
  };
}

export interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
} 