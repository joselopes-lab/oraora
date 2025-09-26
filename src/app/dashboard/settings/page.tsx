
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>Gerencie as configurações da sua aplicação aqui.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="site-name">Nome do Site</Label>
          <Input id="site-name" defaultValue="PainelSeguro" />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label htmlFor="maintenance-mode" className="font-semibold">Modo Manutenção</Label>
            <p className="text-sm text-muted-foreground">
              Quando ativado, os usuários verão uma página de manutenção.
            </p>
          </div>
          <Switch id="maintenance-mode" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="session-timeout">Tempo Limite da Sessão</Label>
          <Select defaultValue="30">
            <SelectTrigger id="session-timeout" className="w-[180px]">
              <SelectValue placeholder="Selecione o tempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            Desconecta usuários automaticamente após um período de inatividade.
          </p>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button>Salvar Alterações</Button>
      </CardFooter>
    </Card>
  );
}
