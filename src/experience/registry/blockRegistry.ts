/**
 * @fileOverview blockRegistry.ts - Dicionário Mestre de Blocos
 * 
 * Centraliza o registro de todos os blocos disponíveis na Experience Engine.
 */

import { BlockDefinition } from '../sdk.types';

/**
 * O registro começa vazio e será populado à medida que novos blocos 
 * forem extraídos dos layouts ou criados do zero.
 */
export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  // Exemplo de registro futuro:
  // 'hero-standard': { ... },
  // 'grid-premium': { ... },
};
