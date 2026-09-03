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

| Fitur                           | Deskripsi                                                                             | Keunggulan                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Pelaporan Berbasis Peta**     | Warga dapat menandai titik lokasi sampah secara presisi beserta bukti foto.           | Otomatis membaca koordinat geografis dari lokasi pengguna.           |
| **Analitik Red Zone / Hotspot** | Mengelompokkan titik-titik laporan berdekatan ke dalam kategori risikonya.            | Area dengan $\ge 3$ laporan aktif otomatis memicu status _Red Zone_. |
| **Dashboard Admin**             | Panel kontrol untuk memantau daftar pengguna, laporan masuk, serta status penanganan. | Dilengkapi kontrol verifikasi dan aksi cepat penanganan sampah.      |
| **Peta Interaktif**             | Visualisasi spasial berbasis Leaflet & CartoDB yang ringan dan responsif.             | Mendukung heatmap dan marker kluster tanpa beban bandwidth tinggi.   |

---

## 📸 Demo & Screenshot

### Live Demo

🔗 **[Kunjungi RecoveryKita](https://recoverykita.vercel.app)**

### Screenshot Aplikasi

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Peta+Laporan+Utama" alt="Peta Laporan Utama" width="800"/>
  <p><em>Peta Interaktif Pelaporan Sampah Warga</em></p>

  <img src="https://via.placeholder.com/800x450?text=Dashboard+Analitik+Red+Zone" alt="Dashboard Analitik Red Zone" width="800"/>
  <p><em>Dashboard Analitik Admin & Pemetaan Red Zone</em></p>
</div>

---

## 🛠️ Teknologi

### Tech Stack

#### Core Stack

```text
Framework    : Next.js 14 (App Router)
Language     : TypeScript
Database & Auth: Supabase (PostgreSQL, Storage, RLS)
Styling      : Tailwind CSS, Shadcn UI
Map Library  : Leaflet.js, React-Leaflet
Map Tiles    : CartoDB / Esri World Street Map
```
