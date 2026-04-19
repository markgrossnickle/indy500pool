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

    const driversResult = await sql`
      SELECT * FROM drivers WHERE pool_id = ${pool.id} ORDER BY pole_position
    `;

    const membersResult = await sql`
      SELECT * FROM members WHERE pool_id = ${pool.id} ORDER BY pick_number
    `;

    const positionsResult = await sql`
      SELECT * FROM race_positions WHERE pool_id = ${pool.id} ORDER BY pole_position
    `;

    return NextResponse.json({
      pool,
      drivers: driversResult.rows,
      members: membersResult.rows,
      positions: positionsResult.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to fetch pool: ${error}` },
      { status: 500 }
    );
  }
}
