'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';

export default function FormularioParticipacao() {
  const [formData, setFormData] = useState({
    nome: '',
    whatsapp: '',
    cidade: '',
    creci: '',
    instagram: '',
    site: '',
    especialidade: '',
    sobre: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    // Validação básica
    if (!formData.nome || !formData.whatsapp || !formData.cidade || !formData.especialidade) {
      setStatus('error');
      setErrorMessage('Por favor, preencha os campos obrigatórios (Nome, WhatsApp, Cidade e Especialidade).');
      return;
    }

    // Simulação de envio elegante e seguro sem persistência em backend não aprovado
    setTimeout(() => {
      setStatus('success');
      setFormData({
        nome: '',
        whatsapp: '',
        cidade: '',
        creci: '',
        instagram: '',
        site: '',
        especialidade: '',
        sobre: '',
      });
    }, 1000);
  };

  return (
    <section id="formulario" className="py-28 md:py-36 bg-white text-zinc-900 border-t border-zinc-100">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#1db308]" />
            Inscrição na Campanha
          </div>
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-zinc-900 mb-4">
            Envie sua história
          </h2>
          <p className="text-zinc-600 text-base md:text-lg font-light">
            Compartilhe sua trajetória conosco. Os profissionais selecionados farão parte das próximas etapas da campanha.
          </p>
        </div>

        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 rounded-3xl bg-zinc-50 border border-[#2bf20d]/40 text-center space-y-6 shadow-sm"
          >
            <div className="w-16 h-16 bg-[#2bf20d]/20 text-[#1db308] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-light text-zinc-900">História enviada com sucesso</h3>
            <p className="text-zinc-600 font-light max-w-md mx-auto">
              Agradecemos sua participação. Nossa curadoria analisará as informações enviadas de acordo com os critérios da campanha.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="px-8 py-3 rounded-full bg-zinc-900 text-white text-xs font-medium uppercase tracking-wider hover:bg-zinc-800 transition-colors"
            >
              Enviar nova história
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-50 p-8 md:p-12 rounded-3xl border border-zinc-100 shadow-sm">
            
            {status === 'error' && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Ex: Carla Lira"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="(00) 00000-0000"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  Cidade / Estado *
                </label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleChange}
                  placeholder="Ex: São Paulo — SP"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  CRECI
                </label>
                <input
                  type="text"
                  name="creci"
                  value={formData.creci}
                  onChange={handleChange}
                  placeholder="Ex: CRECI 00000-F"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  Especialidade *
                </label>
                <input
                  type="text"
                  name="especialidade"
                  value={formData.especialidade}
                  onChange={handleChange}
                  placeholder="Ex: Alto Padrão"
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  Instagram
                </label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@seuinstagram"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                  Site Profissional
                </label>
                <input
                  type="text"
                  name="site"
                  value={formData.site}
                  onChange={handleChange}
                  placeholder="https://seusite.com.br"
                  className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-zinc-700 mb-2">
                Conte um pouco sobre você
              </label>
              <textarea
                name="sobre"
                rows={4}
                value={formData.sobre}
                onChange={handleChange}
                placeholder="Sua trajetória, sua visão sobre o mercado e sua relação com os clientes..."
                className="w-full px-4 py-3.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 focus:outline-none focus:border-zinc-900 transition-colors text-sm resize-none"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-zinc-500 font-light text-center sm:text-left">
                As inscrições serão avaliadas de acordo com os critérios da campanha.
              </p>
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-900 text-white text-xs font-medium uppercase tracking-wider hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Enviando...' : 'Enviar minha história'}
                <Send className="w-3.5 h-3.5 text-[#2bf20d]" />
              </button>
            </div>

          </form>
        )}

      </div>
    </section>
  );
}
