"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Driver {
  id: number;
  pole_position: number;
  name: string;
  car_number: string;
}

interface Member {
  id: number;
  name: string;
  pick_number: number | null;
  driver_1_pole: number | null;
  driver_2_pole: number | null;
  driver_3_pole: number | null;
}

interface Pool {
  id: number;
  name: string;
  code: string;
  pool_size: number;
  status: string;
}

interface ScoreboardEntry {
  memberId: number;
  name: string;
  pickNumber: number;
  driver1: { name: string; carNumber: string; polePosition: number; currentPosition: number | null };
  driver2: { name: string; carNumber: string; polePosition: number; currentPosition: number | null };
  driver3: { name: string; carNumber: string; polePosition: number; currentPosition: number | null };
  totalScore: number;
}

export default function PoolPage() {
  const params = useParams();
  const code = params.code as string;

  const [pool, setPool] = useState<Pool | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [scoreboard, setScoreboard] = useState<ScoreboardEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Setup state
  const [driverText, setDriverText] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [submittingDrivers, setSubmittingDrivers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [starting, setStarting] = useState(false);

  const fetchPool = useCallback(async () => {
    try {
      const res = await fetch(`/api/pools/${code}`);
      if (!res.ok) {
        setError("Pool not found");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setPool(data.pool);
      setDrivers(data.drivers);
      setMembers(data.members);
      setError("");
    } catch {
      setError("Failed to load pool");
    }
    setLoading(false);
  }, [code]);

  const fetchScoreboard = useCallback(async () => {
    try {
      const res = await fetch(`/api/pools/${code}/scoreboard`);
      if (res.ok) {
        const data = await res.json();
        setScoreboard(data.scoreboard);
        setLastUpdated(data.lastUpdated);
      }
    } catch {
      // Silently fail on scoreboard refresh
    }
  }, [code]);

  useEffect(() => {
    fetchPool();
  }, [fetchPool]);

  useEffect(() => {
    if (pool?.status === "active") {
      fetchScoreboard();
      const interval = setInterval(fetchScoreboard, 30000);
      return () => clearInterval(interval);
    }
  }, [pool?.status, fetchScoreboard]);

  async function submitDrivers() {
    const lines = driverText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    if (lines.length === 0) return;

    setSubmittingDrivers(true);
    const driverList = lines.map((line, i) => {
      // Try to parse "CarNumber - Name" or just "Name"
      const match = line.match(/^(\d+)\s*[-\.]\s*(.+)$/);
      if (match) {
        return { polePosition: i + 1, carNumber: match[1], name: match[2].trim() };
      }
      return { polePosition: i + 1, name: line };
    });

    try {
      await fetch(`/api/pools/${code}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drivers: driverList }),
      });
      await fetchPool();
      setDriverText("");
    } catch {
      setError("Failed to submit drivers");
    }
    setSubmittingDrivers(false);
  }

  async function addMember() {
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    try {
      await fetch(`/api/pools/${code}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newMemberName.trim() }),
      });
      setNewMemberName("");
      await fetchPool();
    } catch {
      setError("Failed to add member");
    }
    setAddingMember(false);
  }

  async function startPool() {
    setStarting(true);
    try {
      await fetch(`/api/pools/${code}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      await fetchPool();
    } catch {
      setError("Failed to start pool");
    }
    setStarting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  if (error && !pool) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-xl">{error}</div>
        <Link href="/" className="text-gray-400 hover:text-white underline">
          Back to home
        </Link>
      </main>
    );
  }

  if (!pool) return null;

  // ACTIVE VIEW - Scoreboard
  if (pool.status === "active") {
    return (
      <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black">
                <span className="text-red-500">{pool.name}</span>
              </h1>
              <p className="text-gray-500 text-sm">
                Code: <span className="font-mono">{pool.code}</span>
              </p>
            </div>
            <Link
              href={`/pool/${code}/admin`}
              className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Admin
            </Link>
          </div>

          {lastUpdated && (
            <p className="text-gray-500 text-xs mb-4">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}

          {/* Scoreboard */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-left">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2 text-center">Pick</th>
                  <th className="py-3 px-2">Driver 1</th>
                  <th className="py-3 px-2">Driver 2</th>
                  <th className="py-3 px-2">Driver 3</th>
                  <th className="py-3 px-2 text-center font-bold">Score</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((entry, i) => {
                  let rankClass = "";
                  if (i === 0) rankClass = "text-yellow-400";
                  else if (i === 1) rankClass = "text-gray-300";
                  else if (i === 2) rankClass = "text-orange-400";

                  return (
                    <tr
                      key={entry.memberId}
                      className={`border-b border-gray-800/50 ${i < 3 ? "bg-gray-900/50" : ""}`}
                    >
                      <td className={`py-3 px-2 font-bold ${rankClass}`}>
                        {i + 1}
                      </td>
                      <td className="py-3 px-2 font-semibold">{entry.name}</td>
                      <td className="py-3 px-2 text-center text-gray-400">
                        {entry.pickNumber}
                      </td>
                      <td className="py-3 px-2">
                        <DriverCell driver={entry.driver1} />
                      </td>
                      <td className="py-3 px-2">
                        <DriverCell driver={entry.driver2} />
                      </td>
                      <td className="py-3 px-2">
                        <DriverCell driver={entry.driver3} />
                      </td>
                      <td className={`py-3 px-2 text-center font-bold text-lg ${rankClass}`}>
                        {entry.totalScore}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-gray-600 text-xs mt-4 text-center">
            Auto-refreshes every 30 seconds. Lower score wins.
          </p>
        </div>
      </main>
    );
  }

  // SETUP VIEW
  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">
            <span className="text-red-500">{pool.name}</span>
          </h1>
          <div className="flex items-center gap-4">
            <p className="text-gray-400">
              Share code:{" "}
              <span className="font-mono text-2xl text-white bg-gray-800 px-3 py-1 rounded">
                {pool.code}
              </span>
            </p>
            <span className="text-sm text-gray-600">Pool size: {pool.pool_size}</span>
          </div>
        </div>

        {/* Drivers Section */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            Drivers ({drivers.length}/33)
          </h2>
          {drivers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 mb-4 text-sm">
              {drivers.map((d) => (
                <div key={d.id} className="flex gap-2 text-gray-300">
                  <span className="text-gray-500 w-6 text-right">
                    {d.pole_position}.
                  </span>
                  <span>
                    {d.car_number ? `#${d.car_number} ` : ""}
                    {d.name}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          <div className="space-y-3">
            <p className="text-gray-400 text-sm">
              Paste all 33 drivers in pole position order, one per line.
              Optional format: &quot;CarNumber - Driver Name&quot;
            </p>
            <textarea
              value={driverText}
              onChange={(e) => setDriverText(e.target.value)}
              placeholder={"1 - Scott Dixon\n2 - Josef Newgarden\n3 - Alex Palou\n..."}
              rows={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-red-500 font-mono text-sm"
            />
            <button
              onClick={submitDrivers}
              disabled={submittingDrivers || !driverText.trim()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold rounded-lg transition-colors"
            >
              {submittingDrivers ? "Saving..." : "Set Drivers"}
            </button>
          </div>
        </section>

        {/* Members Section */}
        <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            Members ({members.length})
          </h2>
          {members.length > 0 && (
            <div className="space-y-1 mb-4">
              {members.map((m) => (
                <div key={m.id} className="text-gray-300 text-sm">
                  {m.name}
                  {m.pick_number ? (
                    <span className="text-gray-500 ml-2">
                      (Pick #{m.pick_number})
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Member name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <button
              onClick={addMember}
              disabled={addingMember || !newMemberName.trim()}
              className="px-6 py-2 bg-white hover:bg-gray-200 disabled:bg-gray-700 text-gray-950 disabled:text-gray-500 font-bold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </section>

        {/* Start Button */}
        {drivers.length > 0 && members.length > 0 && (
          <button
            onClick={startPool}
            disabled={starting}
            className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold text-lg rounded-lg transition-colors"
          >
            {starting ? "Starting..." : "Randomize & Start Pool"}
          </button>
        )}
      </div>
    </main>
  );
}

function DriverCell({
  driver,
}: {
  driver: {
    name: string;
    carNumber: string;
    polePosition: number;
    currentPosition: number | null;
  };
}) {
  const pos = driver.currentPosition;
  let posColor = "text-gray-400";
  if (pos !== null) {
    if (pos <= 3) posColor = "text-green-400";
    else if (pos <= 10) posColor = "text-yellow-400";
    else if (pos >= 25) posColor = "text-red-400";
  }

  return (
    <div className="text-xs">
      <div className="text-gray-300">{driver.name}</div>
      <div className="flex gap-2 text-gray-500">
        <span>P{driver.polePosition}</span>
        {pos !== null && (
          <span className={posColor}>
            Pos {pos}
          </span>
        )}
      </div>
    </div>
  );
}
