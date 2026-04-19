import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { positions } = body;

    if (!positions || !Array.isArray(positions)) {
      return NextResponse.json(
        { error: "positions array is required" },
        { status: 400 }
      );
    }

    const poolResult = await sql`
      SELECT * FROM pools WHERE code = ${code}
    `;

    if (poolResult.rows.length === 0) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const pool = poolResult.rows[0];

    for (const pos of positions) {
      // Upsert: try update, then insert
      const updateResult = await sql`
        UPDATE race_positions
        SET current_position = ${pos.currentPosition}, updated_at = NOW()
        WHERE pool_id = ${pool.id} AND pole_position = ${pos.polePosition}
      `;

      if (updateResult.rowCount === 0) {
        await sql`
          INSERT INTO race_positions (pool_id, pole_position, current_position)
          VALUES (${pool.id}, ${pos.polePosition}, ${pos.currentPosition})
        `;
      }
    }

    return NextResponse.json({ message: "Positions updated", count: positions.length });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to update positions: ${error}` },
      { status: 500 }
    );
  }
}
