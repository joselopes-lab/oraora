'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useFirestore, useMemoFirebase } from '@/firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, ShieldCheck, Lock, Eye, EyeOff, Check } from 'lucide-react';
import { useDoc } from '@/firebase';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidCode, setIsValidCode] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const defaultLogo = PlaceHolderImages.find(img => img.id === 'default-logo')?.imageUrl;

  const siteContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'brokers', 'oraora-main-site') : null),
    [firestore]
  );
  const { data: siteData } = useDoc<{ logoUrl?: string }>(siteContentRef);

  // Senha deve ter no mínimo 8 caracteres
  const isMinLength = password.length >= 8;
  const isMatch = password === confirmPassword && confirmPassword !== '';

  useEffect(() => {
    const verifyCode = async () => {
      if (!auth || !oobCode) {
        setIsValidCode(false);
        setIsVerifying(false);
        return;
      }
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (err: any) {
        console.error("Erro ao verificar código:", err);
        setIsValidCode(false);
      } finally {
        setIsVerifying(false);
      }
    };
    verifyCode();
  }, [auth, oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !oobCode) return;

    if (!isMinLength) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (!isMatch) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setIsSuccess(true);
      toast({
        title: "Senha alterada!",
        description: "Sua nova senha já está ativa.",
      });
    } catch (err: any) {
      console.error("Erro ao confirmar reset:", err);
      let message = "Ocorreu um erro ao redefinir sua senha. Tente solicitar um novo link.";
      if (err.code === 'auth/expired-action-code') message = "O link de redefinição expirou.";
      if (err.code === 'auth/invalid-action-code') message = "O link de redefinição é inválido.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="size-12 animate-spin text-primary mb-4" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Validando Token de Segurança...</p>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {isSuccess ? (
        <motion.div 
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center text-center space-y-8 py-4"
        >
          <div className="relative">
            <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_50px_rgba(43,242,13,0.3)] border-2 border-primary/30">
              <CheckCircle2 className="size-12" />
            </div>
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute -top-1 -right-1 size-8 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <Zap className="size-4 text-primary fill-current" />
            </motion.div>
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white tracking-tight uppercase">Senha Alterada!</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
              Sua senha foi redefinida com sucesso. Agora você pode acessar sua conta utilizando sua nova senha.
            </p>
          </div>

          <Button asChild className="w-full h-14 bg-primary hover:bg-primary-hover text-slate-900 font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-glow border-none transition-all">
            <Link href="/login" className="flex items-center gap-2">
              Ir para o Login
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      ) : !isValidCode ? (
        <motion.div 
          key="error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center space-y-8 py-4"
        >
          <div className="size-20 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
            <AlertCircle className="size-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Este link não é mais válido</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[260px] mx-auto">O link expirou, já foi utilizado ou é tecnicamente inválido.</p>
          </div>
          <Button asChild variant="outline" className="w-full h-14 bg-transparent border-white/10 text-white hover:bg-white/5 rounded-2xl font-bold">
            <Link href="/login" className="flex items-center gap-2">
              Solicitar Novo Link
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src={siteData?.logoUrl || defaultLogo || ""} alt="Oraora Logo" width={160} height={40} className="h-10 w-auto brightness-0 invert" style={{ width: 'auto' }} />
            </Link>
          </div>
          
          <div className="flex flex-col gap-3 text-center">
            <h1 className="text-white tracking-tighter text-3xl font-black uppercase leading-tight">
              Redefinir sua senha
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Crie uma nova senha para acessar sua conta com segurança.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1" htmlFor="password">Nova Senha</Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  <Lock className="size-5" />
                </span>
                <Input 
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary transition-all font-bold"
                  placeholder="********"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors outline-none cursor-pointer border-none bg-transparent"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] ml-1" htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                  <ShieldCheck className="size-5" />
                </span>
                <Input 
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary transition-all font-bold"
                  placeholder="********"
                />
                 <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors outline-none cursor-pointer border-none bg-transparent"
                >
                  {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Password Policy Helpers */}
            <div className="grid grid-cols-1 gap-2 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <div className={cn("size-4 rounded-full flex items-center justify-center transition-all", isMinLength ? "bg-primary text-slate-900" : "bg-white/5 text-slate-600")}>
                        <Check className="size-2.5 stroke-[4]" />
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-tight transition-colors", isMinLength ? "text-slate-100" : "text-slate-500")}>Mínimo de 8 caracteres</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={cn("size-4 rounded-full flex items-center justify-center transition-all", isMatch ? "bg-primary text-slate-900" : "bg-white/5 text-slate-600")}>
                        <Check className="size-2.5 stroke-[4]" />
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-tight transition-colors", isMatch ? "text-slate-100" : "text-slate-500")}>Confirmação idêntica</span>
                </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3 items-center text-red-400"
              >
                <AlertCircle className="size-5 shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-tight">{error}</p>
              </motion.div>
            )}

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting || !isMinLength || !isMatch} 
                className="w-full h-14 bg-primary hover:bg-primary-hover text-slate-900 font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-glow transition-all active:scale-[0.98] border-none cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Alterando Senha...</span>
                  </div>
                ) : (
                  <>
                    Confirmar Alteração
                    <ArrowRight className="size-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
          
          <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] pt-4 border-t border-white/5">
            <ShieldCheck className="size-4 text-primary opacity-50" />
            Criptografia de Ponta a Ponta
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="bg-slate-950 min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden font-display">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] opacity-20"></div>
      </div>
      
      <div className="w-full max-w-[480px] z-10 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-2xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 flex">
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8 }}
                className="h-full bg-primary shadow-[0_0_15px_rgba(43,242,13,0.5)]"
            />
        </div>
        
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="size-10 animate-spin text-primary" /></div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>

      <div className="absolute bottom-8 w-full text-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] opacity-50">
        © 2025 Oraora Tecnologia • Sistemas de Alta Performance
      </div>
    </div>
  );
}
