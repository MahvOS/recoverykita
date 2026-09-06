export type LocationCategory = "waste_bank" | "trash_dump" | "community_action";
export type MapLocationCategory = LocationCategory;
export type WasteCategory = LocationCategory;
export type Priority = "rendah" | "sedang" | "tinggi";
export type ReportStatus = "pending" | "in_progress" | "completed" | "rejected";
export type LocationStatus = string;

export interface Location {
  id: string;
  title: string;
  description: string | null;
  category: LocationCategory;
  latitude: number;
  longitude: number;
  address_notes: string | null;
  photo_url: string | null;
  cleaned_photo_url: string | null;
  estimated_volume_kg: number | null;
  status: LocationStatus;
  reporter_name: string | null;
  reporter_phone: string | null;
  created_at: string;
  updated_at: string;
  priority: Priority | null;
  waste_type: string | string[] | null;
  photo_urls: string[] | null;
}

export interface CarbonFactor {
  id: string;
  waste_type: string;
  co2_factor_per_kg: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  email: string | null;
  role: string | null;
  is_banned: boolean | null;
  banned_at: string | null;
}

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  role: string | null;
  is_banned: boolean | null;
  banned_at: string | null;
  created_at: string;
}

export interface UserReport {
  id: string;
  location_id: string | null;
  category: string | null;
  location_name: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  created_at: string | null;
  latitude: number | null;
  longitude: number | null;
  user_id: string | null;
  location: {
    id: string;
    title: string | null;
    category: string | null;
    latitude: number | null;
    longitude: number | null;
    status: string | null;
    photo_url: string | null;
  } | null;
}

export interface ReportLog {
  id: string;
  location_id: string | null;
  previous_status: ReportStatus | null;
  new_status: ReportStatus | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  category: string | null;
  location_name: string | null;
  description: string | null;
  priority: Priority | null;
  photo_url: string | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  status: ReportStatus | null;
  updated_at: string | null;
  latitude: number | null;
  longitude: number | null;
  user_id: string | null;
}

export interface MetricStats {
  inProgressCount: number;
  pendingCount: number;
  reportsSolved: number;
}

export interface RecentReport {
  id: string;
  location: string;
  wasteType: string | string[];
  status: "Menunggu" | "Selesai" | "Proses";
}

export interface MapLocation {
  id: string;
  title: string;
  category: LocationCategory;
  latitude: number;
  longitude: number;
  status: LocationStatus;
  photo_url: string | null;
}

export interface LocationWithCarbon extends Location {
  carbon_factor: number | null;
}

export interface ReportLogWithLocation extends ReportLog {
  location: Location | null;
}

export interface HotspotArea {
  id: string;
  name: string;
  count: number;
  latitude: number;
  longitude: number;
  latestReport: MapReport;
}

export interface MapReport {
  id: string;
  location_name: string | null;
  description: string | null;
  category: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ReportStatus;
  priority: Priority | null;
  photo_url: string | null;
  photo_urls: string[] | null;
  reporter_name: string | null;
  reporter_phone: string | null;
  created_at: string | null;
  updated_at: string | null;
  waste_type: string | string[] | null;
}
