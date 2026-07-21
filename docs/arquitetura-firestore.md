# Arquitetura de Acesso ao Firestore - Oraora

Este documento define os padrões obrigatórios para a realização de consultas e escrita de regras de segurança no projeto Oraora, visando eliminar erros de permissão e garantir a escalabilidade do sistema.

## 1. O Princípio "Regras não são Filtros"

O erro mais comum no Firestore é assumir que as regras filtrarão os dados automaticamente. **O Firestore não filtra, ele apenas valida se a sua consulta é capaz de retornar apenas o que é permitido.**

### O Erro
*   **Regra:** `allow list: if resource.data.brokerId == request.auth.uid;`
*   **Query:** `query(collection(db, 'networkRequestResponses'))`
*   **Resultado:** `FirebaseError: Missing or insufficient permissions.` (Pois a query tenta ler a coleção inteira).

### A Solução
*   **Regra:** `allow list: if resource.data.brokerId == request.auth.uid;`
*   **Query:** `query(collection(db, 'networkRequestResponses'), where('brokerId', '==', user.uid))`
*   **Resultado:** Sucesso. A query prova ao Firestore que ela nunca tentará ler dados de terceiros.

---

## 2. Padrão de Consulta (Hooks)

Todas as consultas realizadas via `useCollection` devem seguir este padrão de segurança:

### A. Memoização e Proteção de Autenticação
Nunca crie queries sem garantir que o `user.uid` e `userProfile` estão disponíveis e o estado `isReady` é verdadeiro.

```tsx
const myQuery = useMemoFirebase(() => {
  // 1. Sempre verifique o estado de prontidão e a existência do UID
  if (!isReady || !user?.uid || !userProfile || !firestore) return null;

  // 2. Sempre aplique o filtro de propriedade/acesso exigido pela regra
  // Se a aba for "Meus Itens":
  return query(
    collection(firestore, 'minha_colecao'),
    where('brokerId', '==', user.uid), // Filtro obrigatório para conformidade com 'list'
    orderBy('createdAt', 'desc')
  );
}, [isReady, user?.uid, userProfile, firestore]);

const { data, isLoading } = useCollection(myQuery);
```

---

## 3. Padrão de Escrita de Regras (firestore.rules)

As regras devem ser específicas e separar `get` de `list` quando necessário.

### A. Diferenciação entre Read, Get e List
*   `get`: Leitura de um único documento (via ID).
*   `list`: Consultas que retornam múltiplos documentos. Deve-se sempre prever qual campo será o filtro da query.

### B. Exemplo de Regra Robusta
```rules
match /minha_colecao/{id} {
  // Para buscar um item específico, o usuário deve ser o dono ou admin
  allow get: if isOwner(resource.data.brokerId) || isAdmin();

  // Para listar itens, a query DEVE conter o filtro pelo brokerId do usuário
  allow list: if (isSignedIn() && request.query.where.get('brokerId') == request.auth.uid) || isAdmin();
}
```

---

## 4. Adicionando Novas Coleções

Ao adicionar uma nova funcionalidade, siga este checklist:

1.  **Entidade:** Defina a estrutura em `docs/backend.json`.
2.  **Regra de Escrita:** Defina quem pode criar/editar (geralmente `isOwner` no `request.resource`).
3.  **Regra de Listagem:** Defina qual campo será o filtro obrigatório (ex: `brokerId`, `clientId`, `participantIds`).
4.  **Implementação UI:** Garanta que o componente utilize `isReady` e aplique o `where` correspondente à regra de `list`.

---
**Nota:** Este padrão é crítico. Consultas sem filtros em coleções privadas impactam diretamente a segurança e o custo (faturamento) do projeto.