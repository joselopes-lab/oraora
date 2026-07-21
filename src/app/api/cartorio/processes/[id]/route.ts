import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const baseUrl = process.env.CARTORIO_API_URL || "https://cartorio.oraora.com.br/api/v1";
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/processes/${id}`;

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
    console.error(`GET /api/cartorio/processes/[id] proxy error:`, error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const baseUrl = process.env.CARTORIO_API_URL || "https://cartorio.oraora.com.br/api/v1";
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/processes/${id}`;

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
    console.error(`POST /api/cartorio/processes/[id] proxy error:`, error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

