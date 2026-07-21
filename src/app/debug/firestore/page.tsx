'use client';

import { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

// Inicialização pura e isolada do SDK
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export default function DebugFirestorePage() {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [projectId, setProjectId] = useState<string>('');

  useEffect(() => {
    setProjectId(app.options.projectId || 'N/A');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const runTests = async () => {
    if (!user) {
      alert("Usuário não autenticado. Por favor, faça login primeiro.");
      return;
    }

    const testLogs: any[] = [];
    const addLog = (name: string, status: string, data: any) => {
      console.log(`[TEST: ${name}]`, status, data);
      testLogs.push({ name, status, data });
      setResults([...testLogs]);
    };

    // TESTE 1: Listagem total (Sem filtros)
    try {
      const snap = await getDocs(collection(db, "networkRequests"));
      addLog("Teste 1 (Full List)", "SUCCESS", `Docs: ${snap.docs.length}`);
    } catch (e: any) {
      addLog("Teste 1 (Full List)", "ERROR", e.message);
    }

    // TESTE 2: Filtro de Status
    try {
      const snap = await getDocs(
        query(collection(db, "networkRequests"), where("status", "==", "open"))
      );
      addLog("Teste 2 (Status Filter)", "SUCCESS", `Docs: ${snap.docs.length}`);
    } catch (e: any) {
      addLog("Teste 2 (Status Filter)", "ERROR", e.message);
    }

    // TESTE 3: Filtro de Propriedade
    try {
      const snap = await getDocs(
        query(collection(db, "networkRequests"), where("brokerId", "==", user.uid))
      );
      addLog("Teste 3 (Owner Filter)", "SUCCESS", `Docs: ${snap.docs.length}`);
    } catch (e: any) {
      addLog("Teste 3 (Owner Filter)", "ERROR", e.message);
    }
  };

  return (
    <div className="p-10 font-mono text-sm bg-white min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-6 border-b pb-2">Isolamento Firestore SDK</h1>
      
      <div className="mb-8 space-y-2 bg-gray-50 p-4 rounded border">
        <p><strong>Project ID:</strong> {projectId}</p>
        <p><strong>Auth State:</strong> {user ? 'Autenticado' : 'Deslogado'}</p>
        <p><strong>UID:</strong> {user?.uid || 'N/A'}</p>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={runTests}
          className="px-6 py-3 bg-black text-white font-bold rounded hover:bg-gray-800 transition-all"
        >
          EXECUTAR TESTES ISOLADOS
        </button>
        <button 
          onClick={() => setResults([])}
          className="px-6 py-3 border border-gray-300 rounded"
        >
          Limpar Logs
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold">Resultados da Execução:</h2>
        {results.length === 0 && <p className="text-gray-400 italic">Nenhum teste executado ainda.</p>}
        {results.map((res, i) => (
          <div key={i} className={`p-4 rounded border ${res.status === 'SUCCESS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="font-bold">{res.name}</p>
            <p className={res.status === 'SUCCESS' ? 'text-green-700' : 'text-red-700'}>
              {res.status}: {res.data}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t text-gray-400">
        <p>Abra o console do navegador (F12) para detalhes técnicos adicionais.</p>
      </div>
    </div>
  );
}
