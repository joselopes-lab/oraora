import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Ignora caminhos que não devem ser processados pelo middleware
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const path = url.pathname;

  const mainDomainEnv = process.env.NEXT_PUBLIC_MAIN_DOMAIN?.toLowerCase() || '';

  // 1. Domínios que DEVEM ver a página principal (src/app/page.tsx)
  const mainDomains = [
    'oraora.com.br', 
    'localhost', 
    'web.app',
    'firebase.studio',
    'firebaseapp.com',
    'studio--studio-5937631195-8ebfd.us-central1.hosted.app',
    'hosted.app',
    'cloudworkstations.dev', // Permitir acesso via workstation
    'run.app',               // Permitir acesso via preview do AI Studio / Cloud Run
  ]; 
  
  const searchHostname = hostname.toLowerCase().replace('www.', '');

  const isMainDomain = mainDomains.some(d => searchHostname.includes(d));

  // 2. SE for domínio principal, NÃO faz rewrite. 
  // O Next.js vai renderizar naturalmente src/app/page.tsx ou src/app/contato/page.tsx
  if (isMainDomain) {
    return NextResponse.next();
  }

  // 3. SE o caminho já começar com /sites, também não mexe (evita loop)
  if (path.startsWith('/sites')) {
    return NextResponse.next();
  }

  // 4. MULTI-TENANCY: Se chegou aqui, não é domínio principal.
  // Faz o rewrite para a pasta do corretor.
  const slug = searchHostname.split(':')[0];
  url.pathname = `/sites/${slug}${path}`;

  return NextResponse.rewrite(url);
}
