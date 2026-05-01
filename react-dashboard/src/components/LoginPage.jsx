import { useState } from "react";

export default function LoginPage({ onLogin }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await onLogin(credentials);

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    setError("");
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#142237,#253856,#f3ede4)] px-4 py-10">
      <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-[1.1fr_420px]">
        <section className="rounded-[32px] border border-white/10 bg-[#15243a]/90 p-8 text-white shadow-[0_30px_70px_rgba(0,0,0,0.24)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d8c39f]">
            Sistem Pelacakan Alumni
          </p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight">
            Portal internal untuk pengelolaan data alumni berbasis login.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            Gunakan sistem ini hanya untuk pembelajaran internal. Data pribadi alumni tidak boleh
            disebarkan di luar kebutuhan tugas.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FeatureCard
              title="Login terlebih dahulu"
              desc="Akses dashboard dibatasi dengan autentikasi demo pada sisi frontend."
            />
            <FeatureCard
              title="Akses data bertahap"
              desc="Dashboard membuka pencarian lebih dulu, lalu detail alumni ditampilkan setelah dipilih."
            />
            <FeatureCard
              title="Privasi internal"
              desc="Gunakan hanya data yang sudah tersedia atau sudah mendapat izin."
            />
            <FeatureCard
              title="Siap input manual"
              desc="Sistem siap menerima data tambahan melalui form dengan validasi dasar."
            />
          </div>
        </section>

        <section className="rounded-[32px] border border-[#dccdba] bg-[#fcfaf6] p-6 shadow-[0_24px_60px_rgba(54,38,23,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6532]">Login Sistem</p>
          <h2 className="mt-3 text-2xl font-semibold text-[#16243a]">Masuk ke Dashboard</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Gunakan akun yang diberikan untuk membuka sistem.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Masukkan username"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Masukkan password"
            />

            {error ? (
              <div className="rounded-2xl border border-[#f2d0cf] bg-[#fff1f1] px-4 py-3 text-sm text-[#a03e3b]">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#f6d79d,#f4aa22)] px-4 py-3 text-sm font-semibold text-[#16243a] transition hover:brightness-105"
            >
              {isSubmitting ? "Masuk dan memuat data..." : "Login"}
            </button>
          </form>

          <div className="mt-6 rounded-[24px] border border-[#eadfce] bg-[#f8f3eb] p-4">
            <p className="text-sm font-semibold text-[#7b5a2b]">Catatan demo</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Proteksi ini berjalan di frontend untuk kebutuhan tugas. Untuk keamanan sungguhan, tetap
              perlu backend, hashing password, dan manajemen sesi server.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{desc}</p>
    </div>
  );
}

function Input({ label, name, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <input
        className="rounded-2xl border border-[#dfd3c4] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#c2924d]"
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
    </label>
  );
}
