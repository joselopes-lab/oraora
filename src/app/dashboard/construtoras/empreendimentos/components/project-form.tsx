'use client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const projectSchema = z.object({
  name: z.string().min(1, "O nome do empreendimento é obrigatório."),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

type ProjectFormProps = {
    projectData?: Partial<ProjectFormData>;
    onSave: (data: ProjectFormData) => void;
    isSubmitting?: boolean;
};

export default function ProjectForm({ projectData, onSave, isSubmitting }: ProjectFormProps) {
    const form = useForm<ProjectFormData>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: projectData?.name || '',
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Empreendimento</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Residencial Horizonte" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
            </form>
        </Form>
    );
}
