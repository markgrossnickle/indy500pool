import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
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

    const result = await sql`
      INSERT INTO members (pool_id, name)
      VALUES (${pool.id}, ${name})
      RETURNING *
    `;

    return NextResponse.json({ member: result.rows[0] });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to add member: ${error}` },
      { status: 500 }
    );
  }
}
