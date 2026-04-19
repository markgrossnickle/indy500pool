import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const poolResult = await sql`
      SELECT * FROM pools WHERE code = ${code}
    `;

    if (poolResult.rows.length === 0) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const pool = poolResult.rows[0];

    const membersResult = await sql`
      SELECT * FROM members WHERE pool_id = ${pool.id}
    `;

    const driversResult = await sql`
      SELECT * FROM drivers WHERE pool_id = ${pool.id}
    `;

    const positionsResult = await sql`
      SELECT * FROM race_positions WHERE pool_id = ${pool.id}
    `;

    const driversMap = new Map(
      driversResult.rows.map((d) => [d.pole_position, d])
    );
    const positionsMap = new Map(
      positionsResult.rows.map((p) => [p.pole_position, p.current_position])
    );

    const scoreboard = membersResult.rows.map((member) => {
      const driver1 = driversMap.get(member.driver_1_pole);
      const driver2 = driversMap.get(member.driver_2_pole);
      const driver3 = driversMap.get(member.driver_3_pole);

      const pos1 = positionsMap.get(member.driver_1_pole) ?? null;
      const pos2 = positionsMap.get(member.driver_2_pole) ?? null;
      const pos3 = positionsMap.get(member.driver_3_pole) ?? null;

      const total =
        (pos1 ?? 0) + (pos2 ?? 0) + (pos3 ?? 0);

      return {
        memberId: member.id,
        name: member.name,
        pickNumber: member.pick_number,
        driver1: {
          name: driver1?.name ?? "TBD",
          carNumber: driver1?.car_number,
          polePosition: member.driver_1_pole,
          currentPosition: pos1,
        },
        driver2: {
          name: driver2?.name ?? "TBD",
          carNumber: driver2?.car_number,
          polePosition: member.driver_2_pole,
          currentPosition: pos2,
        },
        driver3: {
          name: driver3?.name ?? "TBD",
          carNumber: driver3?.car_number,
          polePosition: member.driver_3_pole,
          currentPosition: pos3,
        },
        totalScore: total,
      };
    });

    // Sort by total score ascending (lowest = best)
    scoreboard.sort((a, b) => a.totalScore - b.totalScore);

    // Find last update time
    const lastUpdate = positionsResult.rows.reduce((latest, p) => {
      const t = new Date(p.updated_at).getTime();
      return t > latest ? t : latest;
    }, 0);

    return NextResponse.json({
      pool: { name: pool.name, code: pool.code, status: pool.status },
      scoreboard,
      lastUpdated: lastUpdate ? new Date(lastUpdate).toISOString() : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch scoreboard: ${error}` },
      { status: 500 }
    );
  }
}
