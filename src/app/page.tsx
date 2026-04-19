"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [poolName, setPoolName] = useState("");
  const [poolSize, setPoolSize] = useState(11);
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  async function createPool() {
    if (!poolName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/pools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: poolName, poolSize }),
      });
      const data = await res.json();
      if (data.code) {
        router.push(`/pool/${data.code}`);
      }
    } catch (err) {
      console.error("Failed to create pool:", err);
    } finally {
      setCreating(false);
    }
  }

  function joinPool() {
    if (joinCode.trim()) {
      router.push(`/pool/${joinCode.trim().toUpperCase()}`);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black tracking-tight mb-2">
          <span className="text-red-500">INDY 500</span> POOL
        </h1>
        <p className="text-gray-400 text-lg">Fantasy racing. Snake draft. Bragging rights.</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Create Pool */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-lg transition-colors"
          >
            Create a Pool
          </button>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-bold">Create a Pool</h2>
            <input
              type="text"
              placeholder="Pool name"
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Pool size (number of picks)
              </label>
              <input
                type="number"
                min={2}
                max={11}
                value={poolSize}
                onChange={(e) => setPoolSize(parseInt(e.target.value) || 11)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createPool}
                disabled={creating || !poolName.trim()}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold rounded-lg transition-colors"
              >
                {creating ? "Creating..." : "Create"}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-gray-600 text-sm">OR</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Join Pool */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-bold">Join a Pool</h2>
          <input
            type="text"
            placeholder="Enter pool code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 tracking-widest text-center text-2xl font-mono uppercase"
          />
          <button
            onClick={joinPool}
            disabled={!joinCode.trim()}
            className="w-full py-3 bg-white hover:bg-gray-200 disabled:bg-gray-700 text-gray-950 disabled:text-gray-500 font-bold rounded-lg transition-colors"
          >
            Join
          </button>
        </div>
      </div>
    </main>
  );
}
