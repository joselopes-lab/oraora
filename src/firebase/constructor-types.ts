export interface Constructor {
  id: string;
  name: string;
  ownerId: string;
  members: {
    uid: string;
    role: 'admin' | 'gerente' | 'vendas' | 'marketing';
  }[];
}
