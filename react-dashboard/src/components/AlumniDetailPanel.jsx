function statusTone(status) {
  if (status === "Teridentifikasi") {
    return "border-[#c9e0d6] bg-[#e8f5ef] text-[#2f725b]";
  }

  if (status === "Perlu Verifikasi") {
    return "border-[#eed5b4] bg-[#fff1de] text-[#9c6413]";
  }

  return "border-[#d7dbe4] bg-[#eef1f5] text-[#485468]";
}

function validationTone(status) {
  if (status === "Valid") {
    return "border-[#c9e0d6] bg-[#e8f5ef] text-[#2f725b]";
  }

  if (status === "Perlu Validasi") {
    return "border-[#eed5b4] bg-[#fff1de] text-[#9c6413]";
  }

  return "border-[#d7dbe4] bg-[#eef1f5] text-[#485468]";
}

export default function AlumniDetailPanel({ alumni, isLoading, hasSearchQuery }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#d8ccb9] bg-[#fcfaf6] shadow-[0_20px_40px_rgba(54,38,23,0.06)]">
      <div className="border-b border-[#e5dacb] px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6532]">
          Detail Alumni
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[#16243a]">Panel verifikasi dan akses data</h2>
        <p className="mt-1 text-sm text-slate-600">
          Data sensitif tidak dibuka massal. Pilih alumni dari hasil pencarian untuk melihat detail.
        </p>
      </div>

      {!hasSearchQuery ? (
        <EmptyState
          title="Mulai dari pencarian"
          desc="Masukkan nama, NIM, jurusan, atau email pada kolom pencarian untuk menampilkan hasil yang relevan."
        />
      ) : isLoading ? (
        <EmptyState title="Memuat detail alumni" desc="Mohon tunggu sebentar, sistem sedang menyiapkan data." />
      ) : !alumni ? (
        <EmptyState
          title="Belum ada alumni terpilih"
          desc="Klik tombol lihat detail pada hasil pencarian untuk membuka panel informasi alumni."
        />
      ) : (
        <div className="space-y-5 p-5">
          {/* Identity Card */}
          <div className="rounded-[24px] border border-[#eadfce] bg-[#f8f3eb] p-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2">
                <Badge text={alumni.status || "Belum Dilacak"} className={statusTone(alumni.status)} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#16243a]">{alumni.name || alumni.nama}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {fallbackText(alumni.nim)} · {fallbackText(alumni.fakultas)} · {fallbackText(alumni.jurusan)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Masuk {fallbackText(alumni.tahunMasuk)} · Lulus {fallbackText(alumni.tahunLulus)}
                </p>
              </div>
            </div>
          </div>

          {/* Search Buttons - Quick Lookup (generated from name) */}
          {(() => {
            const alumniName = alumni.name || alumni.nama || "";
            const nameEnc = encodeURIComponent(alumniName);
            const baseEnc = encodeURIComponent(`${alumniName} Universitas Muhammadiyah Malang`);
            const urls = {
              google: `https://www.google.com/search?q=${baseEnc}`,
              linkedin: `https://www.google.com/search?q=${nameEnc}+site%3Alinkedin.com+%22Universitas+Muhammadiyah+Malang%22`,
              instagram: `https://www.google.com/search?q=${nameEnc}+site%3Ainstagram.com+UMM`,
              facebook: `https://www.google.com/search?q=${nameEnc}+site%3Afacebook.com+%22Universitas+Muhammadiyah+Malang%22`,
              pddikti: `https://pddikti.kemdiktisaintek.go.id/search/mhs/${nameEnc}`,
            };
            return (
              <div className="rounded-[24px] border border-[#d0e8f5] bg-[#edf6fc] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
                  🔍 Cari Alumni di Internet
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Klik tombol di bawah untuk mencari data alumni di platform masing-masing.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SearchButton label="🔍 Google" url={urls.google} color="bg-[#4285f4] hover:bg-[#3275e4]" />
                  <SearchButton label="💼 LinkedIn" url={urls.linkedin} color="bg-[#0077b5] hover:bg-[#006699]" />
                  <SearchButton label="📷 Instagram" url={urls.instagram} color="bg-[#e1306c] hover:bg-[#c2255c]" />
                  <SearchButton label="📘 Facebook" url={urls.facebook} color="bg-[#1877f2] hover:bg-[#1565c0]" />
                  <SearchButton label="🎓 PDDIKTI" url={urls.pddikti} color="bg-[#059669] hover:bg-[#047857]" />
                </div>
              </div>
            );
          })()}

          {/* Contact & Social Media */}
          <DetailGroup
            title="Kontak dan Sosial Media"
            desc="Kontak detail hanya dibuka penuh untuk data yang sudah teridentifikasi."
            items={[
              ["Email", alumni.email],
              ["No HP", alumni.noHp],
              ["LinkedIn", alumni.linkedin],
              ["Instagram", alumni.instagram],
              ["Facebook", alumni.facebook],
              ["TikTok", alumni.tiktok]
            ]}
          />

          {/* Employment Data */}
          <DetailGroup
            title="Data Pekerjaan"
            desc="Informasi pekerjaan mendukung proses validasi dan verifikasi tracer alumni."
            items={[
              ["Tempat Bekerja", alumni.tempatBekerja],
              ["Posisi", alumni.posisi],
              ["Kategori Karier", alumni.kategoriKarier],
              ["Alamat Bekerja", alumni.alamatBekerja],
              ["Sosial Media Tempat Kerja", alumni.sosialTempatKerja || alumni.workplace_social]
            ]}
          />
        </div>
      )}
    </section>
  );
}

function SearchButton({ label, url, color }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-white transition ${color}`}
    >
      {label}
    </a>
  );
}

function EmptyState({ title, desc }) {
  return (
    <div className="p-5">
      <div className="rounded-[24px] border border-dashed border-[#d8ccb9] bg-[#f8f3eb] px-4 py-8 text-center">
        <p className="text-base font-semibold text-[#16243a]">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{desc}</p>
      </div>
    </div>
  );
}

function Notice({ text }) {
  return (
    <div className="rounded-[22px] border border-[#d8e7df] bg-[#f1f8f4] px-4 py-3 text-sm leading-6 text-[#2f725b]">
      {text}
    </div>
  );
}

function DetailGroup({ title, desc, items }) {
  return (
    <div className="rounded-[24px] border border-[#eadfce] bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8a6532]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>

      <div className="mt-4 grid gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[#efe5d8] bg-[#fcfaf6] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-700">{fallbackText(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Badge({ text, className }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${className}`}>
      {text}
    </span>
  );
}

function fallbackText(value) {
  return value && String(value).trim() ? value : "Belum tersedia";
}
