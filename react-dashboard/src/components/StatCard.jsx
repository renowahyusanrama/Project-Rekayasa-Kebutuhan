const themes = {
  "Total Alumni": {
    card: "border-[#d8ccb9] bg-[#fcfaf6]",
    accent: "bg-[#c2924d]",
    badge: "bg-[#efe4d2] text-[#8a6532]"
  },
  "Alumni Teridentifikasi": {
    card: "border-[#cddfd7] bg-[#f4faf7]",
    accent: "bg-[#4a8a73]",
    badge: "bg-[#e4f2ec] text-[#3d735f]"
  },
  "Perlu Verifikasi": {
    card: "border-[#ead6b9] bg-[#fff8ef]",
    accent: "bg-[#dc9430]",
    badge: "bg-[#fcefdc] text-[#9e6a1e]"
  },
  "Kontak Tersedia": {
    card: "border-[#d9dde5] bg-[#f8f9fc]",
    accent: "bg-[#51627a]",
    badge: "bg-[#eef1f5] text-[#4c596d]"
  },
  "Belum Dilacak": {
    card: "border-[#d9dde5] bg-[#f8f9fc]",
    accent: "bg-[#67758b]",
    badge: "bg-[#eef1f5] text-[#4c596d]"
  }
};

export default function StatCard({ label, value }) {
  const theme = themes[label] ?? themes["Total Alumni"];

  return (
    <article
      className={`rounded-[24px] border p-5 shadow-[0_18px_32px_rgba(54,38,23,0.06)] ${theme.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.badge}`}
          >
            Statistik
          </span>
          <h2 className="mt-4 text-sm font-semibold leading-6 text-slate-700">{label}</h2>
        </div>
        <span className={`mt-1 h-3 w-3 rounded-full ${theme.accent}`} />
      </div>

      <p className="mt-8 text-4xl font-semibold tracking-tight text-[#16243a]">{value}</p>
    </article>
  );
}
