# ORAORA NAVIGATION SERVICE 1.0

## Objetivo
Centralizar a geração de URLs para garantir que todos os layouts funcionem corretamente em qualquer ambiente (Portal, Domínio Customizado ou Preview) sem duplicação de lógica.

## Como utilizar

```tsx
import { useNavigation } from '@/lib/navigation/navigationService';

export function MeuComponente({ broker }) {
  const nav = useNavigation(broker.slug);

  return (
    <Link href={nav.home()}>Início</Link>
  );
}
```

## Regras
1. **Nunca** use caminhos de string fixos como `/sobre` ou `/sites/slug/sobre`.
2. **Nunca** use `#` como link de navegação.
3. Se precisar de uma rota nova, adicione-a primeiro no `navigation.types.ts`.
