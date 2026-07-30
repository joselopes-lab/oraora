import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const baseUrl = process.env.CARTORIO_API_URL || "https://us-central1-oraora---construtora.cloudfunctions.net/api/cartorio";
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/processes${req.nextUrl.search}`;

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

    console.log("Status API:", response.status);
    const body = await response.json();
    console.log("Resposta da Cloud Function:", body);
    console.log("Quantidade recebida:", body.data?.length);
    console.log("Resposta enviada ao frontend:", body);
    const data = body;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/cartorio/processes proxy error:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const baseUrl = process.env.CARTORIO_API_URL || "https://us-central1-oraora---construtora.cloudfunctions.net/api/cartorio";
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
    console.error("POST /api/cartorio/processes proxy error:", error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}
