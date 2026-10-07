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
  const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const path = url.pathname;

  // 1. Evita loops caso a URL já comece com /sites
  if (path.startsWith('/sites')) {
    return NextResponse.next();
  }

  // Sanitiza o hostname (remove porta se existir e www. inicial)
  let cleanHost = rawHost.toLowerCase().split(':')[0];
  if (cleanHost.startsWith('www.')) {
    cleanHost = cleanHost.slice(4);
  }

  // 2. Não reescrever rotas principais da plataforma
  const mainRoutes = [
    '/dashboard',
    '/imoveis',
    '/login',
    '/planos',
    '/sobre',
    '/contato',
    '/ajuda',
    '/politica-de-privacidade',
    '/termos-de-uso',
    '/solicitar-acesso',
    '/nova-senha',
    '/esqueceu-a-senha',
    '/reset-password',
    '/o-mercado-tem-rosto',
    '/ora-ia',
    '/empreendimento',
    '/radar',
    '/debug',
    '/oralink',
  ];

  if (mainRoutes.some(route => path === route || path.startsWith(`${route}/`))) {
    return NextResponse.next();
  }

  // 3. Plataforma principal OraOra (sem subdomínio de corretor)
  if (!cleanHost || cleanHost === 'oraora.com.br') {
    return NextResponse.next();
  }

  // 4. Subdomínio da OraOra (ex: slug.oraora.com.br)
  if (cleanHost.endsWith('.oraora.com.br')) {
    const sub = cleanHost.slice(0, -'.oraora.com.br'.length);
    if (sub === 'www' || sub === 'app' || !sub) {
      return NextResponse.next();
    }
    url.pathname = `/sites/${sub}${path}`;
    return NextResponse.rewrite(url);
  }

  // 5. Ambientes de desenvolvimento, preview e hospedagem interna
  const devPlatformDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'web.app',
    'firebase.studio',
    'firebaseapp.com',
    'hosted.app',
    'cloudworkstations.dev',
    'run.app',
    'googleusercontent.com',
    'aistudio.google.com',
    'ais-',
  ];

  if (devPlatformDomains.some(d => cleanHost.includes(d))) {
    return NextResponse.next();
  }

  // 6. Domínio próprio do corretor (ex: meudominio.com.br)
  url.pathname = `/sites/${cleanHost}${path}`;
  return NextResponse.rewrite(url);
}
