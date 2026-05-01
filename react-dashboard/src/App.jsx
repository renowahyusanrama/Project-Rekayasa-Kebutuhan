import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import StatCard from "./components/StatCard";
import AlumniTable from "./components/AlumniTable";
import AlumniForm from "./components/AlumniForm";
import AlumniDetailPanel from "./components/AlumniDetailPanel";
import LoginPage from "./components/LoginPage";
import ImportPanel from "./components/ImportPanel";
import { supabase } from "./supabase";

const demoAccounts = [
  { username: "Admin123", password: "Admin123", role: "Administrator" },
];

const PAGE_SIZE = 50;

const fallbackStats = [
  { label: "Total Alumni", value: 0 },
  { label: "Alumni Teridentifikasi", value: 0 },
  { label: "Perlu Verifikasi", value: 0 },
  { label: "Kontak Tersedia", value: 0 },
];

function getStoredSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("alumni-auth");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function App() {
  const [session, setSession] = useState(getStoredSession);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(fallbackStats);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  // 🔥 SEARCH FIXED
  useEffect(() => {
    if (!session) return;

    const timeout = setTimeout(async () => {
      const keyword = searchQuery.trim();

      if (!keyword) {
        setRows([]);
        setTotalCount(0);
        setTotalPages(1);
        return;
      }

      setIsDataLoading(true);

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, count, error } = await supabase
        .from("alumni")
        .select("*", { count: "exact" })
        .or(`name.ilike.%${keyword}%,nim.ilike.%${keyword}%`)
        .range(from, to);

      console.log("QUERY RESULT:", data, error);

      if (!error) {
        setRows(data || []);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));

        setStats([
          { label: "Total Alumni", value: count || 0 },
          { label: "Alumni Teridentifikasi", value: "-" },
          { label: "Perlu Verifikasi", value: "-" },
          { label: "Kontak Tersedia", value: "-" },
        ]);
      } else {
        console.error(error);
      }

      setIsDataLoading(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, currentPage, session]);

  // 🔥 DETAIL
  const handleSelectAlumni = async (id) => {
    setSelectedId(id);
    setIsDetailLoading(true);

    const { data } = await supabase
      .from("alumni")
      .select("*")
      .eq("id", id)
      .single();

    setSelectedAlumni(data);
    setIsDetailLoading(false);
  };

  // 🔐 LOGIN
  const handleLogin = async ({ username, password }) => {
    const matchedAccount = demoAccounts.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (!matchedAccount)
      return { ok: false, message: "Username atau password salah." };

    const nextSession = {
      username: matchedAccount.username,
      role: matchedAccount.role,
    };

    setSession(nextSession);
    localStorage.setItem("alumni-auth", JSON.stringify(nextSession));

    return { ok: true };
  };

  const handleLogout = () => {
    setSession(null);
    setSearchQuery("");
    setCurrentPage(1);
    setRows([]);
    setSelectedId(null);
    setSelectedAlumni(null);
    localStorage.removeItem("alumni-auth");
  };

  const hasSearchQuery = searchQuery.trim().length > 0;

  const pageSummary = useMemo(() => {
    if (!hasSearchQuery) return "Masukkan kata kunci pencarian.";
    if (totalCount === 0) return "Tidak ada alumni ditemukan.";
    return `Menampilkan ${rows.length} data dari total ${totalCount}`;
  }, [hasSearchQuery, totalCount, rows.length]);

  if (!session) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-[#f4efe8] text-slate-900">
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <Header
          currentUser={session}
          onLogout={handleLogout}
          searchQuery={searchQuery}
          setSearchQuery={(q) => {
            setSearchQuery(q);
            setCurrentPage(1);
            setSelectedId(null);
            setSelectedAlumni(null);
          }}
        />

        <div className="mt-6">
          <AlumniTable
            data={rows}
            selectedId={selectedId}
            onSelect={handleSelectAlumni}
            hasSearchQuery={hasSearchQuery}
          />

          <div className="mt-4 flex justify-between">
            <span>{pageSummary}</span>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <AlumniDetailPanel
          alumni={selectedAlumni}
          isLoading={isDetailLoading}
          hasSearchQuery={hasSearchQuery}
        />
      </div>
    </div>
  );
}