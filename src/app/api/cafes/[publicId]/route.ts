import { NextRequest } from "next/server";
import { proxyJson } from "@/utils/backend-proxy";

type CafeRouteContext = {
  params: Promise<{ publicId: string }>;
};

export const GET = async (_req: NextRequest, context: CafeRouteContext) => {
  const { publicId } = await context.params;
  return proxyJson(`cafes/${publicId}`, undefined, "cafe");
};

export const PATCH = async (req: NextRequest, context: CafeRouteContext) => {
  const { publicId } = await context.params;
  const body = await req.text();
  return proxyJson(`cafes/${publicId}`, { method: "PATCH", body }, "cafe");
};

export const DELETE = async (_req: NextRequest, context: CafeRouteContext) => {
  const { publicId } = await context.params;
  return proxyJson(`cafes/${publicId}`, { method: "DELETE" }, "cafe");
};
