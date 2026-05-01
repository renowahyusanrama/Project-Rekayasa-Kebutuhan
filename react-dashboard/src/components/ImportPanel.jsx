export default function ImportPanel({ info, onImport, onReset, isSyncing }) {
  const toneClass =
    info.type === "error"
      ? "border-[#f1d0cf] bg-[#fff2f2] text-[#9f413d]"
      : info.type === "success"
        ? "border-[#cfe5da] bg-[#eff8f3] text-[#2f725b]"
        : "border-[#e2d7c8] bg-[#fcfaf6] text-slate-600";

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    event.target.value = "";
  };

  return (
    <section className="mt-5 rounded-[24px] border border-[#dccdba] bg-[#fcfaf6] p-5 shadow-[0_16px_30px_rgba(54,38,23,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a6532]">
            Sumber Data
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#16243a]">Data alumni dimuat otomatis dari file lokal</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Aplikasi membaca `alumni.json` yang berada di luar folder `react-dashboard`. Data tidak dibuka
            massal, tetapi dipakai sebagai sumber pencarian dan verifikasi alumni.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[#d9c9b1] bg-[#f6eedf] px-4 py-3 text-sm font-semibold text-[#7b5a2b] transition hover:brightness-95">
            Pilih File Excel
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </label>

          <button
            type="button"
            onClick={onReset}
            className="rounded-2xl border border-[#d9dde5] bg-[#f5f7fb] px-4 py-3 text-sm font-semibold text-[#485468] transition hover:brightness-95"
          >
            Muat Ulang alumni.json
          </button>
        </div>
      </div>

      <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>
        {isSyncing ? "Sedang memuat data..." : info.message}
      </div>

      <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <div className="rounded-2xl border border-[#eadfce] bg-[#f8f3eb] px-4 py-3">
          File utama yang dibaca otomatis:
          `../alumni.json` dari sudut pandang folder `react-dashboard`.
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-[#f8f3eb] px-4 py-3">
          Struktur yang didukung:
          array objek alumni dengan kolom seperti `nama`, `nim`, `fakultas`, `jurusan`, `tahunMasuk`,
          `tahunLulus`, `status`, `email`, `noHp`, dan kolom kontak lain.
        </div>
      </div>
    </section>
  );
}
