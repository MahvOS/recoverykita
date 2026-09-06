import { createClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  correctAnswerIndices?: number[];
  type?: "multiple_choice" | "checkbox";
}

export interface Quiz {
  id: string;
  article_id: string;
  title: string | null;
  description?: string | null;
  questions: QuizQuestion[];
}

export const supabase =
  typeof window === "undefined" &&
  typeof supabaseUrl === "string" &&
  typeof supabaseKey === "string"
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export const supabaseAdmin =
  typeof supabaseUrl === "string" && typeof supabaseServiceRoleKey === "string"
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

let _browserAuthClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseAuthClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  if (typeof window === "undefined") {
    throw new Error(
      "getSupabaseAuthClient hanya untuk dipakai di client/browser.",
    );
  }
  if (!_browserAuthClient) {
    _browserAuthClient = createBrowserClient(supabaseUrl, supabaseKey);
  }
  return _browserAuthClient;
}

export function getSupabaseClient() {
  if (typeof window !== "undefined") {
    return getSupabaseAuthClient();
  }

  if (!supabase) {
    throw new Error(
      "Supabase belum dikonfigurasi. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY di Vercel.",
    );
  }

  return supabase;
}

export function getSupabaseAdminClient() {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase Admin Client belum dikonfigurasi. Tambahkan SUPABASE_SERVICE_ROLE_KEY di environment variables.",
    );
  }

  return supabaseAdmin;
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
