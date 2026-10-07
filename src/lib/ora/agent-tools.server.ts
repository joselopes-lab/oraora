import { adminAuth, adminDb } from '@/firebase/index.server';
import { leadRepository, Lead } from '@/repositories/lead.repository';

export async function resolveBrokerContext(providedToken?: string | null): Promise<{ uid: string; brokerId: string }> {
  if (!providedToken) {
    throw new Error('Token de autenticação não fornecido.');
  }

  const decoded = await adminAuth.verifyIdToken(providedToken);
  const uid = decoded.uid;

  const userDoc = await adminDb.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new Error('Perfil de usuário não encontrado.');
  }

  const userData = userDoc.data() || {};
  const brokerId = userData.brokerId || uid; // Fallback to uid if brokerId is not explicitly set

  return { uid, brokerId };
}

export async function agentSearchClients(brokerId: string, searchTerm?: string): Promise<Lead[]> {
  const leads = await leadRepository.listByBroker(brokerId);
  if (!searchTerm) return leads.slice(0, 10); // Return top 10 if no search term

  const term = searchTerm.toLowerCase();
  return leads.filter(l => 
    l.name?.toLowerCase().includes(term) ||
    l.email?.toLowerCase().includes(term) ||
    l.phone?.includes(term) ||
    l.propertyInterest?.toLowerCase().includes(term)
  );
}

export async function agentListEvents(brokerId: string, date?: string): Promise<any[]> {
  let queryRef = adminDb.collection('events').where('brokerId', '==', brokerId);
  if (date) {
    queryRef = queryRef.where('date', '==', date);
  }
  const snap = await queryRef.get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function agentExecuteCreateClient(brokerId: string, clientData: {
  name: string;
  phone: string;
  email?: string;
  propertyInterest?: string;
  source?: string;
}): Promise<string> {
  if (!clientData.name || !clientData.phone) {
    throw new Error('Nome e telefone do cliente são obrigatórios.');
  }

  const score = 50; // default score
  const qualification = 'Morno';

  const newLead: Omit<Lead, 'id'> = {
    name: clientData.name.trim(),
    phone: clientData.phone.trim(),
    email: clientData.email?.trim() || '',
    status: 'Novo Lead',
    dealStatus: 'Em Aberto',
    dealValue: 0,
    brokerId,
    propertyName: clientData.propertyInterest?.trim() || 'Interesse Geral',
    propertyInterest: clientData.propertyInterest?.trim() || '',
    source: clientData.source || 'Agente OraOra',
    statusHistory: [{ status: 'Novo Lead', date: new Date().toISOString() }],
    leadScore: score,
    leadQualification: qualification,
    message: 'Cadastrado via Agente OraOra V1'
  };

  const leadId = await leadRepository.create(newLead);
  return leadId;
}

export async function agentExecuteCreateEvent(brokerId: string, eventData: {
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type?: 'reuniao' | 'visita' | 'tarefa' | 'particular' | 'outro';
  description?: string;
  clientId?: string;
}): Promise<string> {
  if (!eventData.title || !eventData.date) {
    throw new Error('Título e data do compromisso são obrigatórios.');
  }

  const eventPayload = {
    brokerId,
    title: eventData.title.trim(),
    date: eventData.date,
    time: eventData.time || '09:00',
    type: eventData.type || 'reuniao',
    description: eventData.description || 'Criado via Agente OraOra V1',
    completed: false,
    clientId: eventData.clientId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const docRef = await adminDb.collection('events').add(eventPayload);
  return docRef.id;
}
