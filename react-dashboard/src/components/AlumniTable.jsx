const statusStyles = {
  "Belum Dilacak": "border-[#d7dbe4] bg-[#eef1f5] text-[#485468]",
  "Perlu Verifikasi": "border-[#eed5b4] bg-[#fff1de] text-[#9c6413]",
  Teridentifikasi: "border-[#c9e0d6] bg-[#e8f5ef] text-[#2f725b]"
};

function getInitials(name) {
  if (!name) return "--";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function safe(value) {
  return value && String(value).trim() ? value : "-";
}

export default function AlumniTable({ data = [], selectedId, onSelect, hasSearchQuery }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-[#d8ccb9] bg-[#fcfaf6] shadow-[0_20px_40px_rgba(54,38,23,0.06)]">
      
      <div className="border-b border-[#e5dacb] px-5 py-5">
        <h2 className="text-xl font-semibold text-[#16243a]">Hasil Pencarian Alumni</h2>
        <p className="mt-1 text-sm text-slate-600">
          Hasil pencarian menampilkan ringkasan akademik.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          
          {/* HEADER */}
          <thead className="bg-[#f7f1e8]">
            <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th className="px-4 py-3">Nama</th>
              <th className="px-3 py-3">NIM</th>
              <th className="px-3 py-3">Tahun Masuk</th>
              <th className="px-3 py-3">Tahun Lulus</th>
              <th className="px-3 py-3">Fakultas</th>
              <th className="px-3 py-3">Jurusan</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {!hasSearchQuery ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-sm text-slate-500">
                  Masukkan kata kunci pencarian terlebih dahulu.
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-10 text-center text-sm text-slate-500">
                  Tidak ada data alumni ditemukan.
                </td>
              </tr>
            ) : (
              data.map((item, index) => {
                const isSelected = String(item.id) === String(selectedId);

                return (
                  <tr key={item.id} className="border-t text-sm">
                    
                    {/* NAMA */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center bg-[#1d2d47] text-white rounded-xl">
                          {getInitials(item.name)}
                        </div>
                        <div>
                          <div className="font-semibold">{safe(item.name)}</div>
                          <div className="text-xs text-gray-400">#{index + 1}</div>
                        </div>
                      </div>
                    </td>

                    {/* DATA */}
                    <td className="px-3 py-4">{safe(item.nim)}</td>
                    <td className="px-3 py-4">{safe(item.tahunMasuk)}</td>
                    <td className="px-3 py-4">{safe(item.tahunLulus)}</td>
                    <td className="px-3 py-4">{safe(item.fakultas)}</td>
                    <td className="px-3 py-4">{safe(item.jurusan)}</td>

                    {/* BUTTON */}
                    <td className="px-4 py-4">
                      <button
                        onClick={() => onSelect(item.id)}
                        className={`px-3 py-2 rounded-lg border ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-white hover:bg-gray-100"
                        }`}
                      >
                        {isSelected ? "Terpilih" : "Detail"}
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>

        </table>
      </div>
    </section>
  );
}