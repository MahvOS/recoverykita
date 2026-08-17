import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type MapLocationCategory =
  "trash_dump" | "waste_bank" | "community_action";
export type WasteCategory = "trash_dump" | "waste_bank" | "community_action";
export type Priority = "rendah" | "sedang" | "tinggi";
export type ReportStatus = "pending" | "in_progress" | "completed" | "rejected";

export interface Location {
  id: string;
  title: string;
  description: string;
  category: MapLocationCategory;
  latitude: number;
  longitude: number;
}

export interface ReportLog {
  id: string;
  location_id: string;
  previous_status: ReportStatus;
  new_status: ReportStatus;
  notes: string;
  created_at: string;
}

export interface Report {
  id: string;
  location_name: string;
  latitude: number;
  longitude: number;
  category: string;
  description: string;
  priority: Priority;
  photo_urls: string[];
  status: ReportStatus;
  created_at: string;
}

export type ContentFormat = "Artikel" | "Video" | "Infografis";

export interface Seller {
  id: string;
  name: string;
  phone_whatsapp: string | null;
  total_waste_saved_kg: number | null;
  created_at: string | null;
}

export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  title: string;
  slug: string;
  price: number;
  category: string;
  waste_impact_badge: string | null;
  description: string | null;
  thumbnail_url: string | null;
  gallery_urls: string | string[] | null;
  is_featured: boolean | null;
  created_at: string | null;
  seller?: Seller | null;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  format: ContentFormat | null;
  category: string;
  thumbnail_url: string;
  read_time_minutes: number | null;
  author_name: string | null;
  views_count: number | null;
  is_featured: boolean | null;
  published_at: string | null;
  created_at: string | null;
}

export interface CarbonFactor {
  id: string;
  waste_type: string;
  co2_factor_per_kg: number;
}

export interface WasteLookupGuide {
  id: string;
  category_name: string;
  examples: string;
  disposal_instruction: string;
  icon_name: string | null;
}

export interface DownloadableAsset {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  download_count: number | null;
  created_at: string | null;
}
