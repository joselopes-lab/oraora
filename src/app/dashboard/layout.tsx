import React, { Suspense } from 'react';
import DashboardLayoutClient from './DashboardLayoutClient';
import Loading from './loading'; // Importando o componente de carregamento

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<Loading />}>
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </Suspense>
  );
}
