import { reconcilePublicInventory } from '../src/lib/ora/inventory-reconciliation.server';
import { adminDb } from '../src/firebase/index.server';

async function run() {
  console.log("Running real backfill to populate oraPublicInventory...");
  const stats = await reconcilePublicInventory({ dryRun: false, batchSize: 100 });
  console.log("Backfill Stats:", JSON.stringify(stats, null, 2));

  const snap = await adminDb.collection('oraPublicInventory').get();
  console.log(`Total documents in oraPublicInventory after backfill: ${snap.size}`);
}

run().catch(err => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
