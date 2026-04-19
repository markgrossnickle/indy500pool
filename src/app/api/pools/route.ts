import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, poolSize = 11 } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const code = generateCode();

    const result = await sql`
      INSERT INTO pools (name, code, pool_size)
      VALUES (${name}, ${code}, ${poolSize})
      RETURNING *
    `;

    return NextResponse.json({ pool: result.rows[0], code });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create pool: ${error}` },
      { status: 500 }
    );
  }
}
