"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyUserId(data.user?.id || null));

    supabase
      .from("fantasy_teams")
      .select("name, total_points, user_id")
      .order("total_points", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries(data || []);
        setLoading(false);
      });
  }, []);

  const getRankStyle = (i: number) => {
    if (i === 0) return "text-[#FFD700] gold-glow";
    if (i === 1) return "text-gray-400";
    if (i === 2) return "text-amber-700";
    return "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/60">
        <Link href="/" className="font-display text-2xl text-[#00C853] tracking-widest">DRAFT<span className="text-white">ZONE</span></Link>
        <div className="flex gap-4">
          <Link href="/squad" className="text-sm text-gray-400 hover:text-white">My Squad</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display text-6xl tracking-wide mb-2">LEADER<span className="text-[#00C853]">BOARD</span></h1>
        <p className="text-gray-500 text-sm mb-10">Top 100 managers · Updated after each match</p>

        {loading ? (
          <div className="text-[#00C853] font-display text-xl animate-pulse">LOADING...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg mb-4">No teams yet. Be the first!</p>
            <Link href="/squad" className="bg-[#00C853] text-black font-bold px-6 py-3 rounded-lg">Build Your Squad</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = entry.user_id === myUserId;
              return (
                <div key={i} className={`flex items-center gap-4 px-6 py-4 rounded-xl border transition-all ${
                  isMe
                    ? "bg-[#00C853]/10 border-[#00C853]/40 pitch-glow"
                    : "bg-[#111827] border-white/5 hover:border-white/15"
                }`}>
                  {/* Rank */}
                  <span className={`font-display text-2xl w-10 text-center ${getRankStyle(i)}`}>
                    {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}`}
                  </span>

                  {/* Team info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">{entry.name}</p>
                      {isMe && <span className="text-[#00C853] text-xs font-bold bg-[#00C853]/10 px-2 py-0.5 rounded">YOU</span>}
                    </div>
                  </div>

                  {/* Points */}
                  <span className={`font-display text-2xl ${isMe ? "text-[#00C853]" : "text-white"}`}>
                    {entry.total_points}
                    <span className="text-gray-600 text-sm font-sans ml-1">pts</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
