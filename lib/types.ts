export type IssueType = 'contamination' | 'shortage' | 'infrastructure' | 'flooding' | 'pollution' | 'other'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type ReportStatus = 'pending' | 'under_review' | 'in_progress' | 'resolved' | 'closed'
export type UserRole = 'community' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  region: string | null
  avatar_url: string | null
  created_at: string
}

export interface WaterReport {
  id: string
  user_id: string | null
  title: string
  description: string
  issue_type: IssueType
  severity: Severity
  status: ReportStatus
  region: string
  district: string | null
  community: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  upvotes: number
  is_anonymous: boolean
  is_admin_report: boolean
  admin_notes: string | null
  resolved_at: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
  reporter?: { full_name: string | null } | null
}

// Reporter's response to a resolution: confirmed fixed, or disputed (reopened)
export interface ReportConfirmation {
  id: string
  report_id: string
  user_id: string | null
  confirmed: boolean
  note: string | null
  image_url: string | null
  created_at: string
}

export interface WaterQualityMetric {
  id: string
  region: string
  district: string | null
  metric_type: 'ph_level' | 'turbidity' | 'chlorine' | 'bacteria' | 'access_rate' | 'quality_score'
  value: number
  unit: string | null
  recorded_at: string
  notes: string | null
}

export interface AdminResponse {
  id: string
  report_id: string
  admin_id: string
  message: string
  status_update: ReportStatus | null
  created_at: string
  admin?: {
    full_name: string | null
  }
}

export interface ReportNotification {
  id: string
  user_id: string
  report_id: string
  response_id: string | null
  message: string
  is_read: boolean
  created_at: string
}

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Northern',
  'Upper East',
  'Upper West',
  'Volta',
  'Eastern',
  'Central',
  'Western',
  'Bono',
  'Oti',
  'Savannah',
  'North East',
  'Ahafo',
  'Bono East',
  'Western North',
]

// Approximate geographic centre of each region — used to place reports that
// were submitted without GPS coordinates on the map
export const REGION_CENTERS: Record<string, [number, number]> = {
  'Greater Accra': [5.75, -0.1],
  Ashanti: [6.75, -1.52],
  Northern: [9.5, -0.85],
  'Upper East': [10.75, -0.85],
  'Upper West': [10.3, -2.3],
  Volta: [6.6, 0.45],
  Eastern: [6.35, -0.6],
  Central: [5.45, -1.3],
  Western: [5.2, -2.1],
  Bono: [7.6, -2.5],
  Oti: [7.9, 0.35],
  Savannah: [9.1, -1.8],
  'North East': [10.45, -0.4],
  Ahafo: [7.0, -2.4],
  'Bono East': [7.75, -1.4],
  'Western North': [6.3, -2.75],
}

export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  contamination: 'Contamination',
  shortage: 'Water Shortage',
  infrastructure: 'Infrastructure',
  flooding: 'Flooding',
  pollution: 'Pollution',
  other: 'Other',
}

export const SEVERITY_LABELS: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: 'Pending',
  under_review: 'Under Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  community: 'Community Member',
  admin: 'Admin',
}
