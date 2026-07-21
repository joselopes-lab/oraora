'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, getDoc, doc, addDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Página de diagnóstico isolado para depuração de permissões do Firestore.
 * Utiliza exclusivamente o SDK oficial do Firebase sem abstrações do projeto.
 */

// Inicialização isolada para garantir bypass total de wrappers
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export default function DebugFirestorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        } catch (e) {
          console.error("Erro ao carregar perfil inicial:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const addLog = (action: string, result: any, error: any = null) => {
    setLogs(prev => [{
      action,
      timestamp: new Date().toLocaleTimeString(),
      success: !error,
      result,
      error: error ? {
        code: error.code,
        message: error.message,
        stack: error.stack,
        path: error.path || 'N/A'
      } : null
    }, ...prev]);
  };

  const testTransactions = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'transactions'),
        where('brokerId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      addLog('Ler Transactions', `Sucesso: ${snap.docs.length} documentos encontrados.`);
    } catch (e: any) {
      addLog('Ler Transactions', null, e);
    }
  };

  const testEvents = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'events'),
        where('brokerId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      addLog('Ler Events', `Sucesso: ${snap.docs.length} documentos encontrados.`);
    } catch (e: any) {
      addLog('Ler Events', null, e);
    }
  };

  const testLeads = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'leads'),
        where('brokerId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      addLog('Ler Leads', `Sucesso: ${snap.docs.length} documentos encontrados.`);
    } catch (e: any) {
      addLog('Ler Leads', null, e);
    }
  };

  const testCreateTransaction = async () => {
    if (!auth.currentUser) return;
    try {
      const docRef = await addDoc(collection(db, 'transactions'), {
        brokerId: auth.currentUser.uid,
        description: 'Teste Debug Isolado',
        value: 1,
        createdAt: new Date().toISOString()
      });
      addLog('Criar Transaction Teste', `Sucesso! Documento gerado com ID: ${docRef.id}`);
    } catch (e: any) {
      addLog('Criar Transaction Teste', null, e);
    }
  };

  return (
    <div className="p-10 font-mono text-sm bg-white min-h-screen text-black space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-gray-200 pb-6 flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Ferramenta de Diagnóstico Firestore</h1>
                <p className="text-gray-500 mt-1">Status: {user ? 'Autenticado' : 'Aguardando Login'}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Environment</p>
                <p className="font-bold text-xs">Firebase SDK Pure</p>
            </div>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conexão</p>
                <p><strong>Project ID:</strong> {app.options.projectId}</p>
                <p className="truncate"><strong>App ID:</strong> {app.options.appId}</p>
            </div>
            <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Usuário</p>
                <p className="truncate"><strong>UID:</strong> {user?.uid || '---'}</p>
                <p><strong>Email:</strong> {user?.email || '---'}</p>
                <p><strong>UserType:</strong> {userProfile?.userType || 'N/A'}</p>
            </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button onClick={testTransactions} className="h-14 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md">Ler Transactions</button>
            <button onClick={testEvents} className="h-14 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md">Ler Events</button>
            <button onClick={testLeads} className="h-14 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all shadow-md">Ler Leads</button>
            <button onClick={testCreateTransaction} className="h-14 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg">Criar Transação</button>
        </div>

        <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Logs de Execução</h2>
                <button onClick={() => setLogs([])} className="text-xs text-gray-400 hover:text-black underline">Limpar Histórico</button>
            </div>
            
            {logs.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                    <p className="text-gray-400 italic">Nenhum teste executado até o momento.</p>
                </div>
            )}
            
            <div className="space-y-4">
                {logs.map((log, i) => (
                    <div key={i} className={cn(
                        "p-6 rounded-2xl border transition-all animate-in fade-in slide-in-from-top-2",
                        log.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    )}>
                        <div className="flex justify-between items-start mb-4">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest", log.success ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800")}>
                                {log.success ? 'Success' : 'Failure'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">{log.timestamp}</span>
                        </div>
                        <p className="font-bold text-base mb-2">{log.action}</p>
                        
                        {log.success ? (
                            <p className="text-green-700 font-medium">{log.result}</p>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-white/50 rounded-lg border border-red-100">
                                    <p className="text-red-700 font-bold">Code: {log.error.code}</p>
                                    <p className="text-red-600 text-sm mt-1">{log.error.message}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-red-300 uppercase tracking-widest">Stack Trace</p>
                                    <pre className="text-[10px] text-red-400 bg-black/5 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all font-mono">
                                        {log.error.stack}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
