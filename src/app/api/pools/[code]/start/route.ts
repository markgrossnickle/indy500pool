import { sql } from "@vercel/postgres";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json().catch(() => ({}));
    const { assignments } = body;

    const poolResult = await sql`
      SELECT * FROM pools WHERE code = ${code}
    `;

    if (poolResult.rows.length === 0) {
      return NextResponse.json({ error: "Pool not found" }, { status: 404 });
    }

    const pool = poolResult.rows[0];
    const poolSize = pool.pool_size;

    const membersResult = await sql`
      SELECT * FROM members WHERE pool_id = ${pool.id}
    `;

    const members = membersResult.rows;

    if (members.length === 0) {
      return NextResponse.json(
        { error: "No members in pool" },
        { status: 400 }
      );
    }

    // Assign pick numbers
    if (assignments && Array.isArray(assignments)) {
      // Manual assignments
      for (const a of assignments) {
        await sql`
          UPDATE members SET pick_number = ${a.pickNumber}
          WHERE id = ${a.memberId} AND pool_id = ${pool.id}
        `;
      }
    } else {
      // Random assignment
      const shuffled = [...members].sort(() => Math.random() - 0.5);
      for (let i = 0; i < shuffled.length; i++) {
        await sql`
          UPDATE members SET pick_number = ${i + 1}
          WHERE id = ${shuffled[i].id}
        `;
      }
    }

    // Snake draft assignment
    // Pick K gets:
    //   Round 1 (forward): pole K
    //   Round 2 (reverse): pole (2*P + 1 - K)
    //   Round 3 (forward): pole (2*P + K)
    const updatedMembers = await sql`
      SELECT * FROM members WHERE pool_id = ${pool.id}
    `;

    for (const member of updatedMembers.rows) {
      const k = member.pick_number;
      const driver1Pole = k;
      const driver2Pole = 2 * poolSize + 1 - k;
      const driver3Pole = 2 * poolSize + k;

      await sql`
        UPDATE members
        SET driver_1_pole = ${driver1Pole},
            driver_2_pole = ${driver2Pole},
            driver_3_pole = ${driver3Pole}
        WHERE id = ${member.id}
      `;
    }

    // Set pool to active
    await sql`
      UPDATE pools SET status = 'active' WHERE id = ${pool.id}
    `;

    // Return updated state
    const finalMembers = await sql`
      SELECT * FROM members WHERE pool_id = ${pool.id} ORDER BY pick_number
    `;

    return NextResponse.json({
      message: "Pool started with snake draft",
      members: finalMembers.rows,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to start pool: ${error}` },
      { status: 500 }
    );
  }
}
