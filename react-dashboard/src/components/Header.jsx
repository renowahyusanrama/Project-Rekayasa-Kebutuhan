const todayLabel = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(new Date());

export default function Header({ currentUser, onLogout, searchQuery, setSearchQuery, onSearch }) {
  return (
    <header className="overflow-hidden rounded-[28px] border border-[#dccdba] bg-[#fcfaf6] shadow-[0_20px_40px_rgba(54,38,23,0.08)]">
      <div className="bg-[linear-gradient(135deg,#16243a,#223654,#35516f)] px-5 py-6 text-white lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d9c6a3]">
              Sistem Pelacakan Alumni
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Pelacakan Mahasiswa</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Pencarian alumni, validasi data, dan akses detail terkontrol dengan login internal.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Tanggal</p>
              <p className="mt-1 text-sm font-semibold text-white">{todayLabel}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Login sebagai</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {currentUser.role} · {currentUser.username}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="rounded-2xl border border-white/15 bg-[#f6d79d] px-4 py-3 text-sm font-semibold text-[#16243a] transition hover:brightness-105"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Hero Search Row */}
        <div className="mt-6 w-full">
          <div className="mx-auto max-w-[900px]">
            <div className="flex items-center gap-3 rounded-full bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
              <select
                onChange={() => {}}
                className="rounded-full bg-transparent px-4 py-3 text-sm outline-none border-none"
              >
                <option>SEMUA</option>
              </select>
              <input
                id="searchName"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onSearch?.(searchQuery);
                  }
                }}
                placeholder="Cari berdasarkan Nama/NIM..."
                className="flex-1 rounded-full border-none bg-transparent px-4 py-3 text-sm text-slate-900 outline-none"
              />
              <button
                id="searchBtn"
                className="rounded-full bg-[#e6f6f5] px-4 py-2 text-sm font-semibold"
                onClick={() => onSearch?.(searchQuery)}
              >
                🔍
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-4 text-sm text-slate-600 lg:grid-cols-3 lg:px-6">
        <div className="rounded-2xl border border-[#eadfce] bg-[#f8f3eb] px-4 py-3">
          Data alumni dimuat untuk kebutuhan internal, tetapi tidak dibuka sebagai daftar massal.
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-[#f8f3eb] px-4 py-3">
          Gunakan pencarian dan panel detail untuk memeriksa status validasi serta verifikasi alumni.
        </div>
        <div className="rounded-2xl border border-[#eadfce] bg-[#f8f3eb] px-4 py-3">
          Sistem login ini untuk demo frontend; pengamanan produksi tetap memerlukan backend.
        </div>
      </div>
    </header>
  );
}
