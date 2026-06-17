import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const checks: Record<string, unknown> = {
    DATABASE_URI_set: !!process.env.DATABASE_URI,
    DATABASE_URI_preview: process.env.DATABASE_URI
      ? process.env.DATABASE_URI.replace(/:([^:@]+)@/, ":***@")
      : null,
    PAYLOAD_SECRET_set: !!process.env.PAYLOAD_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  };

  try {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URI,
      ssl: { rejectUnauthorized: false },
      max: 1,
      connectionTimeoutMillis: 8000,
    });
    const client = await pool.connect();
    const result = await client.query(
      "SELECT current_schema(), current_database(), version()"
    );
    const tableCount = await client.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'payload'"
    );
    client.release();
    await pool.end();
    checks.db_connected = true;
    checks.db_info = result.rows[0];
    checks.payload_table_count = tableCount.rows[0].count;
  } catch (err) {
    checks.db_connected = false;
    checks.db_error = String(err);
  }

  return NextResponse.json(checks, {
    headers: { "Content-Type": "application/json" },
  });
}
