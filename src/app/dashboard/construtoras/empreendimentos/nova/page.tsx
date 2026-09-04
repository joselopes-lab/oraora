'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createProjectServer } from '../actions.server';
import locationData from '@/lib/location-data.json';
import { useToast } from '@/hooks/use-toast';

const projectFormSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  estado: z.string().min(1, "O estado é obrigatório."),
  cidade: z.string().min(1, "A cidade é obrigatória."),
  bairro: z.string().min(1, "O bairro é obrigatório."),
  address: z.string().optional(),
  cep: z.string().optional(),
});

export default function NewProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const states = locationData.states;

  const form = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: { name: '', estado: '', cidade: '', bairro: '', address: '', cep: '' },
  });

  const watchState = form.watch('estado');
  const watchCity = form.watch('cidade');

  const availableCities = states.find(s => s.uf === watchState || s.name === watchState)?.cities || [];
  const availableNeighborhoods = availableCities.find(c => c.name === watchCity)?.neighborhoods || [];

  async function onSubmit(values: z.infer<typeof projectFormSchema>) {
    setIsSubmitting(true);
    try {
      const result = await createProjectServer({
        name: values.name,
        localizacao: {
          estado: values.estado,
          cidade: values.cidade,
          bairro: values.bairro,
          address: values.address,
          cep: values.cep,
        }
      });
      toast({ title: 'Empreendimento criado!', description: 'Redirecionando...' });
      if (result.success && result.projectId) {
        router.push(`/dashboard/construtoras/empreendimentos/${result.projectId}`);
      }
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao criar' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Novo Empreendimento</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="estado" render={({ field }) => (
                <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <select {...field} className="w-full rounded-md border p-2">
                        <option value="">Selecione...</option>
                        {states.map(s => <option key={s.uf} value={s.uf}>{s.name}</option>)}
                    </select>
                </FormItem>
            )} />
            <FormField control={form.control} name="cidade" render={({ field }) => (
                <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <select {...field} className="w-full rounded-md border p-2" disabled={!watchState}>
                        <option value="">Selecione...</option>
                        {availableCities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="bairro" render={({ field }) => (
              <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <select {...field} className="w-full rounded-md border p-2" disabled={!watchCity}>
                      <option value="">Selecione...</option>
                      {availableNeighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
              </FormItem>
          )} />
          <Button type="submit" disabled={isSubmitting}>Salvar</Button>
        </form>
      </Form>
    </main>
  );
}
