import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { drivers } = body;

    if (!drivers || !Array.isArray(drivers)) {
      return NextResponse.json(
        { error: "drivers array is required" },
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

    // Clear existing drivers
    await sql`DELETE FROM drivers WHERE pool_id = ${pool.id}`;

    // Insert new drivers
    for (const driver of drivers) {
      await sql`
        INSERT INTO drivers (pool_id, pole_position, name, car_number)
        VALUES (${pool.id}, ${driver.polePosition}, ${driver.name}, ${driver.carNumber || null})
      `;
    }

    return NextResponse.json({ message: "Drivers set successfully", count: drivers.length });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to set drivers: ${error}` },
      { status: 500 }
    );
  }
}
