import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.CARTORIO_API_URL || "https://cartorio.oraora.com.br/api/v1";
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/services${req.nextUrl.search}`;

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(errorData, { status: response.status });
      } catch {
        const text = await response.text();
        return NextResponse.json({ error: text || "Erro na API do Cartório" }, { status: response.status });
      }
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/cartorio/services proxy error:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

