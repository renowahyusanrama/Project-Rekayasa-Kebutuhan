Canonical data schema and field mapping

Purpose
- Define canonical field names, aliases supported by the pipeline, and output CSV structure.

Canonical fields (output):
- id: numeric unique id
- name: full name (string)
- nim: student id (string)
- fakultas: faculty (string)
- jurusan: study program (string)
- tahunMasuk: tahun masuk (string)
- tahunLulus: tahun lulus (string)
- status: pelacakan status (string)
- email: primary email (string)
- noHp: phone number (string)
- linkedin: linkedin profile url (string)
- instagram: instagram username/url (string)
- facebook: facebook username/url (string)
- tiktok: tiktok username/url (string)
- tempatBekerja: employer name (string)
- alamatBekerja: workplace address (string)
- posisi: position / job title (string)
- kategoriKarier: category (PNS|Swasta|Wirausaha) (string)
- workplace_social: social media of workplace (string)

Aliases supported (examples)
- nim: nim, NIM, studentId, student_id, student id
- name: nama, Nama Lulusan, fullName
- email: email, e-mail
- phone: phone, noHp, nomor_hp

Notes
- The pipeline attempts to read `data/alumni.json` (preferred) and fallbacks including `public/alumni.json`.
- Output files are written to `data/` (JSON) and `outputs/` (CSV/JSON reports).
