/**
 * shared/lib/api/l2.ts
 * Deterministic L2 blockchain receipt generator.
 */

import type { L2ProofReceipt } from './types';

export function getL2Details(
  ideaId: string,
  ipHash: string,
  createdAt: string,
): L2ProofReceipt {
  const cleanId   = ideaId.replace(/[^a-f0-9]/g, '') || 'fecde';
  const seed      = cleanId.slice(0, 8);
  const val       = parseInt(seed, 16) || 123_456;

  const network     = val % 2 === 0 ? 'Arbitrum One' : 'Polygon POS';
  const blockNumber = 12_450_000 + (val % 100_000);
  const gasUsed     = 120_000   + (val % 15_000);
  const txHash      = `0x${ipHash.slice(0, 30)}${cleanId.slice(0, 30)}`
    .toLowerCase()
    .slice(0, 66);

  return { txHash, blockNumber, network, gasUsed, timestamp: createdAt };
}
