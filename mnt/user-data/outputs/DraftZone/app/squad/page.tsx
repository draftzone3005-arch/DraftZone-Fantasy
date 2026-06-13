"use client";
import { useEffect, useState } from "react";
import { supabase, Player } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

const POSITION_LIMITS = { GK: 2, DF: 5, MF: 5, FW: 3 };
const POSITION_COLORS: Record<string, string> = {
  GK: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  DF: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  MF: "text-green-400 border-green-400/30 bg-green-400/10",
  FW: "text-red-400 border-red-400/30 bg-red-400/10",
};

export default function SquadPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState<string>("ALL");
  const [filterTeam, setFilterTeam] = useState<string>("ALL");
  const [teamName, setTeamName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push("/auth"); return; }
      setUser(data.user);

      // Load existing team
      supabase.from("fantasy_teams").select("*").eq("user_id", data.user.id).single()
        .then(({ data: team }) => {
          if (team) {
            setTeamName(team.name);
            setSelected(team.players || []);
            setSaved(true);
          }
        });
    });

    supabase.from("players").select("*").order("team").then(({ data }) => {
      setPlayers(data || []);
      setLoading(false);
    });
  }, [router]);

  const teams = [...new Set(players.map(p => p.team))].sort();

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());
    const matchPos = filterPos === "ALL" || p.position === filterPos;
    const matchTeam = filterTeam === "ALL" || p.team === filterTeam;
    return matchSearch && matchPos && matchTeam;
  });

  const positionCount = (pos: string) => selected.filter(id => {
    const p = players.find(pl => pl.id === id);
    return p?.position === pos;
  }).length;

  const canAdd = (player: Player) => {
    if (selected.includes(player.id)) return true;
    if (selected.length >= 15) return false;
    const limit = POSITION_LIMITS[player.position as keyof typeof POSITION_LIMITS];
    return positionCount(player.position) < limit;
  };

  const toggle = (player: Player) => {
    if (selected.includes(player.id)) {
      setSelected(selected.filter(id => id !== player.id));
    } else if (canAdd(player)) {
      setSelected([...selected, player.id]);
    }
  };

  const handleSave = async () => {
    if (!user || selected.length !== 15 || !teamName.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("fantasy_teams").upsert({
      user_id: user.id,
      name: teamName.trim(),
      players: selected,
      total_points: 0,
    }, { onConflict: "user_id" });

    setSaving(false);
    if (!error) { setSaved(true); router.push("/dashboard"); }
  };

  const selectedPlayers = selected.map(id => players.find(p => p.id === id)!).filter(Boolean);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-[#00C853] font-display text-2xl animate-pulse">LOADING SQUADS...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/60">
        <Link href="/" className="font-display text-2xl text-[#00C853] tracking-widest">DRAFT<span className="text-white">ZONE</span></Link>
        <div className="flex gap-4 items-center">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
          <button onClick={() => supabase.auth.signOut().then(() => router.push("/"))} className="text-sm text-gray-500 hover:text-white">Sign out</button>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-65px)]">
        {/* Left: Player list */}
        <div className="flex-1 p-6">
          <h1 className="font-display text-4xl mb-6 tracking-wide">BUILD YOUR <span className="text-[#00C853]">SQUAD</span></h1>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search player or nation..."
              className="bg-[#111827] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00C853] w-64"
            />
            <div className="flex gap-2">
              {["ALL", "GK", "DF", "MF", "FW"].map(pos => (
                <button key={pos} onClick={() => setFilterPos(pos)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterPos === pos ? "bg-[#00C853] text-black" : "bg-[#111827] text-gray-400 hover:text-white"}`}>
                  {pos}
                </button>
              ))}
            </div>
            <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)}
              className="bg-[#111827] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00C853]">
              <option value="ALL">All Nations</option>
              {teams.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Player grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[65vh] overflow-y-auto pr-2">
            {filtered.map(player => {
              const isSelected = selected.includes(player.id);
              const addable = canAdd(player);
              return (
                <button key={player.id} onClick={() => toggle(player)} disabled={!addable && !isSelected}
                  className={`text-left p-4 rounded-xl border transition-all player-card ${
                    isSelected
                      ? "bg-[#00C853]/15 border-[#00C853]/60 pitch-glow"
                      : addable
                      ? "bg-[#111827] border-white/10 hover:border-white/30"
                      : "bg-[#0d1117] border-white/5 opacity-40 cursor-not-allowed"
                  }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-white">{player.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{player.team}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${POSITION_COLORS[player.position]}`}>
                      {player.position}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#00C853] font-bold text-sm">{player.fantasy_points} pts</span>
                    {isSelected && <span className="text-[#00C853] text-xs">✓ Selected</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: My Squad */}
        <div className="lg:w-80 bg-[#111827] border-l border-white/10 p-6 flex flex-col">
          <h2 className="font-display text-2xl mb-4 tracking-wide">MY <span className="text-[#00C853]">SQUAD</span></h2>

          {/* Team name */}
          <input value={teamName} onChange={e => setTeamName(e.target.value)}
            placeholder="Name your team..."
            className="bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#00C853] mb-4 w-full" />

          {/* Position slots */}
          <div className="space-y-1 mb-4">
            {(["GK", "DF", "MF", "FW"] as const).map(pos => (
              <div key={pos} className="flex items-center justify-between text-xs">
                <span className={`font-bold ${POSITION_COLORS[pos].split(" ")[0]}`}>{pos}</span>
                <span className="text-gray-500">{positionCount(pos)} / {POSITION_LIMITS[pos]}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto mb-4">
            {selectedPlayers.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">No players selected yet</p>
            ) : (
              selectedPlayers.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-[#0A0A0A] rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-xs font-medium text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.team}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${POSITION_COLORS[p.position]}`}>{p.position}</span>
                    <button onClick={() => toggle(p)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Save */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-400">Players selected</span>
              <span className={`font-bold ${selected.length === 15 ? "text-[#00C853]" : "text-white"}`}>{selected.length} / 15</span>
            </div>
            <button onClick={handleSave}
              disabled={selected.length !== 15 || !teamName.trim() || saving}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-all ${
                selected.length === 15 && teamName.trim()
                  ? "bg-[#00C853] text-black hover:bg-[#00a844] pitch-glow"
                  : "bg-white/10 text-gray-500 cursor-not-allowed"
              }`}>
              {saving ? "Saving..." : saved ? "Update Squad" : "Save Squad"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
