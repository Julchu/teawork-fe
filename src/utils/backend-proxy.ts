import { NextResponse } from "next/server";
import { getAccessToken } from "@/utils/server-actions/session-token";

type BackendPayload = {
  success?: boolean;
  data?: unknown;
  error?: string;
};

export type BackendResult =
  | { ok: false; response: NextResponse }
  | { ok: true; status: number; payload: BackendPayload };

export const backendFetch = async (path: string, init?: RequestInit): Promise<BackendResult> => {
  const token = await getAccessToken();
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const response = await fetch(`${process.env.TEAWORK_BACKEND_URL}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as BackendPayload;
  return { ok: true, status: response.status, payload };
};

export const proxyJson = async (path: string, init: RequestInit | undefined, dataKey: string) => {
  const result = await backendFetch(path, init);
  if (!result.ok) return result.response;
  if (!result.payload.success) {
    return NextResponse.json(
      { error: result.payload.error ?? "Request failed" },
      { status: result.status },
    );
  }

  return NextResponse.json({ [dataKey]: result.payload.data ?? null }, { status: result.status });
};
