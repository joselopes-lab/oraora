'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Home, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans flex flex-col justify-between selection:bg-[#00e900] selection:text-black">
      {/* Header */}
      <header className="w-full border-b border-neutral-200/60 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-8 w-32">
              <Image 
                src="https://firebasestorage.googleapis.com/v0/b/studio-5937631195-8ebfd.firebasestorage.app/o/site-assets%2Flogos%2Fa08e5cdf-9fd3-4be2-85a1-05ff0eaddc58-logo-oraora-p.png?alt=media&token=ba675609-9e91-4c12-a5f7-0daf5b9a9ba2"
                alt="OraOra Logo"
                fill
                className="object-contain object-left"
                referrerPolicy="no-referrer"
              />
            </div>
          </Link>
          <Link href="/imoveis">
            <Button variant="outline" className="rounded-full border-neutral-300 font-medium">
              Ver Imóveis
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-neutral-900 text-[#00e900] shadow-xl shadow-black/10 mx-auto mb-2">
              <Building2 className="size-10" />
            </div>

            <span className="text-xs font-bold tracking-widest uppercase px-3.5 py-1.5 rounded-full bg-neutral-200/60 text-neutral-700">
              Erro 404 • Página não encontrada
            </span>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-900 leading-[1.1]">
              Ops! Este imóvel ou página mudou de endereço.
            </h1>

            <p className="text-lg text-neutral-600 max-w-lg mx-auto font-normal leading-relaxed">
              O link que você acessou pode estar desatualizado ou a página foi removida. Mas não se preocupe, temos ótimas opções esperando por você.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-14 px-8 rounded-full bg-black hover:bg-neutral-800 text-white font-semibold text-base shadow-lg shadow-black/10 transition-all hover:scale-105 flex items-center justify-center gap-2">
                <Home className="size-4" />
                Voltar ao Início
              </Button>
            </Link>

            <Link href="/imoveis" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full border-neutral-300 hover:bg-neutral-100 text-neutral-900 font-medium text-base transition-all flex items-center justify-center gap-2">
                <Search className="size-4" />
                Explorar Imóveis
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-12 border-t border-neutral-200/80 flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-neutral-500"
          >
            <Link href="/corretor" className="hover:text-black transition-colors">
              Para Corretores
            </Link>
            <Link href="/sobre" className="hover:text-black transition-colors">
              Sobre o OraOra
            </Link>
            <Link href="/contato" className="hover:text-black transition-colors">
              Fale Conosco
            </Link>
            <Link href="/ajuda" className="hover:text-black transition-colors">
              Central de Ajuda
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t border-neutral-200/60 bg-white text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} OraOra Imóveis. Todos os direitos reservados.
      </footer>
    </div>
  );
}
