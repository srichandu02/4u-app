import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Shield, Users, Flag, Radio, FileText, CheckCircle, Ban, RefreshCw, Search } from "lucide-react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function Admin() {
  const [serviceKey, setServiceKey] = useState("");
  const [client, setClient] = useState(null);
  const [activeTab, setActiveTab] = useState("reports"); // 'reports' | 'users' | 'stats'
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchUserQuery, setSearchUserQuery] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, pendingReports: 0, liveRooms: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const connect = () => {
    if (!serviceKey.trim()) return;
    try {
      const c = createClient(SUPABASE_URL, serviceKey.trim());
      setClient(c);
    } catch (e) {
      setError(e.message || "Failed to initialize client with provided key");
    }
  };

  const loadData = async (c) => {
    setLoading(true);
    setError("");
    try {
      const [
        { data: reportsData },
        { data: usersData },
        { count: userCount },
        { count: postCount },
        { count: reportCount },
        { count: roomCount },
      ] = await Promise.all([
        c.from("reports").select("*, reporter:reporter_id(id,name), reported:reported_id(id,name,banned)").order("created_at", { ascending: false }).limit(100),
        c.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
        c.from("profiles").select("*", { count: "exact", head: true }),
        c.from("posts").select("*", { count: "exact", head: true }),
        c.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        c.from("rooms").select("*", { count: "exact", head: true }).eq("is_live", true),
      ]);

      setReports(reportsData || []);
      setUsers(usersData || []);
      setStats({
        totalUsers: userCount || 0,
        totalPosts: postCount || 0,
        pendingReports: reportCount || 0,
        liveRooms: roomCount || 0,
      });
    } catch (e) {
      setError(e.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client) loadData(client);
  }, [client]);

  const setBanned = async (userId, banned) => {
    if (!client) return;
    await client.from("profiles").update({ banned }).eq("id", userId);
    loadData(client);
  };

  const setReportStatus = async (reportId, status) => {
    if (!client) return;
    await client.from("reports").update({ status }).eq("id", reportId);
    loadData(client);
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-[#0B0A1A] text-[#F5F3FF] flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#13122A] border border-[#363168] rounded-3xl p-6 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#FF5E3A]/20 border border-[#FF5E3A]/40 flex items-center justify-center text-[#FF5E3A] mb-4">
            <Shield size={28} />
          </div>
          <h1 className="text-xl font-bold font-display text-white">4U Staff Admin Portal</h1>
          <p className="text-xs text-[#A6A1CC] mt-1.5 mb-5 leading-relaxed">
            Enter your Supabase Service Role key to access the moderation console and platform metrics.
          </p>

          <input
            type="password"
            value={serviceKey}
            onChange={(e) => setServiceKey(e.target.value)}
            placeholder="service_role secret key"
            className="w-full bg-[#1C1A3A] border border-[#363168] rounded-2xl p-3.5 text-xs text-white outline-none mb-4 focus:border-[#FF5E3A]"
          />

          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

          <button
            onClick={connect}
            disabled={!serviceKey.trim()}
            className="w-full py-3.5 rounded-2xl bg-[#FF5E3A] hover:bg-[#FF7555] text-[#0B0A1A] font-bold text-xs cursor-pointer shadow-lg disabled:opacity-40 transition-all"
          >
            Authenticate Admin
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0B0A1A] text-[#F5F3FF] p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Admin Header */}
        <div className="flex items-center justify-between bg-[#13122A] border border-[#363168] rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF5E3A]/20 border border-[#FF5E3A]/40 flex items-center justify-center text-[#FF5E3A]">
              <Shield size={24} />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white">4U Moderation & Health Console</h1>
              <p className="text-xs text-[#A6A1CC]">Live administrative metrics and user moderation queue</p>
            </div>
          </div>

          <button
            onClick={() => loadData(client)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1C1A3A] hover:bg-[#26234D] border border-[#363168] rounded-full text-xs font-semibold text-[#A6A1CC] hover:text-white cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        {/* Platform Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#13122A] border border-[#363168] rounded-3xl p-4">
            <p className="text-xs text-[#A6A1CC]">Total Users</p>
            <h3 className="text-2xl font-bold text-[#FFAB38] font-mono mt-1">{stats.totalUsers}</h3>
          </div>
          <div className="bg-[#13122A] border border-[#363168] rounded-3xl p-4">
            <p className="text-xs text-[#A6A1CC]">Total Posts</p>
            <h3 className="text-2xl font-bold text-[#10B981] font-mono mt-1">{stats.totalPosts}</h3>
          </div>
          <div className="bg-[#13122A] border border-[#363168] rounded-3xl p-4">
            <p className="text-xs text-[#A6A1CC]">Pending Reports</p>
            <h3 className="text-2xl font-bold text-[#FF5E3A] font-mono mt-1">{stats.pendingReports}</h3>
          </div>
          <div className="bg-[#13122A] border border-[#363168] rounded-3xl p-4">
            <p className="text-xs text-[#A6A1CC]">Live Audio Rooms</p>
            <h3 className="text-2xl font-bold text-[#06B6D4] font-mono mt-1">{stats.liveRooms}</h3>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-[#13122A] rounded-full border border-[#363168] max-w-sm">
          {[
            { id: "reports", label: "Reports Queue", icon: Flag },
            { id: "users", label: "User Management", icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                  active
                    ? "bg-[#FF5E3A] text-[#0B0A1A] shadow-md"
                    : "text-[#A6A1CC] hover:text-white"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="bg-[#13122A] border border-[#363168] rounded-3xl p-5 shadow-xl">
          {activeTab === "reports" && (
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-sm text-white">Incident Reports ({reports.length})</h3>

              {reports.length === 0 ? (
                <p className="text-xs text-[#A6A1CC] text-center py-8">No incident reports filed yet.</p>
              ) : (
                reports.map((r) => (
                  <div key={r.id} className="p-4 rounded-2xl bg-[#1C1A3A] border border-[#363168] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-white">
                        <strong>{r.reporter?.name || "Unknown"}</strong> reported{" "}
                        <strong className="text-[#FFAB38]">{r.reported?.name || "Unknown"}</strong>{" "}
                        <span className="text-[#A6A1CC]">· Context: {r.context}</span>
                      </p>
                      <p className="text-xs text-[#A6A1CC] mt-1 bg-[#0B0A1A] p-2 rounded-xl border border-[#363168]">
                        Reason: {r.reason}
                      </p>
                      <p className="text-[10px] text-[#A6A1CC] mt-1">{new Date(r.created_at).toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {r.reported?.banned ? (
                        <button
                          onClick={() => setBanned(r.reported.id, false)}
                          className="px-3 py-1.5 rounded-full bg-[#26234D] text-xs font-semibold text-[#10B981] hover:bg-[#363168] cursor-pointer"
                        >
                          Unban User
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanned(r.reported.id, true)}
                          className="px-3 py-1.5 rounded-full bg-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/30 cursor-pointer"
                        >
                          Ban User
                        </button>
                      )}
                      <button
                        onClick={() => setReportStatus(r.id, "resolved")}
                        className="px-3 py-1.5 rounded-full bg-[#10B981]/20 text-xs font-semibold text-[#10B981] hover:bg-[#10B981]/30 cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1A3A] border border-[#363168] rounded-full max-w-sm">
                <Search size={16} className="text-[#A6A1CC]" />
                <input
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  placeholder="Filter users by name or username…"
                  className="bg-transparent text-xs text-white outline-none flex-1"
                />
              </div>

              <div className="flex flex-col gap-2">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="p-3.5 rounded-2xl bg-[#1C1A3A] border border-[#363168] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        {u.name} <span className="text-[#A6A1CC] font-normal">(@{u.username || "user"})</span>
                        {u.banned && <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px]">BANNED</span>}
                      </p>
                      <p className="text-[10px] text-[#A6A1CC]">ID: {u.id} · Level: {u.level || 1} · XP: {u.xp || 0}</p>
                    </div>

                    <div>
                      {u.banned ? (
                        <button
                          onClick={() => setBanned(u.id, false)}
                          className="px-3 py-1.5 rounded-full bg-[#26234D] text-xs font-semibold text-[#10B981] cursor-pointer"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          onClick={() => setBanned(u.id, true)}
                          className="px-3 py-1.5 rounded-full bg-red-500/20 text-xs font-semibold text-red-400 cursor-pointer"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
