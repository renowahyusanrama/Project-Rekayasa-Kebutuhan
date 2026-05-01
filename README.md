# Sistem Pelacakan Alumni

Dashboard pelacakan alumni berbasis React + Vite untuk kebutuhan pembelajaran.  
Aplikasi ini menampilkan data alumni, pencarian data, statistik ringkas, login sederhana, serta form input data alumni.

## Fitur Utama

- Login aplikasi
- Data alumni dimuat otomatis dari file `alumni.json`
- Statistik ringkas alumni
- Pencarian data alumni tanpa menampilkan daftar massal
- Panel detail alumni untuk akses data sensitif yang lebih terkontrol
- Pagination hasil pencarian
- Form tambah data alumni
- Import Excel manual sebagai cadangan
- Tampilan dashboard yang sudah diperbarui
- Validasi input dasar untuk email, nomor HP, dan status pelacakan

## Akun Login

Gunakan akun berikut untuk masuk ke sistem:

- Username: `Admin123`
- Password: `Admin123`

## Sumber Data

Data utama dibaca dari file:

```text
alumni.json
```

Lokasi file harus berada di root project:

```text
sistem-pelacakan-alumni-main/alumni.json
```

Jika file `alumni.json` tersedia dan strukturnya benar, maka setelah login data alumni akan dimuat otomatis sebagai sumber pencarian tanpa perlu sinkronisasi manual.

## Struktur Data yang Didukung

File `alumni.json` mendukung array objek alumni dengan kolom seperti:

```json
[
  {
    "nama": "Nama Alumni",
    "nim": "2001123456",
    "fakultas": "Ekonomi",
    "jurusan": "Akuntansi",
    "tahunMasuk": "2020",
    "tanggalLulus": "1 Juli 2024",
    "tahunLulus": "2024",
    "status": "Teridentifikasi",
    "email": "nama@email.com",
    "noHp": "08123456789",
    "linkedin": "",
    "instagram": "",
    "facebook": "",
    "tiktok": "",
    "tempatBekerja": "",
    "alamatBekerja": "",
    "posisi": "",
    "kategoriKarier": "Swasta",
    "sosialTempatKerja": ""
  }
]
```

Kolom bisa lebih banyak, tetapi minimal disarankan ada:

- `nama`
- `nim`
- `fakultas`
- `jurusan`
- `tahunMasuk`
- `tanggalLulus`
- `tahunLulus`
- `status`

## Cara Menjalankan Project

Jalankan semua perintah dari root project:

```powershell
cd "C:\Users\ADMIN\Kuliah SMT 6\Rekayasa Kebutuhan\sistem-pelacakan-alumni-main"
```

### 1. Install dependency frontend

```powershell
npm install --prefix react-dashboard
```

### 2. Jalankan mode development dari root project

```powershell
npm run dev
```

Setelah itu buka:

```text
http://localhost:5173
```

## Build dan Preview

Masih bisa dijalankan dari root project:

```powershell
npm run build
npm run preview
```

## Cara Tes Aplikasi

Langkah yang disarankan untuk pengujian:

1. Pastikan file `alumni.json` ada di root project.
2. Jalankan `npm install --prefix react-dashboard`.
3. Jalankan `npm run dev` dari root project.
4. Buka `http://localhost:5173`.
5. Login dengan akun `Admin123`.
6. Pastikan statistik dashboard berhasil dimuat.
7. Coba fitur pencarian dengan nama, NIM, jurusan, atau email.
8. Pilih salah satu hasil pencarian lalu periksa panel detail alumni.
9. Coba tombol import Excel jika ingin mengganti isi data secara manual.
10. Coba form tambah data alumni untuk memastikan input baru masuk ke sistem.

## Tabel Pengujian

| No | Skenario Pengujian | Langkah Uji | Hasil yang Diharapkan | Status |
|----|--------------------|-------------|------------------------|--------|
| 1 | Menjalankan aplikasi dari root project | Jalankan `npm run dev` dari folder `sistem-pelacakan-alumni-main` | Aplikasi berjalan di `http://localhost:5173` | Berhasil |
| 2 | Login ke sistem | Masukkan username `Admin123` dan password `Admin123` | Pengguna berhasil masuk ke dashboard | Berhasil |
| 3 | Memuat data alumni otomatis | Login ke sistem saat file `alumni.json` tersedia di root project | Statistik dan sumber data aktif tanpa sinkronisasi manual | Berhasil |
| 4 | Menampilkan total alumni | Buka dashboard setelah data berhasil dimuat | Nilai `Total Alumni` sesuai jumlah data pada `alumni.json` | Berhasil |
| 5 | Menahan daftar massal alumni | Masuk ke dashboard tanpa mengisi kolom pencarian | Tabel tidak menampilkan daftar alumni massal | Berhasil |
| 6 | Melakukan pencarian alumni | Isi kolom pencarian dengan nama, NIM, jurusan, atau email | Tabel menampilkan data yang sesuai kata kunci pencarian | Berhasil |
| 7 | Membuka detail alumni | Klik tombol `Lihat Detail` pada salah satu hasil pencarian | Panel detail menampilkan informasi alumni terpilih | Berhasil |
| 8 | Pagination data alumni | Klik tombol `Sebelumnya` dan `Berikutnya` pada area pencarian | Data tabel berpindah halaman sesuai navigasi | Berhasil |
| 9 | Menambah data alumni baru | Isi form tambah data alumni lalu klik `Simpan Data Alumni` | Data baru masuk ke sistem sesuai validasi input | Berhasil |
| 10 | Import data dari file Excel | Klik `Pilih File Excel` lalu pilih file `.xlsx` atau `.xls` | Data pada dashboard diperbarui sesuai isi file Excel | Berhasil |
| 11 | Memuat ulang data utama | Klik tombol `Muat Ulang alumni.json` | Data dashboard kembali mengikuti isi file `alumni.json` | Berhasil |
| 12 | Menampilkan pesan saat data pencarian kosong | Masukkan kata kunci yang tidak ada di data | Tabel menampilkan pesan bahwa data tidak ditemukan | Berhasil |

## Fitur Pencarian

Pencarian dapat digunakan untuk mencari berdasarkan:

- Nama
- NIM
- Fakultas
- Jurusan
- Status
- Email
- No HP
- Tempat bekerja
- Posisi

## Catatan Import Excel

Import Excel tetap tersedia sebagai cadangan jika ingin mengganti isi data tanpa mengubah `alumni.json`.

Format file yang didukung:

- `.xlsx`
- `.xls`

## Catatan Privasi

Data alumni pada sistem ini digunakan untuk kepentingan pembelajaran/internal.  
Dilarang menyebarkan data pribadi alumni untuk kepentingan lain.

## Teknologi

- React
- Vite
- Tailwind CSS

## Catatan Tambahan

- `npm run dev` sudah bisa dijalankan dari root project.
- Jika data tidak berubah, lakukan refresh browser dengan `Ctrl + F5`.
- Jika sebelumnya pernah login dan ada sesi tersimpan, logout lalu login kembali untuk pengujian ulang.
