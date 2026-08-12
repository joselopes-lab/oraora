import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const baseUrl = process.env.CARTORIO_API_URL || "https://us-central1-oraora---construtora.cloudfunctions.net/api/cartorio";
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
    const request = data;
    console.log("REQUEST RETORNADO PARA A TELA");
    console.log(request);
    console.log("DOCUMENTS NO SERVICE");
    console.log(request.documents);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`GET /api/cartorio/processes/[id] proxy error:`, error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const baseUrl = process.env.CARTORIO_API_URL || "https://us-central1-oraora---construtora.cloudfunctions.net/api/cartorio";
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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const baseUrl = process.env.CARTORIO_API_URL || "https://us-central1-oraora---construtora.cloudfunctions.net/api/cartorio";
    const targetUrl = `${baseUrl.replace(/\/$/, "")}/processes/${id}`;

    // Consultar a request antes de excluir para validar o status no servidor
    try {
      const checkResponse = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (checkResponse.ok) {
        const rawData = await checkResponse.json();
        const processObj = rawData?.data || rawData || {};
        const status = processObj.status;

        if (!status || status.toLowerCase() !== 'rascunho') {
          return NextResponse.json(
            { error: "Apenas processos com status 'rascunho' podem ser excluídos." },
            { status: 403 }
          );
        }
      }
    } catch (checkErr) {
      console.error("Error checking process status prior to deletion:", checkErr);
      return NextResponse.json(
        { error: "Não foi possível verificar o status do processo antes da exclusão." },
        { status: 500 }
      );
    }

    const response = await fetch(targetUrl, {
      method: "DELETE",
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

    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch {
      return NextResponse.json({ success: true }, { status: 200 });
    }
  } catch (error: any) {
    console.error(`DELETE /api/cartorio/processes/[id] proxy error:`, error);
    return NextResponse.json({ error: error.message || "Erro no servidor" }, { status: 500 });
  }
}


