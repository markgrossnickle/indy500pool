import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS pools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        pool_size INT DEFAULT 11,
        status VARCHAR(20) DEFAULT 'setup',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        pool_id INT REFERENCES pools(id),
        pole_position INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        car_number VARCHAR(10)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        pool_id INT REFERENCES pools(id),
        name VARCHAR(255) NOT NULL,
        pick_number INT,
        driver_1_pole INT,
        driver_2_pole INT,
        driver_3_pole INT
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS race_positions (
        id SERIAL PRIMARY KEY,
        pool_id INT REFERENCES pools(id),
        pole_position INT NOT NULL,
        current_position INT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    return NextResponse.json({ message: "Tables created successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to create tables: ${error}` },
      { status: 500 }
    );
  }
}
