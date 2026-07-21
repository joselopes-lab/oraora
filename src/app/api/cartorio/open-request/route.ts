import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const baseUrl = process.env.CARTORIO_API_URL || "https://cartorio.oraora.com.br/api/v1";
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/processes`;

    const body = await req.json();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("POST /api/cartorio/open-request proxy error:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
