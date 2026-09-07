


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."content_format" AS ENUM (
    'Artikel',
    'Video',
    'Infografis'
);


ALTER TYPE "public"."content_format" OWNER TO "postgres";


CREATE TYPE "public"."map_location_category" AS ENUM (
    'trash_dump',
    'waste_bank',
    'community_action'
);


ALTER TYPE "public"."map_location_category" OWNER TO "postgres";


CREATE TYPE "public"."product_category" AS ENUM (
    'Fashion',
    'Dekorasi Rumah',
    'Aksesoris',
    'Alat Tulis'
);


ALTER TYPE "public"."product_category" OWNER TO "postgres";


CREATE TYPE "public"."question_type" AS ENUM (
    'multiple_choice',
    'checkbox'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";


CREATE TYPE "public"."report_priority" AS ENUM (
    'rendah',
    'sedang',
    'tinggi'
);


ALTER TYPE "public"."report_priority" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'pending',
    'in_progress',
    'cleaned',
    'rejected',
    'completed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'citizen',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_from_auth"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_user_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_users"() RETURNS TABLE("id" "uuid", "email" "text", "full_name" "text", "phone_number" "text", "avatar_url" "text", "role" "text", "is_banned" boolean, "created_at" timestamp with time zone, "total_reports" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
SELECT 
    p.id,
    u.email::text,
    p.full_name,
    p.phone_number,
    p.avatar_url,
    p.role,
    COALESCE(p.is_banned, false) AS is_banned,
    p.created_at,
    0::bigint AS total_reports
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;
$$;


ALTER FUNCTION "public"."get_admin_users"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_hotspot_clusters"() RETURNS TABLE("name" "text", "count" bigint, "latitude" double precision, "longitude" double precision, "latest_report" "jsonb")
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  with clustered as (
    select
      coalesce(nullif(trim(lr.address_notes), ''), 'Wilayah Tidak Diketahui') as cluster_name,
      count(*) as report_count,
      avg(lr.latitude) as avg_lat,
      avg(lr.longitude) as avg_lng,
      max(lr.created_at) as latest_created_at
    from public.locations lr
    where lr.latitude is not null
      and lr.longitude is not null
      and abs(lr.latitude) <= 90
      and abs(lr.longitude) <= 180
    group by 1
  )
  select
    c.cluster_name as name,
    c.report_count as count,
    c.avg_lat as latitude,
    c.avg_lng as longitude,
    jsonb_build_object(
      'location_name', c.cluster_name,
      'description', c.cluster_name,
      'category', lr.category,
      'latitude', c.avg_lat,
      'longitude', c.avg_lng,
      'status', lr.status,
      'priority', lr.priority,
      'photo_url', lr.photo_url,
      'photo_urls', lr.photo_urls,
      'reporter_name', lr.reporter_name,
      'reporter_phone', lr.reporter_phone,
      'created_at', lr.created_at,
      'updated_at', lr.updated_at,
      'waste_type', lr.waste_type
    ) as latest_report
  from clustered c
  join lateral (
    select *
    from public.locations l
    where coalesce(nullif(trim(l.address_notes), ''), 'Wilayah Tidak Diketahui') = c.cluster_name
    order by l.created_at desc
    limit 1
  ) lr on true
  order by c.report_count desc;
$$;


ALTER FUNCTION "public"."get_hotspot_clusters"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_reporting_stats"() RETURNS TABLE("total_reports" bigint, "total_cleaned" bigint, "total_in_progress" bigint, "total_volume_kg" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_reports,
    COUNT(*) FILTER (WHERE status = 'cleaned')::BIGINT AS total_cleaned,
    COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT AS total_in_progress,
    COALESCE(SUM(estimated_volume_kg), 0)::NUMERIC AS total_volume_kg
  FROM public.locations
  WHERE category = 'trash_dump';
END;
$$;


ALTER FUNCTION "public"."get_reporting_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Warga RecoveryKita'),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_download_count"("asset_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE downloadable_assets
  SET download_count = download_count + 1
  WHERE id = asset_id;
END;
$$;


ALTER FUNCTION "public"."increment_download_count"("asset_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_report_reporter_info"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_full_name VARCHAR;
  v_phone VARCHAR;
BEGIN
  -- Ambil data dari tabel profiles milik user yang sedang login/mengirim data
  SELECT full_name, phone_number 
  INTO v_full_name, v_phone
  FROM public.profiles
  WHERE id = COALESCE(NEW.user_id, auth.uid());

  -- Set nilainya ke kolom reporter_name dan reporter_phone
  NEW.reporter_name := COALESCE(NEW.reporter_name, v_full_name);
  NEW.reporter_phone := COALESCE(NEW.reporter_phone, v_phone);
  
  -- Simpan ID user ke user_id
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_report_reporter_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_quiz_title_from_article"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Mengambil title dari tabel articles secara otomatis
    SELECT title INTO NEW.title 
    FROM public.articles 
    WHERE id = NEW.article_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_quiz_title_from_article"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_report_submissions_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_report_submissions_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "summary" "text" NOT NULL,
    "content" "text" NOT NULL,
    "format" "public"."content_format" DEFAULT 'Artikel'::"public"."content_format",
    "category" character varying(100) NOT NULL,
    "thumbnail_url" "text",
    "read_time_minutes" integer DEFAULT 5,
    "author_name" character varying(100) DEFAULT 'Tim Edukasi RecoveryKita'::character varying,
    "views_count" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "published_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carbon_factors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "waste_type" character varying(100) NOT NULL,
    "co2_factor_per_kg" numeric(6,3) NOT NULL
);


ALTER TABLE "public"."carbon_factors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."downloadable_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "file_url" "text" NOT NULL,
    "file_type" character varying(20) DEFAULT 'PDF'::character varying,
    "download_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."downloadable_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "category" "public"."map_location_category" DEFAULT 'trash_dump'::"public"."map_location_category" NOT NULL,
    "latitude" double precision NOT NULL,
    "longitude" double precision NOT NULL,
    "address_notes" "text",
    "photo_url" "text",
    "cleaned_photo_url" "text",
    "estimated_volume_kg" numeric(8,2) DEFAULT 0,
    "status" "public"."report_status" DEFAULT 'pending'::"public"."report_status" NOT NULL,
    "reporter_name" character varying(100) DEFAULT 'Warga Anonim'::character varying,
    "reporter_phone" character varying(20),
    "reporter_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "priority" "public"."report_priority" DEFAULT 'sedang'::"public"."report_priority",
    "waste_type" "text"[] DEFAULT ARRAY[]::"text"[],
    "photo_urls" "text"[]
);


ALTER TABLE "public"."locations" OWNER TO "postgres";

ALTER TABLE "public"."locations"
    ADD COLUMN IF NOT EXISTS "reporter_id" "uuid";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'locations_reporter_id_fkey'
    ) THEN
        ALTER TABLE ONLY "public"."locations"
            ADD CONSTRAINT "locations_reporter_id_fkey"
            FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;
    END IF;
END
$$;


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid",
    "title" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "price" numeric(12,2) NOT NULL,
    "category" "public"."product_category" NOT NULL,
    "waste_impact_badge" character varying(100) NOT NULL,
    "description" "text" NOT NULL,
    "thumbnail_url" "text" NOT NULL,
    "gallery_urls" "text"[] DEFAULT '{}'::"text"[],
    "is_featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stock" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "products_stock_check" CHECK (("stock" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" character varying(150) NOT NULL,
    "phone_number" character varying(20) NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "role" "public"."user_role" DEFAULT 'citizen'::"public"."user_role",
    "is_banned" boolean DEFAULT false,
    "banned_at" timestamp with time zone
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_options" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "question_id" "uuid" NOT NULL,
    "option_text" "text" NOT NULL,
    "is_correct" boolean DEFAULT false NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."quiz_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "question_text" "text" NOT NULL,
    "type" "public"."question_type" DEFAULT 'multiple_choice'::"public"."question_type" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "article_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "location_id" "uuid",
    "previous_status" "public"."report_status",
    "new_status" "public"."report_status" NOT NULL,
    "notes" "text",
    "updated_by" "text" DEFAULT 'Sistem / Admin'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."report_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sellers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(150) NOT NULL,
    "phone_whatsapp" character varying(20) NOT NULL,
    "total_waste_saved_kg" numeric(8,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sellers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_quiz_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quiz_id" "uuid" NOT NULL,
    "score" integer DEFAULT 0 NOT NULL,
    "total_questions" integer DEFAULT 0 NOT NULL,
    "answers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_quiz_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waste_lookup_guides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_name" character varying(50) NOT NULL,
    "icon_name" character varying(50) DEFAULT 'recycle'::character varying,
    "examples" "text" NOT NULL,
    "disposal_instruction" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."waste_lookup_guides" OWNER TO "postgres";


ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."carbon_factors"
    ADD CONSTRAINT "carbon_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carbon_factors"
    ADD CONSTRAINT "carbon_factors_waste_type_key" UNIQUE ("waste_type");



ALTER TABLE ONLY "public"."downloadable_assets"
    ADD CONSTRAINT "downloadable_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_article_id_key" UNIQUE ("article_id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_logs"
    ADD CONSTRAINT "report_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."sellers"
    ADD CONSTRAINT "sellers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_quiz_attempts"
    ADD CONSTRAINT "user_quiz_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waste_lookup_guides"
    ADD CONSTRAINT "waste_lookup_guides_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."waste_lookup_guides"
    ADD CONSTRAINT "waste_lookup_guides_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_articles_category" ON "public"."articles" USING "btree" ("category");



CREATE INDEX "idx_articles_views" ON "public"."articles" USING "btree" ("views_count" DESC);



CREATE INDEX "idx_locations_category" ON "public"."locations" USING "btree" ("category");



CREATE INDEX "idx_locations_lat_lng" ON "public"."locations" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_locations_status" ON "public"."locations" USING "btree" ("status");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category");



CREATE INDEX "idx_products_price" ON "public"."products" USING "btree" ("price");



CREATE INDEX "idx_profiles_phone" ON "public"."profiles" USING "btree" ("phone_number");



CREATE INDEX "idx_report_logs_created_at" ON "public"."report_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_report_logs_location_id" ON "public"."report_logs" USING "btree" ("location_id");



CREATE OR REPLACE TRIGGER "handle_updated_at" BEFORE UPDATE ON "public"."articles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "tr_set_reporter_info" BEFORE INSERT ON "public"."report_logs" FOR EACH ROW EXECUTE FUNCTION "public"."set_report_reporter_info"();



CREATE OR REPLACE TRIGGER "trg_delete_auth_user" AFTER DELETE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."delete_user_from_auth"();



CREATE OR REPLACE TRIGGER "trigger_sync_quiz_title" BEFORE INSERT OR UPDATE ON "public"."quizzes" FOR EACH ROW EXECUTE FUNCTION "public"."sync_quiz_title_from_article"();



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."articles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_logs"
    ADD CONSTRAINT "report_logs_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quiz_attempts"
    ADD CONSTRAINT "user_quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_quiz_attempts"
    ADD CONSTRAINT "user_quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can update articles" ON "public"."articles" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Allow all actions for authenticated users" ON "public"."quiz_options" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all actions for authenticated users" ON "public"."quiz_questions" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations for authenticated sellers" ON "public"."sellers" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations for authenticated users on products" ON "public"."products" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated admin full access" ON "public"."locations" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated insert report logs" ON "public"."report_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated insert to products" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated insert to report_logs" ON "public"."report_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated update to products" ON "public"."products" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Allow insert for authenticated users" ON "public"."quizzes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow insert reports" ON "public"."report_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public insert to locations" ON "public"."locations" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow public read access on quizzes" ON "public"."quizzes" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow public read access to locations" ON "public"."locations" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Allow public read report logs" ON "public"."report_logs" FOR SELECT USING (true);



CREATE POLICY "Allow public read waste guides" ON "public"."waste_lookup_guides" FOR SELECT USING (true);



CREATE POLICY "Allow select for all on articles" ON "public"."articles" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow select for anon and authenticated on report_logs" ON "public"."report_logs" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."articles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select for authenticated users" ON "public"."quizzes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow select reports" ON "public"."report_logs" FOR SELECT USING (true);



CREATE POLICY "Allow update for authenticated users" ON "public"."quizzes" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow update reports" ON "public"."report_logs" FOR UPDATE USING (true);



CREATE POLICY "Enable delete access for all users on products" ON "public"."products" FOR DELETE USING (true);



CREATE POLICY "Enable delete for all users" ON "public"."products" FOR DELETE USING (true);



CREATE POLICY "Enable insert access for all users on products" ON "public"."products" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable insert access for all users on sellers" ON "public"."sellers" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for all users" ON "public"."quiz_options" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."quiz_questions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."quizzes" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users on products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users on sellers" ON "public"."sellers" FOR SELECT USING (true);



CREATE POLICY "Enable update access for all users on products" ON "public"."products" FOR UPDATE USING (true);



CREATE POLICY "Public Profiles Access" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Public Read Articles" ON "public"."articles" FOR SELECT USING (true);



CREATE POLICY "Public Read Assets" ON "public"."downloadable_assets" FOR SELECT USING (true);



CREATE POLICY "Public Read Carbon" ON "public"."carbon_factors" FOR SELECT USING (true);



CREATE POLICY "Public Read Products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Public Read Sellers" ON "public"."sellers" FOR SELECT USING (true);



CREATE POLICY "Users Can Update Own Profile" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carbon_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."downloadable_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."report_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sellers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_quiz_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waste_lookup_guides" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."delete_user_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_users"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_hotspot_clusters"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_hotspot_clusters"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_hotspot_clusters"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_reporting_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_reporting_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_reporting_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_download_count"("asset_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_download_count"("asset_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_download_count"("asset_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_report_reporter_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_report_reporter_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_report_reporter_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_quiz_title_from_article"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_quiz_title_from_article"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_quiz_title_from_article"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_report_submissions_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_report_submissions_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_report_submissions_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";

















































































GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."carbon_factors" TO "anon";
GRANT ALL ON TABLE "public"."carbon_factors" TO "authenticated";
GRANT ALL ON TABLE "public"."carbon_factors" TO "service_role";



GRANT ALL ON TABLE "public"."downloadable_assets" TO "anon";
GRANT ALL ON TABLE "public"."downloadable_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."downloadable_assets" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_options" TO "anon";
GRANT ALL ON TABLE "public"."quiz_options" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_options" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON TABLE "public"."report_logs" TO "anon";
GRANT ALL ON TABLE "public"."report_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."report_logs" TO "service_role";



GRANT ALL ON TABLE "public"."sellers" TO "anon";
GRANT ALL ON TABLE "public"."sellers" TO "authenticated";
GRANT ALL ON TABLE "public"."sellers" TO "service_role";



GRANT ALL ON TABLE "public"."user_quiz_attempts" TO "anon";
GRANT ALL ON TABLE "public"."user_quiz_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_quiz_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."waste_lookup_guides" TO "anon";
GRANT ALL ON TABLE "public"."waste_lookup_guides" TO "authenticated";
GRANT ALL ON TABLE "public"."waste_lookup_guides" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";




-- 1. Buat fungsi untuk menyalin user metadata ke profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, phone_number)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username'),
    new.raw_user_meta_data->>'phone_number'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 2. Pasang trigger setelah insert di auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
























