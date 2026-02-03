'use client';

import Link from "next/link";

export default function RadarProfilePage() {
    return (
        <div>
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Link href="/radar/dashboard" className="hover:text-neutral-dark">Radar</Link>
                <span>/</span>
                <span className="font-semibold text-neutral-dark">Meu Perfil</span>
            </nav>
            <h1 className="text-3xl font-bold text-neutral-dark">Meu Perfil</h1>
            <p className="mt-2 text-gray-600">Esta página está em construção. Em breve você poderá gerenciar suas informações aqui.</p>
        </div>
    )
}
