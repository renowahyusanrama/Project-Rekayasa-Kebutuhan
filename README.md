# Sistem Pelacakan Alumni UMM

Dashboard pelacakan alumni berbasis React + Vite dan Supabase, dirancang khusus untuk mengelola, melacak, dan memverifikasi lebih dari 142.292 data alumni Universitas Muhammadiyah Malang (2000-2025). 

Aplikasi ini sangat cocok digunakan untuk **Data Enrichment** (Pengayaan Data) seperti pada penugasan Daily Project Rekayasa Kebutuhan, di mana data dasar dilengkapi dengan informasi kontak, sosial media, dan pekerjaan.

## 🌟 Fitur Utama

- **Pencarian Real-Time (Supabase)**: Pencarian cepat berdasarkan Nama, NIM, Fakultas, Jurusan, dan Email langsung dari database Supabase.
- **Quick Search Links**: Di dalam panel detail, sistem akan *mengenerate* URL pencarian otomatis ke Google, LinkedIn, Instagram, Facebook, dan PDDIKTI berdasarkan nama alumni untuk mempercepat proses investigasi manual.
- **Manajemen Status Pelacakan**: Ubah status dari "Belum Dilacak", "Perlu Verifikasi", hingga "Teridentifikasi".
- **Statistik Dashboard**: Hitungan *real-time* jumlah alumni yang ditemukan dan kontak yang tersedia dari hasil pencarian.
- **Pipeline Data Otomatis**: Dilengkapi dengan berbagai skrip Node.js otomatis untuk konversi file `.xlsx` mentah ke `.json`, dan mengunggah massal ke Supabase.

## ⚙️ Teknologi yang Digunakan

- **Frontend**: React, Vite, Tailwind CSS
- **Backend / Database**: Supabase (PostgreSQL)
- **Data Processing**: Node.js, `xlsx` parser

## 🚀 Cara Menjalankan Project (Frontend)

Pastikan kamu sudah menginstal **Node.js**.

1. Buka terminal dan masuk ke root folder project:
   ```powershell
   cd "C:\Users\ADMIN\Kuliah SMT 6\Rekayasa Kebutuhan\sistem-pelacakan-alumni-main"
   ```
2. Instal dependensi frontend (jika belum):
   ```powershell
   npm install --prefix react-dashboard
   ```
3. Jalankan development server:
   ```powershell
   npm run dev
   ```
4. Buka browser di `http://localhost:5173` (atau port lain yang muncul di terminal jika 5173 terpakai).
5. **Akses Login**: 
   - Username: `Admin123`
   - Password: `Admin123`

## 📊 Pipeline Data & Skrip (Untuk Developer / Admin)

Di dalam project ini, terdapat beberapa skrip Node.js (di folder `scripts/`) untuk memproses 142.292 data alumni. Kamu bisa menjalankannya via `npm run`:

| Perintah | Deskripsi |
|----------|-----------|
| `npm run pipeline:convert` | Mengonversi file `Alumni 2000-2025.xlsx` mentah ke format `alumni.json` sesuai skema database. |
| `npm run pipeline:enrich` | Membuat halaman HTML batch (misal 50 data/halaman) yang mempermudah pembagian tugas pelacakan. |
| `npm run pipeline:merge` | Menggabungkan hasil data yang sudah ditemukan secara manual kembali ke file utama `alumni.json`. |
| `npm run pipeline:enrich-stats`| Melihat statistik *coverage* pengisian data saat ini. |
| `node scripts/upload_to_supabase.js` | Mengunggah/update seluruh data (142 ribu+) dari `alumni.json` ke tabel `alumni` di Supabase. |

## 🗄️ Struktur Database (Supabase)

Tabel `alumni` di Supabase menggunakan skema berikut:
- **Identitas Dasar**: `id`, `name`, `nim`, `fakultas`, `jurusan`, `tahunMasuk`, `tahunLulus`
- **Data Enrichment (8 Item Target)**: 
  - Sosial Media: `linkedin`, `instagram`, `facebook`, `tiktok`
  - Kontak: `email`, `noHp`
  - Pekerjaan: `tempatBekerja`, `alamatBekerja`, `posisi`, `kategoriKarier`, `workplace_social`
- **Sistem**: `status` (Belum Dilacak, Perlu Verifikasi, Teridentifikasi)

## 💡 Alur Kerja Pelacakan Data (Enrichment Workflow)

Bagi kamu yang mengerjakan pelacakan data, ikuti langkah berikut:
1. Buka aplikasi web dan login sebagai Admin.
2. Gunakan fitur pencarian untuk mencari nama atau angkatan tertentu (misal: cari nama teman, atau cari "Informatika").
3. Klik **Detail** pada alumni yang dituju.
4. Gunakan tombol berwarna di bagian **"Cari Alumni di Internet"** (🔍 Google, 💼 LinkedIn, dll) untuk memicu pencarian spesifik ke jejaring sosial.
5. Jika menemukan kecocokan data, tutup panel detail, klik **Edit** pada row alumni tersebut.
6. Masukkan temuan ke form (simpan link LinkedIn, nama tempat kerja, email, dll), lalu ubah status menjadi "Teridentifikasi".
7. Simpan data. Data akan otomatis terupdate di Supabase.
