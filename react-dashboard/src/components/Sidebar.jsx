const menuItems = [
  { title: "Beranda Dashboard", desc: "Ringkasan statistik alumni dan tingkat ketersediaan kontak" },
  { title: "Pencarian Alumni", desc: "Cari alumni tertentu tanpa membuka data sensitif secara massal" },
  { title: "Input Data", desc: "Form untuk menambah atau melengkapi data alumni yang sudah diizinkan" }
];

const notes = [
  "Masukkan hanya data yang sudah Anda miliki atau sudah mendapat izin.",
  "Gunakan status Perlu Verifikasi sebelum menaikkan data menjadi Teridentifikasi.",
  "Jangan sebarkan email, nomor HP, atau alamat kerja di luar kebutuhan pembelajaran."
];

export default function Sidebar() {
  return (
    <aside className="rounded-[28px] border border-[#cfd7e2] bg-[#182741] p-4 text-white shadow-[0_20px_40px_rgba(24,39,65,0.18)]">
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8c39f]">
          Panel Samping
        </p>
        <h2 className="mt-3 text-xl font-semibold">Tracer Study</h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Panel informasi tetap seperti sebelumnya, tetapi sekarang menekankan privasi, validasi, dan verifikasi data.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {menuItems.map((item, index) => (
          <div
            key={item.title}
            className={`rounded-[22px] border p-4 ${
              index === 0 ? "border-[#d8c39f]/40 bg-[#d8c39f]/10" : "border-white/10 bg-white/5"
            }`}
          >
            <p className="text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-[#121d31] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Catatan privasi</p>
        <div className="mt-4 space-y-3">
          {notes.map((note) => (
            <div key={note} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm leading-6 text-slate-300">
              {note}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
