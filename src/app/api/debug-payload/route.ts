import { NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";

export const maxDuration = 60;

export async function GET() {
  try {
    const payload = await getPayload({ config });
    return NextResponse.json({
      ok: true,
      collections: Object.keys(payload.config.collections),
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        ok: false,
        error: err.message,
        cause: err.cause ? String(err.cause) : undefined,
        stack: err.stack?.split("\n").slice(0, 8),
      },
      { status: 500 }
    );
  }
}
