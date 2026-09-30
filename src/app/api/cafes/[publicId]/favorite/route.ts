import { NextRequest } from "next/server";
import { proxyJson } from "@/utils/backend-proxy";

type FavoriteRouteContext = {
  params: Promise<{ publicId: string }>;
};

export const POST = async (_req: NextRequest, context: FavoriteRouteContext) => {
  const { publicId } = await context.params;
  return proxyJson(`cafes/${publicId}/favorite`, { method: "POST" }, "cafe");
};

export const DELETE = async (_req: NextRequest, context: FavoriteRouteContext) => {
  const { publicId } = await context.params;
  return proxyJson(`cafes/${publicId}/favorite`, { method: "DELETE" }, "cafe");
};
