import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Location,
  CarbonFactor,
  Profile,
  ReportLog,
  MetricStats,
  RecentReport,
  MapLocation,
  LocationWithCarbon,
  ReportLogWithLocation,
  MapLocationCategory,
  WasteCategory,
  Priority,
  ReportStatus,
  LocationStatus,
  LocationCategory,
} from "@/types/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

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
  stock: number | null;
  is_active: boolean | null;
  waste_impact_badge: string | null;
  description: string | null;
  thumbnail_url: string | null;
  gallery_urls: string | string[] | null;
  is_featured: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  seller?: Seller | null;
}

export type ContentFormat = "Artikel" | "Video" | "Infografis";

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

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  article_id: string;
  title: string | null;
  description?: string | null;
  questions: QuizQuestion[];
}

export const supabase =
  typeof supabaseUrl === "string" && typeof supabaseKey === "string"
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di Vercel.",
    );
  }

  return supabase;
}

export type {
  MapLocationCategory,
  WasteCategory,
  Priority,
  ReportStatus,
  LocationStatus,
  LocationCategory,
  Location,
  CarbonFactor,
  Profile,
  ReportLog,
  MetricStats,
  RecentReport,
  MapLocation,
  LocationWithCarbon,
  ReportLogWithLocation,
};
