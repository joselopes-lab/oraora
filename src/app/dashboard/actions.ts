
'use client';
// Este arquivo será usado para chamadas que não podem ser feitas diretamente no cliente
// Mas como as funções de IA estão em 'use server', podemos importá-las.

import { generateSiteContent } from '@/ai/flows/generate-site-content-flow';
import { OnboardingDataSchema } from '@/ai/genkit';
import { z } from 'genkit';
import { doc, setDoc, Firestore } from 'firebase/firestore';

/**
 * Salva os dados do onboarding e gera o conteúdo do site via IA.
 */
export async function processOnboarding(
  db: Firestore, 
  userId: string, 
  data: z.infer<typeof OnboardingDataSchema>,
  contactInfo: any
) {
  // 1. Salva os dados básicos do usuário primeiro
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
    username: contactInfo.name,
    phone: contactInfo.phone,
    whatsapp: contactInfo.whatsapp,
  }, { merge: true });

  const brokerRef = doc(db, 'brokers', userId);
  await setDoc(brokerRef, {
    brandName: contactInfo.name,
    creci: contactInfo.creci,
    whatsappUrl: `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, '')}`,
    instagramUrl: contactInfo.instagram ? `https://instagram.com/${contactInfo.instagram.replace('@', '')}` : '',
  }, { merge: true });

  // 2. Chama a IA para gerar o conteúdo das páginas
  // Nota: Em um ambiente real, você chamaria a 'generateSiteContent' que é uma Server Action
  const aiContent = await generateSiteContent(data);

  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.replace(/<[^>]*>?/gm, '');
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        newObj[key] = sanitizeObject(obj[key]);
      }
      return newObj;
    }
    return obj;
  }

  const sanitized = sanitizeObject(aiContent);

  // 3. Salva o conteúdo gerado no documento do Broker
  await setDoc(brokerRef, {
    homepage: sanitized.homepage,
    urbanPadraoSobre: sanitized.urbanPadraoSobre,
    urbanPadraoServicos: sanitized.urbanPadraoServicos,
    oraoraContato: sanitized.oraoraContato,
    onboardingCompleted: true,
    onboardingData: data // Guarda o briefing para referência futura
  }, { merge: true });

  return sanitized;
}
