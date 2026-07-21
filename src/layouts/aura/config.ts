/**
 * @fileOverview Configurações Visuais do Layout Aura
 * Define apenas aparência, nunca lógica.
 */

export const config = {
  spacing: 'comfortable',
  borderRadius: '3xl',
  animation: 'fade-up',
  shadow: 'xl',
  glass: true,
  typography: {
    heading: 'Plus Jakarta Sans',
    body: 'Inter'
  },
  variants: {
    hero: 'side-by-side',
    header: 'floating-glass',
    footer: 'modern-centered',
    cta: 'gradient-box',
    card: 'minimalist-info',
    search: 'dual-mode-tabs'
  }
};
