'use server';

import { adminDb, getAccessToken } from '@/firebase/index.server';
import { FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Classe e Server Actions para gerenciamento de domínios customizados.
 * Suporta registro simultâneo de Apex e WWW com captura aprimorada de DNS.
 */

class AppHostingClient {
  private baseUrl = 'https://firebaseapphosting.googleapis.com/v1beta';
  private projectId = firebaseConfig.projectId;
  private location = process.env.APP_HOSTING_LOCATION || 'us-central1';
  private backendId = process.env.NEXT_PUBLIC_APP_HOSTING_BACKEND || 'studio';

  private async fetch(path: string, options: RequestInit = {}) {
    const token = await getAccessToken();
    const url = `${this.baseUrl}/projects/${this.projectId}/locations/${this.location}/backends/${this.backendId}${path}`;
    
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
    } catch (e: any) {
      throw {
        status: 0,
        message: `Falha de conexão com a API do Google: ${e.message}.`,
        url: url
      };
    }

    const rawText = await response.text();
    let data: any;

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch (e) {
      throw {
        status: response.status,
        message: `Resposta inesperada do Google (Status ${response.status}).`,
        url: url
      };
    }

    if (!response.ok) {
      throw {
        status: response.status,
        message: data?.error?.message || `Erro na API App Hosting (${response.status})`,
        url: url,
        data: data
      };
    }

    return data;
  }

  async registerDomain(domainId: string) {
    return this.fetch(`/domains?domainId=${domainId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getDomain(domainId: string) {
    return this.fetch(`/domains/${domainId}`);
  }
}

/**
 * Registra um domínio personalizado e seu subdomínio WWW no App Hosting.
 */
export async function registerCustomDomain(brokerId: string, domain: string) {
  try {
    const domainClean = domain
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
    
    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    if (!domainClean || !domainRegex.test(domainClean)) {
      return { success: false, message: 'Por favor, insira um domínio válido.' };
    }

    const apexDomain = domainClean;
    const wwwDomain = `www.${domainClean}`;

    const client = new AppHostingClient();

    // Função auxiliar para registrar ou buscar se já existir
    const registerOrGet = async (d: string) => {
      try {
        return await client.registerDomain(d);
      } catch (error: any) {
        if (error.status === 409) {
          return await client.getDomain(d);
        }
        throw error;
      }
    };

    // 1. Registro paralelo de Apex e WWW
    const [apexResult, wwwResult] = await Promise.all([
      registerOrGet(apexDomain),
      registerOrGet(wwwDomain)
    ]);

    // 2. Consolidação de Registros DNS
    const dnsRecords: any[] = [];
    const seenRecords = new Set<string>();

    const extractRecords = (res: any, currentDomain: string) => {
      // O Google pode devolver em CustomDomain.customDomainStatus.requiredDnsUpdates
      // ou direto em CustomDomain.dnsUpdates dependendo do estado da API
      const updates = res.customDomainStatus?.requiredDnsUpdates || 
                      (res.dnsUpdates ? [res.dnsUpdates] : []);

      updates.forEach((update: any) => {
        const desiredSets = update.desired || [];
        
        desiredSets.forEach((recordSet: any) => {
          const recordDomainName = recordSet.domainName || currentDomain;
          
          // Normalização de Host para o usuário preencher no DNS
          // Se for o domínio apex, o host é '@'. Se for subdomínio, removemos o apex.
          let host = recordDomainName.replace(apexDomain, '').replace(/\.+$/, '');
          if (host.startsWith('.')) host = host.substring(1);
          if (!host || host === '') host = '@';

          recordSet.records?.forEach((record: any) => {
            const fingerprint = `${record.type}-${host}-${record.rdata}`;
            
            if (!seenRecords.has(fingerprint)) {
              dnsRecords.push({
                type: record.type,
                host: host,
                value: record.rdata,
                description: record.type === 'TXT' || recordDomainName.includes('_acme-challenge')
                  ? 'Verificação de Propriedade/SSL' 
                  : 'Configuração de Roteamento'
              });
              seenRecords.add(fingerprint);
            }
          });
        });
      });
    };

    extractRecords(apexResult, apexDomain);
    extractRecords(wwwResult, wwwDomain);

    // 3. Salvar estado no Firestore
    const domainDocRef = adminDb.collection('domains').doc(apexDomain);
    const backendId = process.env.NEXT_PUBLIC_APP_HOSTING_BACKEND || 'studio';
    
    // Status final consolidado
    const isApexActive = apexResult.state === 'ACTIVE' || apexResult.status === 'ACTIVE';
    const isWwwActive = wwwResult.state === 'ACTIVE' || wwwResult.status === 'ACTIVE';

    const firestoreData = {
      brokerId,
      domainName: apexDomain,
      wwwDomainName: wwwDomain,
      appHostingBackend: backendId,
      status: (isApexActive && isWwwActive) ? 'verified' : 'pending',
      dnsRecords,
      updatedAt: FieldValue.serverTimestamp(),
    };

    await domainDocRef.set(firestoreData, { merge: true });

    return { 
      success: true, 
      message: 'Domínio provisionado com sucesso! Configure os registros DNS abaixo.',
      records: JSON.parse(JSON.stringify(dnsRecords)),
      domainName: apexDomain,
      status: firestoreData.status
    };

  } catch (error: any) {
    console.error('Critical Domain Error:', error);
    return { success: false, message: `Erro: ${error.message || 'Falha na comunicação com Google App Hosting.'}` };
  }
}

export async function getBrokerDomainStatus(brokerId: string) {
    try {
        const snap = await adminDb.collection('domains').where('brokerId', '==', brokerId).limit(1).get();
        if (snap.empty) return { success: false };
        const data = snap.docs[0].data();
        return { success: true, data: JSON.parse(JSON.stringify(data)) };
    } catch (error) {
        console.error('Error fetching domain status:', error);
        return { success: false };
    }
}
