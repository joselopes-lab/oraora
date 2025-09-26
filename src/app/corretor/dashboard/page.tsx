
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Home, ExternalLink, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

function ShareableLink({ userId }: { userId: string }) {
    const { toast } = useToast();
    const [publicUrl, setPublicUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPublicUrl(`${window.location.origin}/corretor-publico/${userId}`);
        }
    }, [userId]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl).then(() => {
            toast({ title: 'Link Copiado!', description: 'O link do seu site público foi copiado para a área de transferência.' });
        }, (err) => {
            toast({ variant: 'destructive', title: 'Falha ao copiar', description: 'Não foi possível copiar o link.' });
        });
    };
    
    if(!publicUrl) return null;

    return (
        <div className="space-y-2 pt-6">
            <Label htmlFor="public-url">Link do seu Site Público</Label>
            <div className="flex items-center gap-2">
                <Input id="public-url" value={publicUrl} readOnly className="bg-muted" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copiar link</span>
                </Button>
            </div>
             <p className="text-xs text-muted-foreground">
                Compartilhe este link com seus clientes para que eles vejam seus imóveis.
            </p>
        </div>
    );
}


export default function CorretorDashboardPage() {
  const [user] = useAuthState(auth);

  return (
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><Home /> Dashboard do Corretor</CardTitle>
                    <CardDescription>Bem-vindo ao seu painel! Utilize o menu para gerenciar seus clientes e sua carteira de imóveis.</CardDescription>
                </div>
                {user && (
                    <Button asChild variant="outline">
                        <Link href={`/corretor-publico/${user.uid}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Ver Meu Site Público
                        </Link>
                    </Button>
                )}
            </div>
        </CardHeader>
        <CardContent>
            <p>Selecione uma opção no menu lateral para começar.</p>
            {user && <ShareableLink userId={user.uid} />}
        </CardContent>
      </Card>
  );
}
