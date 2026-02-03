'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const pageGroups = [
    {
        title: "Páginas Públicas (Portal)",
        pages: [
            { href: "/", name: "Home Page" },
            { href: "/imoveis", name: "Busca de Imóveis" },
            { href: "/imoveis/ID_DO_IMOVEL", name: "Detalhes do Imóvel" },
            { href: "/sobre", name: "Sobre a Empresa" },
            { href: "/contato", name: "Contato" },
            { href: "/ajuda", name: "Central de Ajuda" },
        ]
    },
    {
        title: "Autenticação & Cadastro",
        pages: [
            { href: "/login", name: "Login (Corretor/Admin)" },
            { href: "/solicitar-acesso", name: "Página de Cadastro (Corretor)" },
            { href: "/planos", name: "Página de Planos" },
            { href: "/radar", name: "Login (Cliente)" },
            { href: "/radar/nova", name: "Cadastro (Cliente)" },
            { href: "/esqueceu-a-senha", name: "Recuperação de Senha" },
        ]
    },
    {
        title: "Dashboard do Administrador",
        pages: [
            { href: "/dashboard", name: "Dashboard Geral (Visão Admin)" },
            { href: "/dashboard/admin/leads", name: "Leads (Geral)" },
            { href: "/dashboard/imoveis", name: "Gestão de Imóveis (Construtoras)" },
            { href: "/dashboard/personas", name: "Gestão de Personas" },
            { href: "/dashboard/admin/users", name: "Gestão de Usuários" },
            { href: "/dashboard/admin/planos", name: "Gestão de Planos" },
            { href: "/dashboard/admin/tickets", name: "Tickets de Suporte" },
            { href: "/dashboard/construtoras", name: "Gestão de Construtoras" },
            { href: "/dashboard/admin/site/inicio", name: "Editor da Home (Portal)" },
            { href: "/dashboard/admin/site/contato", name: "Editor de Contato (Portal)" },
            { href: "/dashboard/admin/site/sobre", name: "Editor da Página Sobre" },
            { href: "/dashboard/admin/site/configuracoes", name: "Configurações do Site" },
            { href: "/dashboard/admin/sitemap", name: "Sitemap (Esta página)" },
        ]
    },
    {
        title: "Dashboard do Corretor",
        pages: [
            { href: "/dashboard", name: "Dashboard Principal" },
            { href: "/dashboard/leads", name: "Funil de Leads (Kanban)" },
            { href: "/dashboard/clientes", name: "Lista de Clientes" },
            { href: "/dashboard/imoveis", name: "Imóveis de Construtoras" },
            { href: "/dashboard/minha-carteira", name: "Minha Carteira (Destaques)" },
            { href: "/dashboard/avulso", name: "Meus Imóveis (Avulsos)" },
            { href: "/dashboard/agenda", name: "Agenda de Tarefas" },
            { href: "/dashboard/financeiro", name: "Controle Financeiro" },
            { href: "/dashboard/loja", name: "Loja de Layouts" },
            { href: "/dashboard/meu-site", name: "Gestão do Site Pessoal" },
            { href: "/dashboard/perfil", name: "Meu Perfil" },
        ]
    },
    {
        title: "Dashboard do Cliente (Radar)",
        pages: [
            { href: "/radar/dashboard", name: "Painel do Cliente" },
            { href: "/radar/dashboard/imoveis-salvos", name: "Imóveis Salvos" },
            { href: "/radar/dashboard/comparar", name: "Comparador de Imóveis" },
            { href: "/radar/dashboard/perfil", name: "Perfil do Cliente" },
        ]
    },
];

export default function SitemapPage() {
    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-main tracking-tight">Sitemap do Sistema</h1>
                    <p className="text-text-secondary mt-1">Navegue e gerencie o conteúdo de todas as páginas.</p>
                </div>
            </div>
            <div className="space-y-8">
                {pageGroups.map(group => (
                    <Card key={group.title}>
                        <CardHeader>
                            <CardTitle>{group.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {group.pages.map(page => (
                                    <li key={page.href}>
                                        <Link href={page.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                                            <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">link</span>
                                            <div>
                                                <p className="font-semibold text-text-main">{page.name}</p>
                                                <p className="text-xs text-text-secondary">{page.href}</p>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
