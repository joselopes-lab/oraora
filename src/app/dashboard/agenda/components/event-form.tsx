
'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';


const eventSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.'),
  description: z.string().optional(),
  date: z.string().min(1, 'A data é obrigatória.'),
  time: z.string().optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  client: z.string().optional(),
  broker: z.string().optional(),
  type: z.enum(['reuniao', 'visita', 'tarefa', 'particular', 'outro']).default('reuniao'),
});

export type EventFormData = z.infer<typeof eventSchema>;

type Client = {
    id: string;
    name: string;
}

type EventFormProps = {
  onSave: (data: EventFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  clients: Client[];
  defaultValues?: Partial<EventFormData>;
};

const taskTypes = [
    { id: 'reuniao', label: 'Reunião', icon: 'groups', color: 'text-purple-500' },
    { id: 'visita', label: 'Visita', icon: 'key', color: 'text-blue-500' },
    { id: 'tarefa', label: 'Tarefa', icon: 'check_box', color: 'text-green-500' },
    { id: 'particular', label: 'Particular', icon: 'person', color: 'text-amber-500' },
    { id: 'outro', label: 'Outros', icon: 'more_horiz', color: 'text-gray-500' },
];

export default function EventForm({ onSave, onCancel, isSubmitting, clients, defaultValues }: EventFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0], // Default to today
      time: '',
      duration: '',
      location: '',
      client: '',
      broker: '',
      type: 'reuniao',
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="w-full">
         <div className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-text-secondary hover:text-text-main transition-colors cursor-pointer" onClick={onCancel}>
            <span className="material-symbols-outlined">close</span>
        </div>
        <div className="p-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-text-main">
                        <span className="material-symbols-outlined text-secondary text-[24px]">calendar_add_on</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main tracking-tight">Cadastrar Nova Tarefa</h1>
                </div>
                 <p className="text-text-secondary text-sm ml-13">Preencha os detalhes abaixo para agendar um novo compromisso.</p>
            </div>
            
            <div className="space-y-8">
                 <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="block text-sm font-semibold text-text-main mb-3">Tipo de Tarefa</FormLabel>
                            <FormControl>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                {taskTypes.map((task) => (
                                    <label key={task.id} className="cursor-pointer group">
                                        <input {...field} value={task.id} checked={field.value === task.id} className="peer sr-only" name="task_type" type="radio"/>
                                        <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border-soft bg-white hover:bg-gray-50 peer-checked:border-secondary peer-checked:bg-secondary/10 peer-checked:ring-1 peer-checked:ring-secondary transition-all">
                                            <span className={cn("material-symbols-outlined mb-1 group-hover:scale-110 transition-transform", task.color)}>{task.icon}</span>
                                            <span className="text-xs font-medium text-text-secondary peer-checked:text-text-main peer-checked:font-bold">{task.label}</span>
                                        </div>
                                    </label>
                                ))}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />

                <div className="space-y-5">
                     <FormField control={form.control} name="title" render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="title" className="block text-sm font-semibold text-text-main mb-1.5">Título da Tarefa</FormLabel>
                            <FormControl><Input id="title" placeholder="Ex: Visita ao Edifício Horizon" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                     )}/>
                      <FormField control={form.control} name="description" render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="description" className="block text-sm font-semibold text-text-main mb-1.5">Descrição</FormLabel>
                             <FormControl><Textarea id="description" placeholder="Adicione detalhes importantes sobre a tarefa..." rows={3} {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                          </FormItem>
                     )}/>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                         <FormField control={form.control} name="date" render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="date" className="block text-sm font-semibold text-text-main mb-1.5">Data</FormLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">calendar_today</span>
                                    <FormControl><Input id="date" type="date" className="w-full pl-10" {...field} /></FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                         )}/>
                          <FormField control={form.control} name="time" render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="time" className="block text-sm font-semibold text-text-main mb-1.5">Hora</FormLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">schedule</span>
                                    <FormControl><Input id="time" type="time" className="w-full pl-10" {...field} value={field.value || ''} /></FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                         )}/>
                         <FormField control={form.control} name="duration" render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="duration" className="block text-sm font-semibold text-text-main mb-1.5">Duração <span className="font-normal text-text-secondary text-xs">(opcional)</span></FormLabel>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">timelapse</span>
                                    <FormControl>
                                    <select id="duration" className="w-full pl-10 pr-4 py-2.5 rounded-lg border-gray-300 focus:border-secondary focus:ring-secondary text-sm text-text-main bg-white" {...field}>
                                        <option value="">Selecione...</option>
                                        <option value="15">15 min</option>
                                        <option value="30">30 min</option>
                                        <option value="60">1 hora</option>
                                        <option value="90">1h 30min</option>
                                        <option value="120">2 horas</option>
                                    </select>
                                    </FormControl>
                                </div>
                                <FormMessage />
                              </FormItem>
                         )}/>
                    </div>
                     <FormField control={form.control} name="location" render={({ field }) => (
                          <FormItem>
                            <FormLabel htmlFor="location" className="block text-sm font-semibold text-text-main mb-1.5">Local</FormLabel>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px]">location_on</span>
                                <FormControl><Input id="location" placeholder="Endereço ou link da reunião online" className="w-full pl-10" {...field} value={field.value || ''} /></FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                     )}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-50">
                          <FormField control={form.control} name="client" render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="client" className="block text-sm font-semibold text-text-main mb-1.5">Cliente Associado</FormLabel>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px] group-focus-within:text-secondary transition-colors">person_search</span>
                                    <FormControl><Input id="client" list="clients-list" placeholder="Buscar cliente..." className="w-full pl-10" {...field} value={field.value || ''} disabled={!!defaultValues?.client} /></FormControl>
                                    <datalist id="clients-list">
                                        {clients.map(client => (
                                            <option key={client.id} value={client.name} />
                                        ))}
                                    </datalist>
                                </div>
                                <FormMessage />
                              </FormItem>
                         )}/>
                         <FormField control={form.control} name="broker" render={({ field }) => (
                              <FormItem>
                                <FormLabel htmlFor="broker" className="block text-sm font-semibold text-text-main mb-1.5">Corretor Responsável</FormLabel>
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[20px] group-focus-within:text-secondary transition-colors">badge</span>
                                    <FormControl><Input id="broker" list="brokers-list" placeholder="Selecione o corretor..." className="w-full pl-10" {...field} value={field.value || ''} /></FormControl>
                                    <datalist id="brokers-list">
                                        <option value="Ana Silva"></option>
                                        <option value="Roberto Almeida"></option>
                                        <option value="Juliana Costa"></option>
                                    </datalist>
                                </div>
                                <FormMessage />
                              </FormItem>
                         )}/>
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-end gap-4 pt-6 mt-4 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-lg bg-secondary hover:bg-primary text-white hover:text-black text-sm font-bold shadow-glow hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">save</span>
                    {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
                </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}

  