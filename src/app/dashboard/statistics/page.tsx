'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Label } from '@/components/ui/label';
import { Loader2, BarChart as BarChartIcon, TrendingUp, TrendingDown, LocateFixed } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { type Property } from '../properties/page';
import { getStates, getCitiesByState, type State, type City } from '@/services/location';

interface PriceData {
  neighborhood: string;
  averagePricePerSqm: number;
  propertyCount: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export default function StatisticsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [isLoadingStates, setIsLoadingStates] = useState(true);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'properties'), (snapshot) => {
      const propsData = snapshot.docs.map(doc => doc.data() as Property);
      setProperties(propsData);
      setIsLoading(false);
    });

    async function loadStates() {
      setIsLoadingStates(true);
      const statesData = await getStates();
      setStates(statesData);
      setIsLoadingStates(false);
    }
    loadStates();

    return () => unsubscribe();
  }, []);

  const handleStateChange = async (stateAcronym: string) => {
    setSelectedState(stateAcronym);
    setSelectedCity('');
    setIsLoadingCities(true);
    setCities([]);
    if(stateAcronym){
      const citiesData = await getCitiesByState(stateAcronym);
      setCities(citiesData);
    }
    setIsLoadingCities(false);
  };

  const processedData = useMemo<PriceData[]>(() => {
    if (!selectedCity) return [];

    const cityProperties = properties.filter(
      (p) =>
        p.localizacao.cidade === selectedCity &&
        p.informacoesbasicas.valor &&
        p.caracteristicasimovel.tamanho
    );

    const neighborhoodData: { [key: string]: { totalValue: number; totalArea: number; count: number } } = {};

    cityProperties.forEach((p) => {
      const neighborhood = p.localizacao.bairro;
      if (!neighborhood) return;

      const price = p.informacoesbasicas.valor;
      // '55 - 75m²' -> 55, '60m²' -> 60
      const areaString = p.caracteristicasimovel.tamanho || '';
      const area = parseFloat(areaString.split('-')[0].trim());

      if (price && area > 0) {
        if (!neighborhoodData[neighborhood]) {
          neighborhoodData[neighborhood] = { totalValue: 0, totalArea: 0, count: 0 };
        }
        neighborhoodData[neighborhood].totalValue += price;
        neighborhoodData[neighborhood].totalArea += area;
        neighborhoodData[neighborhood].count++;
      }
    });

    return Object.entries(neighborhoodData)
        .map(([neighborhood, data]) => ({
            neighborhood,
            averagePricePerSqm: data.totalValue / data.totalArea,
            propertyCount: data.count,
        }))
        .sort((a, b) => b.averagePricePerSqm - a.averagePricePerSqm);
  }, [properties, selectedCity]);

  const summary = useMemo(() => {
    if(processedData.length === 0) return { cityAverage: 0, mostExpensive: null, leastExpensive: null };
    
    const totalValue = processedData.reduce((acc, curr) => acc + (curr.averagePricePerSqm * curr.propertyCount), 0);
    const totalCount = processedData.reduce((acc, curr) => acc + curr.propertyCount, 0);

    return {
        cityAverage: totalCount > 0 ? totalValue / totalCount : 0,
        mostExpensive: processedData[0],
        leastExpensive: processedData[processedData.length - 1],
    };
  }, [processedData])

  const chartData = processedData.map(d => ({
    name: d.neighborhood,
    value: d.averagePricePerSqm,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChartIcon />
            Estatísticas de Valor por Metro Quadrado
          </CardTitle>
          <CardDescription>
            Analise o valor médio do m² por bairro com base nos imóveis cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select onValueChange={handleStateChange} value={selectedState} disabled={isLoadingStates}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingStates ? 'Carregando...' : 'Selecione um estado'} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => <SelectItem key={s.id} value={s.sigla}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Select onValueChange={setSelectedCity} value={selectedCity} disabled={!selectedState || isLoadingCities}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingCities ? 'Carregando...' : 'Selecione uma cidade'} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {!isLoading && selectedCity && (
            processedData.length > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Média da Cidade</CardTitle>
                      <LocateFixed className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(summary.cityAverage)}/m²</div>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bairro Mais Caro</CardTitle>
                      <TrendingUp className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(summary.mostExpensive?.averagePricePerSqm || 0)}/m²</div>
                      <p className="text-xs text-muted-foreground">{summary.mostExpensive?.neighborhood}</p>
                    </CardContent>
                  </Card>
                   <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Bairro Mais Barato</CardTitle>
                      <TrendingDown className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{formatCurrency(summary.leastExpensive?.averagePricePerSqm || 0)}/m²</div>
                      <p className="text-xs text-muted-foreground">{summary.leastExpensive?.neighborhood}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle>Valor do m² por Bairro em {selectedCity}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{}} className="min-h-[400px] w-full">
                       <ResponsiveContainer width="100%" height={400}>
                          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                            <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
                            <ChartTooltip 
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="p-2 bg-background border rounded-lg shadow-lg">
                                        <p className="font-bold">{payload[0].payload.name}</p>
                                        <p className="text-sm text-primary">{formatCurrency(payload[0].value as number)}/m²</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                            />
                            <Bar dataKey="value" name="Valor m²">
                               {chartData.map((entry, index) => {
                                   let color = 'hsl(var(--primary))';
                                   if (entry.name === summary.mostExpensive?.neighborhood) color = 'hsl(var(--destructive))';
                                   if (entry.name === summary.leastExpensive?.neighborhood) color = '#10B981'; // emerald-500
                                   return <Bar key={`cell-${index}`} dataKey="value" fill={color} />;
                               })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-16">
                <p>Nenhum dado de imóvel encontrado para a cidade selecionada.</p>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
