export enum UserRole {
  SUPER_ADMIN = 'Super Admin',
  ADMIN = 'Admin',
  SUPERVISOR = 'Supervisor', // Included in types but login restricted as per prompt
  GUARD = 'Guard' // Included in types but login restricted as per prompt
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface SystemAdmin {
  id: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Super Admin';
}

export interface Guard {
  id: string;
  fullName: string;
  rut: string;
  phone: string;
  email: string;
  os10Expiry: string;
  isActive: boolean;
  assignedInstallationId?: string;
  shift?: string;
  password?: string;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}

export interface Installation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  checkpointType?: 'QR' | 'NFC';
  requiredDailyScans?: number; // New field for AI analysis target
  isActive?: boolean;
  lastReportDate?: string;
  markingsCount?: number;
}

export interface LogEntry {
  id: string;
  type: 'QR' | 'NFC' | 'INCIDENT' | 'SOS';
  title?: string; // For NFC/Incident
  detail?: string; // For NFC/Incident/SOS
  guardId: string;
  guardName: string;
  installationId: string;
  installationName: string;
  pointName?: string; // For QR
  tagId?: string; // For NFC
  photos?: string[]; // For Incidents
  tags?: string[]; // For Incidents
  status?: 'Abierto' | 'En Proceso' | 'Cerrado'; // For Incidents
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface MonthlyReport {
  id: string;
  installationId: string;
  installationName: string;
  month: number;
  year: number;
  pdfUrl?: string; // URL in Supabase Storage
  summaryData?: {
    totalScans: number;
    compliancePercentage: number;
    incidentsCount: number;
    sosCount: number;
  };
  createdAt: string;
}

export interface ShiftAssignment {
  id: string;
  guardId: string;
  guardName: string;
  installationId: string;
  installationName: string;
  date: string; // ISO format
  shiftType: 'Día' | 'Noche' | '24h';
  startTime: string;
  endTime: string;
}

export interface Absence {
  id: string;
  guardId: string;
  guardName: string;
  startDate: string;
  endDate: string;
  reason: 'Médica' | 'Vacaciones' | 'Permiso' | 'Falta Injustificada';
  status: 'Pendiente' | 'Aprobada' | 'Rechazada';
  comment?: string;
}

export type NotificationType = 'SOS' | 'INCIDENT' | 'QR' | 'NFC' | 'SYSTEM';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  guard_id?: string;
  guard_name?: string;
  installation_id?: string;
  installation_name?: string;
}

export interface AppConfig {
  companyName: string;
  primaryColor: string;
  logoUrl: string;
}

// ============================================
// SISTEMA DE TRACKING GPS Y VALIDACIÓN
// ============================================

export interface GPSCoordinate {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number; // Precisión en metros
  isMocked?: boolean; // Si la ubicación es simulada
}

export interface QRCheckpoint {
  id: string;
  installationId: string;
  name: string;
  description?: string;
  checkpointType: 'QR' | 'NFC';
  qrCode: string;       // Código QR (para tipo QR), o cadena vacía si es NFC
  nfcId?: string;       // ID único del tag NFC (para tipo NFC)
  latitude: number;
  longitude: number;
  validationRadiusMeters: number;
  isActive: boolean;
  orderSequence: number;
  routeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  name: string;
  installationId: string;
  isActive: boolean;
  roundsPerShift: number;
  createdAt: string;
  checkpointsCount?: number;
}

export interface RouteTracking {
  id: string;
  guardId: string;
  installationId: string;
  roundNumber: number;
  shiftDate: string;
  breadcrumbs: GPSCoordinate[]; // Array de coordenadas
  totalDistanceMeters?: number;
  durationSeconds?: number;
  averageSpeedKmh?: number;
  startTime: string;
  endTime?: string;
  isValid: boolean;
  fraudFlags: string[]; // Array de alertas detectadas
  complianceScore: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export type RoundStatus = 'pending' | 'in_progress' | 'completed' | 'incomplete' | 'flagged';

export interface GuardRound {
  id: string;
  guardId: string;
  guardName?: string;
  installationId: string;
  installationName?: string;
  roundNumber: number;
  shiftDate: string;
  routeTrackingId?: string;
  totalCheckpoints: number;
  checkpointsScanned: number;
  completionPercentage: number;
  scheduledStart?: string;
  actualStart?: string;
  actualEnd?: string;
  status: RoundStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ValidatedLog extends LogEntry {
  latitude?: number;
  longitude?: number;
  gpsAccuracy?: number;
  distanceToCheckpoint?: number;
  gpsVerified: boolean;
  checkpointId?: string;
}

export interface RoundAnalytics {
  guardId: string;
  guardName: string;
  date: string;
  totalRounds: number;
  completedRounds: number;
  flaggedRounds: number;
  averageComplianceScore: number;
  totalDistanceKm: number;
  totalCheckpointsScanned: number;
  fraudAlertsCount: number;
}

export interface FraudAlert {
  type: 'speed_anomaly' | 'distance_too_short' | 'checkpoint_skipped' | 'gps_invalid' | 'time_inconsistent';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: any;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
}