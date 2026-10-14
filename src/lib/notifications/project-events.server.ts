import { adminDb } from '@/firebase/index.server';
import { createBatchNotifications } from './service.server';
import { CreateNotificationInput } from './types';

interface ProjectNotificationData {
  projectId: string;
  name: string;
  builderName?: string;
  publishedBy: 'admin' | 'constructor';
}

/**
 * Dispara notificações para todos os corretores elegíveis quando um novo empreendimento é publicado.
 * Utiliza o serviço central de notificações com identificadores determinísticos para evitar duplicidade.
 */
export async function triggerProjectPublishedNotification(data: ProjectNotificationData): Promise<void> {
  const { projectId, name, builderName, publishedBy } = data;

  try {
    // 1. Identificar corretores elegíveis (Todos os usuários com userType == 'broker')
    // Nota: Em um cenário com milhares de corretores, isso deveria ser feito via Queue ou Cloud Function.
    // Para a escala atual do OraOra, a busca direta e o processamento em lote são adequados.
    const brokersSnap = await adminDb.collection('users')
      .where('userType', '==', 'broker')
      .get();

    if (brokersSnap.empty) {
      console.log(`[ProjectNotifications] Nenhum corretor encontrado para notificar sobre o projeto ${projectId}`);
      return;
    }

    const builderText = builderName ? ` da construtora ${builderName}` : '';
    const title = publishedBy === 'admin' ? 'Novo Empreendimento Disponível' : 'Novo Lançamento Publicado';
    const message = `O empreendimento "${name}"${builderText} acaba de ser publicado e já está disponível para venda.`;

    const notifications: CreateNotificationInput[] = brokersSnap.docs.map(doc => ({
      userId: doc.id,
      type: publishedBy === 'admin' ? 'admin_project' : 'constructor_project',
      title,
      message,
      link: `/empreendimento/${projectId}`,
      eventId: `project_published_${projectId}`,
      sourceId: projectId,
      sourceType: 'project',
    }));

    // 2. Criar notificações em lote (o serviço gerencia a atomicidade e limites do Firestore)
    await createBatchNotifications(notifications);
    
    console.log(`[ProjectNotifications] ${notifications.length} corretores notificados sobre a publicação do projeto ${projectId}`);
  } catch (error) {
    console.error(`[ProjectNotifications] Falha ao disparar notificações para o projeto ${projectId}:`, error);
    // Não lançamos o erro para não quebrar o fluxo principal de publicação, mas registramos o log.
  }
}
