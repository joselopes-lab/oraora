/**
 * @fileOverview Route Handler desativado em favor de src/app/sitemap.ts.
 * No Next.js 15, o sitemap.ts é a convenção recomendada para gerar /sitemap.xml.
 */
export async function GET() {
  return new Response("Sitemap is handled by /sitemap.ts", { status: 404 });
}
