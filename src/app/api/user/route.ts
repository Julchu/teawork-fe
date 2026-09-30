import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/utils/backend-proxy";

export const PATCH = async (req: NextRequest) => {
  const body = await req.text();
  const result = await backendFetch("user/update", { method: "PATCH", body });
  if (!result.ok) return result.response;
  if (!result.payload.success) {
    return NextResponse.json(
      { error: result.payload.error ?? "Unable to update user" },
      { status: result.status },
    );
  }

  const user = Array.isArray(result.payload.data) ? result.payload.data[0] : result.payload.data;
  return NextResponse.json({ user });
};
