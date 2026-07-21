/**
 * @fileOverview blockLoader.ts - Motor de Carregamento de Blocos
 */

import { BLOCK_REGISTRY } from '../registry/blockRegistry';
import { BlockDefinition } from '../sdk.types';

/**
 * Localiza e retorna a definição de um bloco pelo ID.
 * Lança erro caso o bloco não seja encontrado para garantir integridade.
 */
export function getBlock(blockId: string): BlockDefinition {
  const block = BLOCK_REGISTRY[blockId];

  if (!block) {
    throw new Error(`[ExperienceLoader] Bloco "${blockId}" não encontrado no registro.`);
  }

  return block;
}

/**
 * Lista todos os blocos registrados por categoria.
 */
export function getBlocksByCategory(category: string): BlockDefinition[] {
  return Object.values(BLOCK_REGISTRY).filter(
    (b) => b.manifest.category === category
  );
}
