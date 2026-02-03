
'use client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, TrendingUp, Minus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDoc, useFirebase, useMemoFirebase, useCollection, useAuthContext } from "@/firebase";
import Link from "next/link";
import { doc, collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";


type UserProfile = {
    userType: 'admin' | 'broker' | 'constructor';
    planId?: string;
};

type BrokerProfile = {
    slug: string;
};

type Property = {
    id: string;
};

type Portfolio = {
  propertyIds: string[];
}

// This is the main dashboard page, rendered within the layout.
export default function DashboardPage() {
  const { user, userProfile, isReady } = useAuthContext();
  const [currentDate, setCurrentDate] = useState('');
  
  const { firestore } = useFirebase();

  const brokerDocRef = useMemoFirebase(
      () => (firestore && user && userProfile?.userType === 'broker' ? doc(firestore, 'brokers', user.uid) : null),
      [firestore, user, userProfile]
  );
  const { data: brokerProfile, isLoading: isBrokerLoading } = useDoc<BrokerProfile>(brokerDocRef);
  const isBroker = userProfile?.userType === 'broker';

  // --- Data fetching for property usage ---
  const planDocRef = useMemoFirebase(
    () => (firestore && userProfile?.planId ? doc(firestore, 'plans', userProfile.planId) : null),
    [firestore, userProfile]
  );
  const { data: planData, isLoading: isPlanLoading } = useDoc<{ propertyLimit?: number }>(planDocRef);

  const brokerPropertiesQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, 'brokerProperties'), where('brokerId', '==', user.uid)) : null),
    [user, firestore]
  );
  const { data: brokerProperties, isLoading: areBrokerPropsLoading } = useCollection<{id: string}>(brokerPropertiesQuery);

  const [portfolioProperties, setPortfolioProperties] = useState<Property[]>([]);
  const [arePortfolioPropertiesLoading, setArePortfolioPropertiesLoading] = useState(true);

  const portfolioDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'portfolios', user.uid) : null),
    [firestore, user]
  );
  const { data: portfolio, isLoading: isPortfolioLoading } = useDoc<Portfolio>(portfolioDocRef);
  
  useEffect(() => {
      const fetchPortfolioProperties = async () => {
          if (!firestore || !portfolio) {
              setPortfolioProperties([]);
              setArePortfolioPropertiesLoading(false);
              return;
          }

          const propertyIds = portfolio.propertyIds || [];
          if (propertyIds.length === 0) {
              setPortfolioProperties([]);
              setArePortfolioPropertiesLoading(false);
              return;
          }
          
          setArePortfolioPropertiesLoading(true);
          const propertiesData: Property[] = [];
          const propertiesRef = collection(firestore, 'properties');

          for (let i = 0; i < propertyIds.length; i += 30) {
              const batch = propertyIds.slice(i, i + 30);
              if (batch.length > 0) {
                  const q = query(propertiesRef, where('__name__', 'in', batch));
                  const propertiesSnap = await getDocs(q);
                  propertiesSnap.forEach(doc => {
                      propertiesData.push({ id: doc.id, ...doc.data() } as Property);
                  });
              }
          }
          setPortfolioProperties(propertiesData);
          setArePortfolioPropertiesLoading(false);
      };

      if (!isPortfolioLoading) {
          fetchPortfolioProperties();
      }
  }, [firestore, portfolio, isPortfolioLoading]);

  const isUsageLoading = !isReady || isPlanLoading || areBrokerPropsLoading || isPortfolioLoading || arePortfolioPropertiesLoading;
  
  const propertyLimit = planData?.propertyLimit;
  const avulsoCount = brokerProperties?.length || 0;
  const portfolioCount = portfolioProperties?.length || 0;
  const totalPropertyCount = avulsoCount + portfolioCount;
  const usagePercentage = (propertyLimit && propertyLimit > 0) ? (totalPropertyCount / propertyLimit) * 100 : 0;
  // --- End data fetching ---

  useEffect(() => {
    setCurrentDate(format(new Date(), "dd 'de' MMM, yyyy", { locale: ptBR }));
  }, []);
  
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative w-full bg-white rounded-xl shadow-soft border border-primary/40 overflow-hidden group mb-8">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent pointer-events-none"></div>
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/30 transition-all duration-500"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between p-1">
          <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-5 p-5">
            <div className="flex items-center justify-center size-12 rounded-xl bg-primary text-secondary shadow-sm shrink-0 border border-primary-hover/20">
              <span className="material-symbols-outlined text-[26px]">
                campaign
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-secondary tracking-tight">
                  Aumente Suas Vendas com Insights de IA
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-white uppercase tracking-wider">
                  Novo Recurso
                </span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                Nosso novo motor de IA analisa automaticamente os padrões de
                interação para destacar seus prospects mais promissores. Comece
                a fechar negócios mais rápido hoje.
              </p>
            </div>
          </div>
          <div className="w-full md:w-auto flex items-center gap-3 px-5 pb-5 md:pb-0 md:pr-5">
            <Button
              variant="ghost"
              className="flex-1 md:flex-none h-10 px-4"
            >
              Dispensar
            </Button>
            <Button className="flex-1 md:flex-none h-10 px-5">
              Experimente Agora
              <span className="material-symbols-outlined text-[18px] ml-2">
                arrow_forward
              </span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground tracking-tight">
            Bom dia, {user?.displayName || 'usuário'}.
          </h2>
          <p className="text-gray-500 mt-1 text-base">
            Aqui está sua visão geral diária para{" "}
            <span className="text-foreground font-semibold">{currentDate}</span>.
          </p>
        </div>
        <div className="flex gap-3">
           {isBroker && brokerProfile?.slug && (
            <Button asChild variant="default" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
              <Link href={`/sites/${brokerProfile.slug}`} target="_blank">
                <span className="material-symbols-outlined text-[18px] mr-2">public</span>
                Ver meu Site
              </Link>
            </Button>
          )}
          <Button variant="outline">Exportar Relatório</Button>
          <Button>
            <span className="material-symbols-outlined text-[18px] mr-2">
              add_task
            </span>
            Adicionar Tarefa
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-50 rounded-lg text-green-700">
                <span className="material-symbols-outlined">attach_money</span>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 text-xs font-bold"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                12%
              </Badge>
            </div>
            <p className="text-gray-500 text-sm font-medium">Comissão Total</p>
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              R$142,500
            </h3>
            <p className="text-xs text-gray-400 mt-2">
              vs. R$127,200 mês passado
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
                <span className="material-symbols-outlined">
                  real_estate_agent
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 text-xs font-bold"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                2%
              </Badge>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Anúncios Ativos
            </p>
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              24
            </h3>
            <p className="text-xs text-gray-400 mt-2">4 fechamentos pendentes</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
                <span className="material-symbols-outlined">group_add</span>
              </div>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 text-xs font-bold"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                5%
              </Badge>
            </div>
            <p className="text-gray-500 text-sm font-medium">Novos Leads (Hoje)</p>
          </CardHeader>
          <CardContent>
            <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
              8
            </h3>
            <p className="text-xs text-gray-400 mt-2">3 prospects quentes</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:border-primary/50 transition-all cursor-default">
            <CardHeader>
                <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
                    <span className="material-symbols-outlined">inventory_2</span>
                </div>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground size-8">
                    <Link href="/dashboard/loja">
                        <span className="material-symbols-outlined text-base">edit</span>
                    </Link>
                </Button>
                </div>
                <p className="text-gray-500 text-sm font-medium">Uso de Imóveis</p>
            </CardHeader>
            <CardContent>
                { isUsageLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-2 w-full mt-2" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
                ) : (
                <>
                    <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight">
                    {totalPropertyCount}
                    <span className="text-lg text-muted-foreground"> / {propertyLimit ?? '∞'}</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-2">
                    Imóveis ativos (Carteira + Avulsos)
                    </p>
                    <Progress value={usagePercentage} className="h-2 mt-4 mb-2" />
                    <p className="text-xs text-muted-foreground">
                    {usagePercentage.toFixed(0)}% do seu plano utilizado.
                    </p>
                </>
                )}
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-foreground">Crescimento da Receita</CardTitle>
                <p className="text-sm text-gray-500">Jan - Dez 2023</p>
              </div>
              <div className="flex gap-2">
                {/* This could be a Select component */}
                <select className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg focus:ring-primary focus:border-primary cursor-pointer">
                  <option>Este Ano</option>
                  <option>Ano Passado</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-64 w-full">
              {/* Chart would be implemented here using a library like Recharts */}
               <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 50">
                <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#8cf91f" stopOpacity={0.4}></stop>
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0}></stop>
                </linearGradient>
                </defs>
                <line stroke="#f3f4f6" strokeWidth="0.5" x1="0" x2="100" y1="0" y2="0"></line>
                <line stroke="#f3f4f6" strokeWidth="0.5" x1="0" x2="100" y1="12.5" y2="12.5"></line>
                <line stroke="#f3f4f6" strokeWidth="0.5" x1="0" x2="100" y1="25" y2="25"></line>
                <line stroke="#f3f4f6" strokeWidth="0.5" x1="0" x2="100" y1="37.5" y2="37.5"></line>
                <line stroke="#f3f4f6" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50"></line>
                <path d="M0,45 C10,40 10,35 20,38 C30,41 30,25 40,20 C50,15 50,18 60,15 C70,12 70,5 80,8 C90,11 90,20 100,10 L100,50 L0,50 Z" fill="url(#chartGradient)"></path>
                <path d="M0,45 C10,40 10,35 20,38 C30,41 30,25 40,20 C50,15 50,18 60,15 C70,12 70,5 80,8 C90,11 90,20 100,10" fill="none" stroke="#8cf91f" strokeWidth="0.8"></path>
                </svg>
            </div>
             <div className="flex justify-between mt-4 px-2 text-xs text-gray-400 font-medium uppercase tracking-wider">
                <span>Jan</span>
                <span>Mar</span>
                <span>Mai</span>
                <span>Jul</span>
                <span>Set</span>
                <span>Nov</span>
            </div>
          </CardContent>
        </Card>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="shadow-soft flex-1 flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">Próximas Tarefas</CardTitle>
                <Button variant="link" className="p-0 h-auto text-sm text-primary">
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 flex-1">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                <Checkbox id="task1" className="mt-0.5" />
                <div className="grid gap-0.5">
                  <label htmlFor="task1" className="text-sm font-semibold text-foreground">Ligar para João da Silva</label>
                  <p className="text-xs text-gray-500">Re: Visita ao 123 Maple Street</p>
                </div>
                <Badge variant="outline" className="ml-auto bg-orange-50 text-orange-500 border-orange-500/0">Alta</Badge>
              </div>
               <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                <Checkbox id="task2" className="mt-0.5" />
                <div className="grid gap-0.5">
                  <label htmlFor="task2" className="text-sm font-semibold text-foreground">Revisar Contrato</label>
                  <p className="text-xs text-gray-500">Para unidade 4B, The Heights</p>
                </div>
                 <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-500 border-blue-500/0">Média</Badge>
              </div>
               <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                <Checkbox id="task3" className="mt-0.5" />
                <div className="grid gap-0.5">
                  <label htmlFor="task3" className="text-sm font-semibold text-foreground">Follow up Leads</label>
                  <p className="text-xs text-gray-500">Visitantes do open house</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card className="shadow-soft overflow-hidden">
        <CardHeader>
           <div className="flex justify-between items-center">
            <CardTitle className="text-foreground">Consultas Recentes</CardTitle>
            <Button variant="link" className="text-sm p-0 h-auto text-primary">
              Ver Todos os Leads
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Lead</TableHead>
                <TableHead>Imóvel de Interesse</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-foreground flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  Jane Doe
                </TableCell>
                <TableCell>Vila de Luxo, Beverly Hills</TableCell>
                <TableCell>24 de Out, 2023</TableCell>
                <TableCell><Badge variant="outline" className="bg-primary/20 text-green-800">Novo</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon"><span className="material-symbols-outlined">more_vert</span></Button></TableCell>
              </TableRow>
               <TableRow>
                <TableCell className="font-medium text-foreground flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>MS</AvatarFallback>
                  </Avatar>
                  Michael Scott
                </TableCell>
                <TableCell>Complexo de Escritórios, Scranton</TableCell>
                <TableCell>23 de Out, 2023</TableCell>
                <TableCell><Badge variant="outline" className="bg-yellow-100 text-yellow-800">Contactado</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon"><span className="material-symbols-outlined">more_vert</span></Button></TableCell>
              </TableRow>
               <TableRow>
                <TableCell className="font-medium text-foreground flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>DW</AvatarFallback>
                  </Avatar>
                  Dwight Wilson
                </TableCell>
                <TableCell>Fazenda, Condado Rural</TableCell>
                <TableCell>22 de Out, 2023</TableCell>
                <TableCell><Badge variant="outline" className="bg-green-100 text-green-800">Qualificado</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon"><span className="material-symbols-outlined">more_vert</span></Button></TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium text-foreground flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>AK</AvatarFallback>
                  </Avatar>
                  Angela Kinsley
                </TableCell>
                <TableCell>Condomínio para Gatos, Centro</TableCell>
                <TableCell>21 de Out, 2023</TableCell>
                <TableCell><Badge variant="outline" className="bg-gray-100 text-gray-600">Perdido</Badge></TableCell>
                <TableCell className="text-right"><Button variant="ghost" size="icon"><span className="material-symbols-outlined">more_vert</span></Button></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
