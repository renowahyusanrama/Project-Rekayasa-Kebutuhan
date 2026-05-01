import { useState } from "react";

const initialState = {
  nama: "",
  nim: "",
  jurusan: "",
  fakultas: "",
  tahunMasuk: "",
  tanggalLulus: "",
  tahunLulus: "",
  status: "Belum Dilacak",
  linkedin: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  email: "",
  noHp: "",
  tempatBekerja: "",
  alamatBekerja: "",
  posisi: "",
  kategoriKarier: "Swasta",
  sosialTempatKerja: ""
};

function validateFormData(formData) {
  const email = formData.email.trim();
  const noHp = formData.noHp.replace(/[^\d+]/g, "");
  const hasContactData =
    Boolean(email) ||
    Boolean(noHp) ||
    Boolean(formData.linkedin.trim()) ||
    Boolean(formData.instagram.trim()) ||
    Boolean(formData.facebook.trim()) ||
    Boolean(formData.tiktok.trim());
  const hasWorkData =
    Boolean(formData.tempatBekerja.trim()) ||
    Boolean(formData.alamatBekerja.trim()) ||
    Boolean(formData.posisi.trim()) ||
    Boolean(formData.sosialTempatKerja.trim());

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Format email belum valid.";
  }

  if (formData.noHp.trim() && noHp.length < 8) {
    return "Nomor HP minimal 8 digit.";
  }

  if (!/^\d{4}$/.test(formData.tahunMasuk)) {
    return "Tahun masuk harus 4 digit.";
  }

  if (!/^\d{4}$/.test(formData.tahunLulus)) {
    return "Tahun lulus harus 4 digit.";
  }

  if (Number(formData.tahunLulus) < Number(formData.tahunMasuk)) {
    return "Tahun lulus tidak boleh lebih kecil dari tahun masuk.";
  }

  if (formData.status === "Perlu Verifikasi" && !hasContactData && !hasWorkData) {
    return "Status Perlu Verifikasi sebaiknya disertai minimal satu data kontak atau pekerjaan.";
  }

  if (formData.status === "Teridentifikasi" && !hasContactData) {
    return "Status Teridentifikasi memerlukan minimal satu data kontak yang bisa ditelusuri.";
  }

  return "";
}

export default function AlumniForm({ onSubmit }) {
  const [formData, setFormData] = useState(initialState);
  const [formError, setFormError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormError("");
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const error = validateFormData(formData);
    if (error) {
      setFormError(error);
      return;
    }

    onSubmit(formData);
    setFormData(initialState);
    setFormError("");
  };

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#cfd7e2] bg-[#182741] text-white shadow-[0_20px_40px_rgba(24,39,65,0.18)]">
      <div className="border-b border-white/10 px-5 py-5">
        <h2 className="text-lg font-semibold">Tambah Data Alumni</h2>
        <p className="mt-1 text-sm text-slate-300">
          Simpan data kontak, sosial media, dan pekerjaan alumni yang sudah tersedia.
        </p>
      </div>

      <form className="space-y-5 p-5" onSubmit={handleSubmit}>
        <GroupTitle title="Data Alumni" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nama" name="nama" placeholder="Contoh: Rina Putri" value={formData.nama} onChange={handleChange} required />
          <Input label="NIM" name="nim" placeholder="Contoh: 2001123456" value={formData.nim} onChange={handleChange} />
          <Input label="Jurusan" name="jurusan" placeholder="Contoh: Teknik Informatika" value={formData.jurusan} onChange={handleChange} required />
          <Input label="Fakultas" name="fakultas" placeholder="Contoh: Teknik" value={formData.fakultas} onChange={handleChange} />
          <Input
            label="Tahun Masuk"
            name="tahunMasuk"
            placeholder="Contoh: 2020"
            value={formData.tahunMasuk}
            onChange={handleChange}
            required
            inputMode="numeric"
            maxLength={4}
          />
          <Input
            label="Tanggal Lulus"
            name="tanggalLulus"
            placeholder="Contoh: 1 Juli 2024"
            value={formData.tanggalLulus}
            onChange={handleChange}
            required
          />
          <Input
            label="Tahun Lulus"
            name="tahunLulus"
            placeholder="Contoh: 2024"
            value={formData.tahunLulus}
            onChange={handleChange}
            required
            inputMode="numeric"
            maxLength={4}
          />
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={["Belum Dilacak", "Perlu Verifikasi", "Teridentifikasi"]}
          />
        </div>

        <GroupTitle title="Kontak dan Sosial Media" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Contoh: nama@email.com"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="No HP"
            name="noHp"
            placeholder="Contoh: 08123456789"
            value={formData.noHp}
            onChange={handleChange}
            inputMode="numeric"
          />
          <Input label="LinkedIn" name="linkedin" placeholder="URL atau username LinkedIn" value={formData.linkedin} onChange={handleChange} />
          <Input label="Instagram" name="instagram" placeholder="@username atau URL" value={formData.instagram} onChange={handleChange} />
          <Input label="Facebook" name="facebook" placeholder="URL atau nama akun" value={formData.facebook} onChange={handleChange} />
          <Input label="TikTok" name="tiktok" placeholder="@username atau URL" value={formData.tiktok} onChange={handleChange} />
        </div>

        <GroupTitle title="Data Pekerjaan" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Tempat Bekerja" name="tempatBekerja" placeholder="Contoh: PT Nusantara Data" value={formData.tempatBekerja} onChange={handleChange} />
          <Input label="Posisi" name="posisi" placeholder="Contoh: Staff Keuangan" value={formData.posisi} onChange={handleChange} />
          <Input label="Alamat Bekerja" name="alamatBekerja" placeholder="Alamat kantor atau instansi" value={formData.alamatBekerja} onChange={handleChange} />
          <Input label="Sosial Media Tempat Kerja" name="sosialTempatKerja" placeholder="IG, LinkedIn, website, atau URL" value={formData.sosialTempatKerja} onChange={handleChange} />
          <Select
            label="Kategori Karier"
            name="kategoriKarier"
            value={formData.kategoriKarier}
            onChange={handleChange}
            options={["PNS", "Swasta", "Wirausaha"]}
          />
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge text="Kontak" />
            <Badge text="Sosial Media" />
            <Badge text="Pekerjaan" />
            <Badge text="Validasi" />
          </div>

          <p className="mb-4 text-sm leading-6 text-slate-300">
            Gunakan status <span className="font-semibold text-white">Teridentifikasi</span> hanya jika minimal ada jejak kontak yang layak dan data sudah ditinjau.
          </p>

          {formError ? (
            <div className="mb-4 rounded-2xl border border-[#f0b7b3] bg-[#4b1f24] px-4 py-3 text-sm text-[#ffe4e1]">
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#f6d79d,#f4aa22)] px-4 py-3 text-sm font-semibold text-[#16243a] transition hover:brightness-105"
          >
            Simpan Data Alumni
          </button>
        </div>
      </form>
    </section>
  );
}

function GroupTitle({ title }) {
  return (
    <div className="border-b border-white/10 pb-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8c39f]">{title}</p>
    </div>
  );
}

function Badge({ text }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
      {text}
    </span>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-2 text-xs text-slate-300">
      <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <select
        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8c39f] focus:bg-white/15"
        name={name}
        value={value}
        onChange={onChange}
      >
        {options.map((option) => (
          <option key={option} value={option} className="text-slate-900">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
  inputMode,
  maxLength
}) {
  return (
    <label className="flex flex-col gap-2 text-xs text-slate-300">
      <span className="font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <input
        className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-[#d8c39f] focus:bg-white/15"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
      />
    </label>
  );
}
