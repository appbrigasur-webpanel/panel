import { Guard, Installation, LogEntry, UserRole, Notification, SystemAdmin } from './types';

export const MOCK_INSTALLATIONS: Installation[] = [];
export const MOCK_GUARDS: Guard[] = [];
export const MOCK_SUPERVISORS: Guard[] = [];
export const MOCK_LOGS: LogEntry[] = [];
export const MOCK_NOTIFICATIONS: Notification[] = [];
export const MOCK_SYSTEM_ADMINS: SystemAdmin[] = [];

export const GOOGLE_MAPS_LIBRARIES: ("visualization" | "places")[] = ["visualization", "places"];