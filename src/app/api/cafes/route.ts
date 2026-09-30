import { NextRequest } from "next/server";
import { proxyJson } from "@/utils/backend-proxy";

export const GET = async (req: NextRequest) => {
  return proxyJson(`cafes${req.nextUrl.search}`, undefined, "cafes");
};

export const POST = async (req: NextRequest) => {
  const body = await req.text();
  return proxyJson("cafes", { method: "POST", body }, "cafe");
};
