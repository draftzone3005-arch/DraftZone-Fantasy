"use client";
import { useEffect, useState } from "react";
import { supabase, Player } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      const { data: teamData } = await supabase
        .from("fantasy_teams").select("*").eq("user_id", data.user.id).single();

      if (!teamData) { router.push("/squad"); return; }
      setTeam(teamData);

      if (teamData.players?.length > 0) {
        const { data: playersData } = await supabase
          .from("players").select("*").in("id", teamData.players);
        setPlayers(playersData || []);
      }

      // Get rank
      const { data: allTeams } = await supabase
        .from("fantasy_teams").select("user_id, total_points").order("total_points", { ascending: false });

      if (allTeams) {
        const r = allTeams.findIndex(t => t.user_id === data.user.id) + 1;
        setRank(r);
      }

      setLoading(false);
    });
  }, [router]);

  const byPosition = (pos: string) => players.filter(p => p.position === pos);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#00C853] font-display text-2xl animate-pulse">LOADING...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/60">
        <Link href="/" className="font-display text-2xl text-[#00C853] tracking-widest">DRAFT<span className="text-white">ZONE</span></Link>
        <div className="flex gap-4 items-center">
          <Link href="/squad" className="text-sm text-gray-400 hover:text-white">Edit Squad</Link>
          <Link href="/leaderboard" className="text-sm text-gray-400 hover:text-white">Leaderboard</Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))} className="text-sm text-gray-500 hover:text-white">Sign out</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-5xl tracking-wide mb-1">{team?.name || "MY TEAM"}</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "TOTAL POINTS", value: team?.total_points || 0, color: "text-[#00C853]" },
            { label: "WORLD RANK", value: rank ? `#${rank}` : "—", color: "text-[#FFD700]" },
            { label: "PLAYERS", value: players.length, color: "text-white" },
            { label: "AVG PTS/PLAYER", value: players.length ? Math.round((team?.total_points || 0) / players.length) : 0, color: "text-white" },
          ].map(s => (
            <div key={s.label} className="bg-[#111827] pitch-border rounded-xl p-6 text-center">
              <div className={`font-display text-4xl ${s.color} mb-1`}>{s.value}</div>
              <div className="text-gray-500 text-xs tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Players by position */}
        {(["GK", "DF", "MF", "FW"] as const).map(pos => {
          const posPlayers = byPosition(pos);
          if (!posPlayers.length) return null;
          const labels: Record<string, string> = { GK: "Goalkeepers", DF: "Defenders", MF: "Midfielders", FW: "Forwards" };
          const colors: Record<string, string> = { GK: "text-yellow-400", DF: "text-blue-400", MF: "text-green-400", FW: "text-red-400" };
          return (
            <div key={pos} className="mb-8">
              <h2 className={`font-display text-2xl ${colors[pos]} mb-4 tracking-wide`}>{labels[pos]}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {posPlayers.map(p => (
                  <div key={p.id} className="bg-[#111827] pitch-border rounded-xl p-4 player-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{p.team}</p>
                      </div>
                      <span className="text-[#00C853] font-display text-2xl">{p.fantasy_points}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "G", val: p.goals },
                        { label: "A", val: p.assists },
                        { label: "CS", val: p.clean_sheets },
                      ].map(stat => (
                        <div key={stat.label} className="bg-[#0A0A0A] rounded-lg py-1.5">
                          <div className="text-white text-sm font-bold">{stat.val}</div>
                          <div className="text-gray-600 text-xs">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="mt-6 flex gap-3">
          <Link href="/squad" className="bg-[#111827] border border-white/10 text-white text-sm font-bold px-6 py-3 rounded-lg hover:border-white/30 transition-all">
            Edit Squad
          </Link>
          <Link href="/leaderboard" className="bg-[#00C853] text-black text-sm font-bold px-6 py-3 rounded-lg hover:bg-[#00a844] transition-all">
            Full Leaderboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
