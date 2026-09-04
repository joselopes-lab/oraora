import { redirect } from 'next/navigation';

export default async function ImoveisAvulsosRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/construtoras/${id}/imoveis?tab=avulsos`);
}
