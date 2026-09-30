import { proxyJson } from "@/utils/backend-proxy";

export const GET = async () => {
  return proxyJson("cafes/favorites", undefined, "cafes");
};
