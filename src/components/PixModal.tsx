'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Copy, QrCode, Clock, X, ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PixModalProps {
  isOpen: boolean;
  onClose: () => void;
  pixData: {
    id: string;
    amount: number;
    brCode: string;
    brCodeBase64: string;
    expiresAt?: string;
    status?: string;
  } | null;
  planName?: string;
  onSuccess?: () => void;
}

export default function PixModal({
  isOpen,
  onClose,
  pixData,
  planName = 'Plano OraOra',
  onSuccess
}: PixModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(3600);
  const [checking, setChecking] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Check payment status from API
  const verifyPaymentStatus = useCallback(async () => {
    if (!pixData?.id || isPaid) return;
    try {
      setChecking(true);
      const res = await fetch(`/api/pix/check?id=${encodeURIComponent(pixData.id)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const currentStatus = (json.data.status || '').toUpperCase();
        if (currentStatus === 'PAID' || currentStatus === 'COMPLETED' || currentStatus === 'SETTLED') {
          setIsPaid(true);
          if (onSuccess) onSuccess();
        }
      }
    } catch (err) {
      console.warn('Erro ao checar status do PIX:', err);
    } finally {
      setChecking(false);
    }
  }, [pixData?.id, isPaid, onSuccess]);

  // Polling interval
  useEffect(() => {
    if (!isOpen || !pixData?.id || isPaid) return;

    const interval = setInterval(() => {
      verifyPaymentStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, pixData?.id, isPaid, verifyPaymentStatus]);

  useEffect(() => {
    if (!isOpen) return;

    if (pixData?.expiresAt) {
      const expTime = new Date(pixData.expiresAt).getTime();
      const diff = Math.floor((expTime - Date.now()) / 1000);
      if (diff > 0) {
        setTimeLeft(diff);
      }
    } else {
      setTimeLeft(3600);
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, pixData]);

  if (!isOpen || !pixData) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixData.brCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar código PIX:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedAmount = (pixData.amount >= 100 && Number.isInteger(pixData.amount)
    ? pixData.amount / 100
    : pixData.amount
  ).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-in fade-in duration-300">
      <div className="bg-[#0a0a0a] text-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-white/10 relative text-left space-y-6 animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          <X className="size-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e900]/10 border border-[#00e900]/20 text-[#00e900] text-xs font-bold uppercase tracking-wider">
            <QrCode className="size-3.5" />
            PIX Transparente Abacate Pay
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white mt-2">
            Escaneie o QR Code
          </h3>
          <p className="text-sm text-zinc-400 font-medium">
            Pagamento instantâneo para <strong className="text-white">{planName}</strong>
          </p>
        </div>

        {/* Amount & Timer */}
        <div className="bg-zinc-900/90 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block">Valor a pagar</span>
            <span className="text-2xl font-black text-[#00e900] tracking-tight">{formattedAmount}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block flex items-center gap-1 justify-end">
              <Clock className="size-3 text-amber-400" /> Expira em
            </span>
            <span className="text-lg font-mono font-bold text-amber-400">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* QR Code Image */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-inner">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <img
              src={pixData.brCodeBase64 || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.brCode || '')}`}
              alt="QR Code PIX"
              className="w-full h-full object-contain rounded-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (pixData.brCode && !target.src.includes('qrserver.com')) {
                  target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.brCode)}`;
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium mt-2">
            <Loader2 className="size-3 animate-spin text-[#00e900]" />
            <span>Aguardando detecção do pagamento via Abacate Pay...</span>
          </div>
        </div>

        {/* Copia e Cola */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
            Pix Copia e Cola
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={pixData.brCode}
              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-300 pr-24 focus:outline-none focus:border-[#00e900]"
            />
            <Button
              onClick={handleCopyCode}
              className={`absolute right-1.5 h-9 px-4 rounded-lg font-bold text-xs transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#00e900] text-black hover:bg-[#00d000]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="size-3.5 mr-1.5" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="size-3.5 mr-1.5" /> Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="space-y-3 pt-2">
          <Button
            onClick={async () => {
              await verifyPaymentStatus();
              if (onSuccess) onSuccess();
              onClose();
            }}
            disabled={checking}
            className="w-full h-12 rounded-xl font-bold bg-[#00e900] text-black hover:bg-[#00d000] text-sm shadow-[0_0_20px_rgba(0,233,0,0.3)] flex items-center justify-center gap-2"
          >
            {checking ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
            <span>Já realizei o pagamento</span>
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium">
            <ShieldCheck className="size-4 text-[#00e900]" />
            <span>Transação processada com segurança via Abacate Pay</span>
          </div>
        </div>

      </div>
    </div>
  );
}
