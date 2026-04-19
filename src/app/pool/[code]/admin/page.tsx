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

export default function AdminPage() {
  const params = useParams();
  const code = params.code as string;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [positions, setPositions] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/pools/${code}`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data.drivers);

        // Pre-fill existing positions
        const posMap: Record<number, string> = {};
        for (const p of data.positions) {
          posMap[p.pole_position] = String(p.current_position);
        }
        setPositions(posMap);
      }
    } catch {
      setMessage("Failed to load data");
    }
    setLoading(false);
  }, [code]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function updatePositions() {
    setSaving(true);
    setMessage("");

    const posArray = Object.entries(positions)
      .filter(([, val]) => val.trim() !== "")
      .map(([pole, pos]) => ({
        polePosition: parseInt(pole),
        currentPosition: parseInt(pos),
      }))
      .filter((p) => !isNaN(p.currentPosition));

    try {
      const res = await fetch(`/api/pools/${code}/positions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ positions: posArray }),
      });

      if (res.ok) {
        setMessage(`Updated ${posArray.length} positions`);
      } else {
        setMessage("Failed to update positions");
      }
    } catch {
      setMessage("Error updating positions");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">
            <span className="text-red-500">Admin</span> - Update Positions
          </h1>
          <Link
            href={`/pool/${code}`}
            className="text-sm px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Back to Pool
          </Link>
        </div>

        {message && (
          <div className="mb-4 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="space-y-2">
            <div className="grid grid-cols-[3rem_3rem_1fr_5rem] gap-2 text-xs text-gray-500 font-bold uppercase px-1">
              <span>Pole</span>
              <span>Car</span>
              <span>Driver</span>
              <span>Position</span>
            </div>
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="grid grid-cols-[3rem_3rem_1fr_5rem] gap-2 items-center"
              >
                <span className="text-gray-500 text-sm">
                  P{driver.pole_position}
                </span>
                <span className="text-gray-400 text-sm">
                  {driver.car_number ? `#${driver.car_number}` : "-"}
                </span>
                <span className="text-gray-300 text-sm truncate">
                  {driver.name}
                </span>
                <input
                  type="number"
                  min={1}
                  max={33}
                  value={positions[driver.pole_position] ?? ""}
                  onChange={(e) =>
                    setPositions((prev) => ({
                      ...prev,
                      [driver.pole_position]: e.target.value,
                    }))
                  }
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm text-center focus:outline-none focus:border-red-500"
                />
              </div>
            ))}
          </div>

          <button
            onClick={updatePositions}
            disabled={saving}
            className="mt-6 w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white font-bold rounded-lg transition-colors"
          >
            {saving ? "Updating..." : "Update Positions"}
          </button>
        </div>
      </div>
    </main>
  );
}
