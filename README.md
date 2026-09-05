<div align="center">

# ♻️ RecoveryKita

### Platform Manajemen & Analitik Pengolahan Sampah Perkotaan Berbasis Peta Intuitif

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-success?style=for-the-badge)](https://recoverykita.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/MahvOS/recoverykita)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**Submission for ITECHNO CUP 2026 - Web Development**

**By PAPAN ATAS!**

</div>

---

## 📋 Daftar Isi

- [Tim Developer](#-tim-developer)
- [Tentang Proyek](#-tentang-proyek)
- [Fitur Unggulan](#-fitur-unggulan)
- [Demo & Screenshot](#-demo--screenshot)
- [Teknologi](#-teknologi)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Penggunaan](#-penggunaan)
- [API & Server Actions](#-api--server-actions)
- [Lisensi](#-lisensi)

---

## 👥 Tim Developer

| Nama                       | Peran                              | GitHub                                                                           |
| -------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| **Mahvin Aflah Mulyana**   | Project Lead & Fullstack Developer | [@MahvOS](https://github.com/MahvOS)                                             |
| **Sulthan Fatin Aditya**   | Frontend Developer                 | [@burungbekicotningmagetan-rgb](https://github.com/burungbekicotningmagetan-rgb) |
| **Muhammad Adzka Mumtaza** | UI/UX Designer                     | [@HumanitySX](https://github.com/HumanitySX)                                     |

---

## 🎯 Tentang Proyek

### Latar Belakang

Penumpukan sampah ilegal di area perkotaan sering kali tidak terdeteksi dengan cepat oleh pihak berwenang karena terbatasnya sistem pelaporan warga yang terintegrasi secara real-time. Selain itu, penanganan sampah sering kali bersifat reaktif tanpa adanya pemetaan wilayah rawan (Red Zone) berbasis data analitik.

### Solusi yang Ditawarkan

**RecoveryKita** hadir sebagai platform _crowdsourced waste management_ yang memungkinkan warga melaporkan titik sampah liar secara visual berbasis peta, serta menyediakan **Dashboard Admin & Analitik** bagi pihak pengelola untuk memantau kluster titik rawan (Hotspot & Red Zone) secara efisien.

### Tujuan Proyek

- 🎯 **Tujuan Utama**: Mempercepat respon penanganan sampah liar melalui transparansi data lokasi berbasis geospatial.
- 📊 **Target Pengguna**: Masyarakat umum (Pelapor), Tim Kebersihan/Komunitas (Eksekutor), dan Admin Pengelola (Analitikal).
- 💡 **Value Proposition**: Algoritma otomatisasi deteksi Red Zone berbasis pembulatan titik koordinat (_clustering_) dan pemetaan visual real-time.

---

## ✨ Fitur Unggulan

### Fitur Utama

| Fitur                           | Deskripsi                                                                             | Keunggulan                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Pelaporan Berbasis Peta**     | Warga dapat menandai titik lokasi sampah secara presisi beserta bukti foto.           | Otomatis membaca koordinat geografis dari lokasi pengguna.             |
| **Analitik Red Zone / Hotspot** | Mengelompokkan titik-titik laporan berdekatan ke dalam kategori risikonya.            | Area dengan ≥ 3 laporan aktif otomatis memicu status _Red Zone_.       |
| **Dashboard Admin**             | Panel kontrol untuk memantau daftar pengguna, laporan masuk, serta status penanganan. | Dilengkapi kontrol verifikasi dan aksi cepat penanganan sampah.        |
| **Peta Interaktif**             | Visualisasi spasial berbasis Leaflet & CartoDB yang ringan dan responsif.             | Mendukung heatmap dan marker kluster tanpa beban bandwidth tinggi.     |
| **Pasar Barang Bekas**          | Marketplace untuk barang bekas layak pakai yang mendukung ekonomi sirkular.           | Memudahkan warga jual beli barang bekas secara daring.                 |
| **Edukasi Lingkungan**          | Katalog artikel dan kuis edukasi tentang daur ulang, kompos, dan zero waste.          | Meningkatkan kesadaran masyarakat seputar pengelolaan sampah.          |
| **Download Panduan & Poster**   | Materi edukasi siap cetak dalam format DOCX, JPEG, dan XLSX.                          | Dapat diunduh langsung untuk kebutuhan RT/RW, sekolah, atau komunitas. |

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi RecoveryKita](https://recoverykita.vercel.app)**

### Screenshot Aplikasi

<div align="center">
  <img src="https://i.imgur.com/zB6kcvN.png" alt="Halaman Utama Recoverykita" width="800"/>
  <p><em>Halaman Utama Recoverykita</em></p>

  <img src="https://i.imgur.com/wh3orvC.png" alt="Halaman Marketplace RecoveryKita" width="800"/>
  <p><em>Halaman Marketplace RecoveryKita</em></p>

  <img src="https://i.imgur.com/Bw9Q8Dz.png" alt="Halaman Edukasi RecoveryKita" width="800"/>
  <p><em>Halaman Edukasi RecoveryKita</em></p>

  <img src="https://i.imgur.com/I0uNRZj.png" alt="Peta Laporan Utama" width="800"/>
  <p><em>Peta Interaktif Pelaporan Sampah Warga</em></p>

  <img src="https://i.imgur.com/uvDKCS9.png" alt="Dashboard Analitik Red Zone" width="800"/>
  <p><em>Dashboard Analitik Admin & Pemetaan Red Zone</em></p>
</div>

---

## 🛠️ Teknologi

### Tech Stack

#### Frontend

```
Framework    : Next.js 16.3 (App Router)
Language     : TypeScript
Runtime      : React 19.2
Styling      : Tailwind CSS v4
Icons        : Lucide React 1.33.0
Maps         : Leaflet 1.9.4
State        : React Context API + useState/useEffect
```

#### Backend

```
Runtime      : Node.js (Server Actions & API Routes)
Database     : Supabase (PostgreSQL) + Row Level Security (RLS)
Auth         : Supabase Auth (Email/Password)
Storage      : Supabase Storage (bucket: educational-assets)
Tile Maps    : CARTO Basemaps (light_all) + Leaflet 1.9.4
Realtime     : Supabase Realtime (optional)
Server Auth  : Service Role Key (server-only) untuk bypass RLS
```

#### DevOps & Tools

```
Deployment   : Vercel
Linting      : ESLint 9 + Prettier
Type Checking: TypeScript 5
Package Mgr  : npm
```

### Alasan Pemilihan Teknologi

| Teknologi           | Alasan Pemilihan                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| **Next.js 16**      | Framework React terbaik untuk production dengan App Router, Server Components, dan optimasi bawaan.    |
| **Tailwind CSS v4** | Utility-first CSS yang cepat untuk prototyping dan mempertahankan konsistensi UI.                      |
| **Supabase**        | Backend-as-a-Service lengkap (PostgreSQL, Auth, Storage, RLS) yang memangkas kebutuhan backend custom. |
| **Leaflet**         | Library peta ringan, open-source, dan mudah diintegrasikan dengan React untuk visualisasi geospasial.  |
| **Lucide React**    | Ikon konsisten, ringan, dan modern yang selaras dengan desain Tailwind.                                |

### Dependencies Utama

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.12.4",
    "@supabase/supabase-js": "^2.112.3",
    "@types/leaflet": "^1.9.22",
    "leaflet": "^1.9.4",
    "lucide-react": "^1.33.0",
    "next": "16.3.0",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.3.0",
    "prettier": "3.9.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 🏗️ Arsitektur Sistem

### System Architecture

```mermaid
flowchart LR
    User[👤 Pengguna] --> Next[Next.js App]
    Admin[🛡️ Admin] --> Next
    Next --> Supabase[(Supabase PostgreSQL)]
    Next --> Storage[Supabase Storage]
    Next --> Map[Leaflet]
    Supabase --> RLS[Row Level Security]
    Storage --> Assets[Dokumen / Poster / Template]
```

### Database Schema

```mermaid
erDiagram
    auth_users ||--|| profiles : "id"
    profiles ||--o{ user_quiz_attempts : "mengerjakan"
    sellers ||--o{ products : "memiliki"
    profiles ||--o| sellers : "id"
    locations ||--o{ report_logs : "memiliki"

    articles ||--o| quizzes : "memiliki"
    quizzes ||--o{ quiz_questions : "memiliki"
    quiz_questions ||--o{ quiz_options : "memiliki"
    quizzes ||--o{ user_quiz_attempts : "dicoba"

    locations {
        uuid id PK
        varchar title
        text description
        map_location_category category
        float8 latitude
        float8 longitude
        text address_notes
        text photo_url
        text cleaned_photo_url
        numeric estimated_volume_kg
        report_status status
        varchar reporter_name
        varchar reporter_phone
        _text waste_type
        _text photo_urls
        report_priority priority
        timestamptz created_at
        timestamptz updated_at
    }

    report_logs {
        uuid id PK
        uuid location_id FK
        report_status previous_status
        report_status new_status
        text notes
        text updated_by
        timestamptz updated_at
    }

    articles {
        uuid id PK
        varchar title
        varchar slug
        text summary
        text content
        content_format format
        varchar category
        text thumbnail_url
        int4 read_time_minutes
        varchar author_name
        int4 views_count
        bool is_featured
        timestamptz published_at
        timestamptz created_at
        timestamptz updated_at
    }

    quizzes {
        uuid id PK
        uuid article_id FK
        varchar title
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    quiz_questions {
        uuid id PK
        uuid quiz_id FK
        text question_text
        question_type type
        int4 order_index
        timestamptz created_at
    }

    quiz_options {
        uuid id PK
        uuid question_id FK
        text option_text
        bool is_correct
        int4 order_index
    }

    sellers {
        uuid id PK
        varchar name
        varchar phone_whatsapp
        numeric total_waste_saved_kg
        timestamptz created_at
    }

    products {
        uuid id PK
        uuid seller_id FK
        varchar title
        varchar slug
        numeric price
        product_category category
        varchar waste_impact_badge
        text description
        text thumbnail_url
        _text gallery_urls
        bool is_featured
        int4 stock
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }
```

### Folder Structure

```
project-root/
├── app/
│   ├── admin/                   # Admin dashboard & management pages
│   ├── edukasi/                 # Education articles, quiz, downloadable assets
│   ├── lapor/                   # Waste report form & map
│   ├── marketplace/             # Marketplace product pages
│   ├── peta/                    # Interactive map view
│   └── layout.tsx               # Root layout
├── components/
│   ├── admin/                   # Admin-specific components (sidebar, maps, tables)
│   ├── Quiz/                    # Interactive quiz components
│   └── *.tsx                    # Shared UI components
├── hooks/                       # Custom React hooks
├── actions/                     # Server Actions (assetActions, edukasiActions, mapActions, userActions)
├── types/                       # TypeScript type definitions
├── lib/                         # Supabase client & shared utilities
├── public/                      # Static assets (images, documents, posters, templates)
├── isi_artikel/                 # Article markdown/content files
├── package.json                 # Dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── next.config.ts               # Next.js configuration
└── README.md                    # Project documentation
```

---

## ⚙️ Instalasi & Setup

### Prerequisites

Pastikan Anda telah menginstall:

- **Node.js** (v18.x atau lebih tinggi)
- **npm** / **yarn** / **pnpm**
- **Git**

### Langkah Instalasi

#### 1️⃣ Clone Repository

```bash
git clone https://github.com/[username]/[repo-name].git
cd [repo-name]
```

#### 2️⃣ Install Dependencies

```bash
# Menggunakan npm
npm install

# Atau menggunakan yarn
yarn install

# Atau menggunakan pnpm
pnpm install
```

#### 3️⃣ Setup Environment Variables

Buat file `.env.local` di root directory dan isi variabel berikut:

```env
# =============================================
# Supabase (wajib)
# =============================================
# URL project Supabase Anda (Settings -> API -> Project URL)
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"

# Publishable / anon key (Settings -> API -> Project API keys -> Publishable key)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_xxx..."

# =============================================
# Supabase (server-only, JANGAN di-publish)
# =============================================
# Service role / secret key (Settings -> API -> Project API keys -> Secret key)
# Digunakan oleh lib/supabase.ts (getSupabaseAdminClient) untuk Server Actions
# yang mem-bypass RLS, seperti upload/hapus aset edukasi & sinkronisasi produk
SUPABASE_SERVICE_ROLE_KEY="sb_secret_xxx..."

# =============================================
# Map / Tile Provider (opsional tapi direkomendasikan)
# =============================================
# API key CARTO basemaps untuk tile peta Leaflet. Jika kosong, tile masih
# dimuat (tanpa api_key) untuk development. Untuk produksi & guna menghindari
# rate-limit, daftar di https://carto.com/ dan isi variabel ini.
NEXT_PUBLIC_CARTO_API_KEY="your_carto_api_key"
```

> ⚠️ **Penting tentang `SUPABASE_SERVICE_ROLE_KEY`**
>
> - Variabel ini **TIDAK** boleh memakai prefix `NEXT_PUBLIC_` karena akan ter-ekspos ke browser.
> - Hanya digunakan di server (Server Actions di `actions/`, `lib/supabase.ts`).
> - Di Vercel, masukkan sebagai **Environment Variable** biasa (bukan `NEXT_PUBLIC_*`) agar tidak ikut ter-bundle ke client.
> - Jangan pernah commit `.env.local` ke Git (sudah ada di `.gitignore`).

#### 4️⃣ Setup Database

Jalankan SQL schema Supabase yang tersedia di dokumentasi proyek untuk membuat tabel: `profiles`, `locations`, `location_status_history`, `articles`, `quiz_questions`, `downloadable_assets`, `marketplace_products`, `carbon_factors`, dan `waste_lookup_guides`.

Pastikan **RLS** diaktifkan dan Anda membuat **policy** yang sesuai. Untuk admin (upload/hapus aset edukasi, dsb.), Server Action akan memakai service-role key untuk mem-bypass RLS.

#### 5️⃣ Setup Storage Bucket

Buat bucket **public** di Supabase Storage dengan nama persis:

```
educational-assets
```

Bucket ini digunakan oleh fitur **Download Panduan & Poster** di halaman Edukasi untuk menyimpan file DOCX/PDF/JPEG/XLSX. Pastikan policy storage mengizinkan `read` untuk publik dan `insert/update/delete` dilakukan lewat service-role (Server Action).

#### 6️⃣ Upload Assets

Letakkan file panduan dan poster di folder:

- `public/documents/` untuk file DOCX/PDF
- `public/posters/` untuk poster JPEG/PNG
- `public/templates/` untuk template XLSX

Atau, upload lewat **Admin Panel → Kelola Edukasi → Tambah Aset** (disarankan agar metadata tercatat di tabel `downloadable_assets`).

#### 7️⃣ Run Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

---

## 🚀 Penggunaan

### Menjalankan Aplikasi

```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start

# Linting
npm run lint
```

### User Guide

#### Untuk Pengguna Umum

1. **Pelaporan Sampah**: Buka halaman **Lapor**, login/register, klik peta untuk menentukan lokasi, upload foto bukti, pilih jenis sampah, dan kirim laporan.
2. **Peta Interaktif**: Buka halaman **Peta** untuk melihat semua laporan, filter berdasarkan jenis/prioritas, dan lihat detail laporan.
3. **Edukasi**: Buka halaman **Edukasi** untuk membaca artikel, mengerjakan kuis, dan mengunduh panduan/poster siap cetak.
4. **Marketplace**: Buka halaman **Marketplace** untuk menjual atau membeli barang bekas layak pakai.

#### Untuk Admin

1. **Akses Admin Panel**: Buka `/admin` setelah login sebagai admin.
2. **Kelola Laporan Peta**: Lihat daftar laporan, ubah status penanganan, dan deteksi hotspot/red zone.
3. **Kelola Edukasi**: Tambah, edit, dan hapus artikel edukasi beserta kuisnya.
4. **Kelola Marketplace**: Verifikasi dan kelola produk yang dijual warga.

---

## 📚 API Documentation

### Base URL

```
Development: http://localhost:3000
Production:  https://recoverykita.vercel.app
```

### Server Actions

Proyek ini menggunakan **Next.js Server Actions** (di folder `actions/`) untuk semua operasi tulis & baca data yang butuh service-role. Server-side admin client dibuat lewat `getSupabaseAdminClient()` di `lib/supabase.ts` dan **mem-bypass RLS** karena berjalan dengan `SUPABASE_SERVICE_ROLE_KEY`.

#### Waste Reports (`actions/mapActions.ts`)

- `getHotspotClusters()` - Mengambil kluster hotspot dari Supabase (dipakai oleh `app/peta/page.tsx` & `components/admin/HotspotMap.tsx`)

> ℹ️ Operasi tulis laporan (`updateStatus`, `deleteReport`, `createReport`) di sisi admin dipanggil lewat custom hook `hooks/useMapReports.ts` yang melakukan update langsung via Supabase client admin.

#### User Management (`actions/userActions.ts`)

- `getAdminUsers()` - Mengambil daftar user (admin)
- `getUserReports(userId)` - Mengambil semua laporan milik user
- `getUserReportCount(userId)` - Menghitung jumlah laporan user
- `toggleBanUser(userId, currentStatus)` - Ban / unban user (admin)

> ℹ️ Pengaturan role & approval user dilakukan di `components/admin/UserManagement.tsx` lewat Supabase client admin (`getSupabaseAdminClient`).

#### Education Assets (`actions/assetActions.ts`)

- `getAssets()` - Mengambil semua aset edukasi dari tabel `downloadable_assets`
- `uploadAsset(formData)` - Upload file ke bucket `educational-assets` + insert metadata (admin)
- `deleteAsset(id, fileUrl)` - Hapus file dari storage + baris DB (admin)
- `trackDownload(id)` - Menambah `download_count` (RPC increment)

#### Education Articles (`actions/edukasiActions.ts`)

- `createArticle(payload)` - Membuat artikel edukasi baru + soal kuis (admin)
- `updateArticle(id, payload)` - Memperbarui artikel + kuis terkait (admin)
- `deleteArticle(id)` - Menghapus artikel (admin)
- `uploadArticleThumbnail(formData)` - Upload thumbnail artikel ke Supabase Storage

> ℹ️ Semua aksi di atas memakai **admin client** (`getSupabaseAdminClient`) sehingga dapat menulis ke storage dan tabel tanpa dibatasi policy RLS publik. Lindungi route `/admin/*` di level aplikasi.

### Database Tables

| Table                     | Description                                  |
| ------------------------- | -------------------------------------------- |
| `profiles`                | Data profil pengguna                         |
| `locations`               | Laporan titik sampah                         |
| `location_status_history` | Riwayat perubahan status laporan             |
| `articles`                | Artikel edukasi                              |
| `quiz_questions`          | Pertanyaan kuis edukasi (kolom: `type` ENUM) |
| `downloadable_assets`     | Aset unduhan (dokumen, poster, template)     |
| `marketplace_products`    | Produk marketplace                           |
| `carbon_factors`          | Faktor emisi karbon per jenis sampah         |
| `waste_lookup_guides`     | Panduan daur ulang berdasarkan jenis sampah  |

---

## 🧪 Validasi & Kualitas Kode

Karena fokus proyek ini adalah **submission ITECHNO CUP 2026** (bukan project jangka panjang dengan CI penuh), validasi dilakukan dengan:

```bash
# Lint seluruh proyek (ESLint + Next.js rules)
npm run lint

# Build produksi (menjalankan TypeScript check + kompilasi)
npm run build

# Menjalankan server produksi lokal
npm run start
```

Jika `npm run build` keluar tanpa error dan warning `Image` Next.js tidak muncul, aplikasi siap di-deploy ke Vercel.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE) - lihat file LICENSE untuk detail lebih lanjut.

---

<div align="center">

**Made with ❤️ by PAPAN ATAS! for ITECHNO CUP 2026**

</div>
