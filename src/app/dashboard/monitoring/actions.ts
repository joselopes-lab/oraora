'use server';

import { z } from 'zod';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, Timestamp, getDocs, setDoc } from 'firebase/firestore';
import { webcrypto } from 'node:crypto';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface Site {
  id: string;
  nome: string;
  url: string;
  ultimaVerificacao: Timestamp | null;
  ultimaVersaoHash: string;
  status: 'pendente' | 'monitorando' | 'mudanca_detectada' | 'erro';
  lastChangedAt?: Timestamp;
}

async function pseudoHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await webcrypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

function sanitizeHtml(html: string): string {
    let sanitized = html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '');

    sanitized = sanitized.replace(/<input type="hidden" name="__VIEWSTATE"[^>]*>/gi, '');
    sanitized = sanitized.replace(/<input type="hidden" name="__VIEWSTATEGENERATOR"[^>]*>/gi, '');
    sanitized = sanitized.replace(/<input type="hidden" name="__EVENTVALIDATION"[^>]*>/gi, '');
    
    sanitized = sanitized.replace(/<([a-zA-Z0-9]+)([^>]*)>/g, (match, tagName, attrs) => {
        const keepAttrs = ['href', 'src'];
        let newAttrs = '';
        
        const attributes = (attrs.match(/([a-zA-Z0-9\-:]+)=((?:"[^"]*")|(?:'[^']*'))/g) || []);
        
        attributes.forEach(attr => {
            const [attrName] = attr.split('=');
            if (keepAttrs.includes(attrName.toLowerCase())) {
                newAttrs += ` ${attr}`;
            }
        });

        return `<${tagName}${newAttrs}>`;
    });

    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    return sanitized;
}


async function checkSingleSite(site: Site): Promise<{ name: string; status: Site['status'] }> {
    const siteRef = doc(db, 'sitesMonitorados', site.id);
    let newStatus: Site['status'] = 'monitorando';
    let updateData: any = {
      ultimaVerificacao: Timestamp.now(),
    };

    try {
      const response = await fetch(site.url, { 
          headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`Falha ao buscar: ${response.status} ${response.statusText}`);
      }
      const content = await response.text();
      const sanitizedContent = sanitizeHtml(content);
      const currentHash = await pseudoHash(sanitizedContent);
      
      if (site.ultimaVersaoHash && site.ultimaVersaoHash !== currentHash) {
        newStatus = 'mudanca_detectada';
        updateData.lastChangedAt = Timestamp.now();
      } else {
        newStatus = 'monitorando';
      }
      
      updateData.ultimaVersaoHash = currentHash;
      
    } catch (error: any) {
      console.error(`Falha ao verificar ${site.url}:`, error);
      newStatus = 'erro';
    } finally {
        updateData.status = newStatus;
        await updateDoc(siteRef, updateData);
    }
    return { name: site.nome, status: newStatus };
}


export async function handleManualCheck() {
  const sitesRef = collection(db, 'sitesMonitorados');
  const querySnapshot = await getDocs(sitesRef);
  const sites: Site[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));
  
  const results = await Promise.all(sites.map(site => checkSingleSite(site)));
  
  return { success: true, results };
}

export async function handleSingleCheck(siteId: string) {
    const siteRef = doc(db, 'sitesMonitorados', siteId);
    const docSnap = await getDoc(siteRef);

    if (!docSnap.exists()) {
        return { success: false, error: 'Site não encontrado.' };
    }

    const site = { id: docSnap.id, ...docSnap.data() } as Site;
    const result = await checkSingleSite(site);

    return { success: true, result };
}


export async function handleAddSite(prevState: any, formData: FormData) {
    const nome = formData.get('nome') as string;
    const url = formData.get('url') as string;

    if (!nome || !url) {
        return { success: false, error: "Nome e URL são obrigatórios." };
    }

    try {
        await addDoc(collection(db, 'sitesMonitorados'), {
            nome,
            url,
            ultimaVerificacao: null,
            ultimaVersaoHash: '',
            status: 'pendente',
        });
        return { success: true, error: null };
    } catch (error: any) {
        return { success: false, error: "Falha ao adicionar o site." };
    }
}

const builderSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  website: z.string().url('URL do site inválida').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  instagram: z.string().optional(),
  isVisibleOnSite: z.preprocess((val) => val === 'on' || val === true, z.boolean()),
});

export async function handleRegisterBuilder(prevState: any, formData: FormData) {
    const validatedFields = builderSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.flatten().fieldErrors };
    }

    const { name, email, ...builderData } = validatedFields.data;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, '@Construtora2025');
        const newUser = userCredential.user;

        await updateProfile(newUser, { displayName: name });

        const builderRef = doc(db, 'builders', newUser.uid);
        await setDoc(builderRef, {
            id: newUser.uid,
            name,
            email,
            ...builderData,
        });

        await setDoc(doc(db, "users", newUser.uid), {
            uid: newUser.uid,
            name,
            email,
            role: 'Construtora',
            status: 'Active',
            createdAt: new Date(),
        });

        return { success: true, message: 'Construtora e usuário criados com sucesso!' };
    } catch (error: any) {
        let errorMessage = 'Ocorreu um erro desconhecido.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este e-mail já está em uso por outro usuário.';
        }
        return { success: false, error: { _errors: [errorMessage] } };
    }
}