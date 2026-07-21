# ORAORA EXPERIENCE ENGINE 1.0

## Objetivo
Desacoplar os componentes visuais (blocos) dos Temas, permitindo que um mesmo bloco (ex: uma Barra de Busca) possa ser utilizado em múltiplos layouts ou Landing Pages de forma independente.

## Regras de Ouro
1. **Puro**: Nenhum bloco acessa Firestore, Storage ou APIs diretamente.
2. **Prop-Driven**: Todo bloco é um componente React que recebe `BlockProps`.
3. **Sem Estado Global**: Blocos não devem criar Providers ou Hooks que dependam de contexto externo ao SDK.
4. **Manifesto Obrigatório**: Todo bloco deve ser registrado no `blockRegistry` com seu respectivo `manifest`.

## Estrutura de um Bloco
Localização: `src/experience/blocks/{category}/{block-id}/`
- `Component.tsx`: A implementação visual.
- `manifest.ts`: Metadados.
- `config.ts`: Variantes visuais.
- `README.md`: Documentação de uso.

## Fluxo de Carregamento
`App/Page` -> `Experience Loader` -> `Block Registry` -> `Block Component`
