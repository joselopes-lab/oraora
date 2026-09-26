import { extractPropertySearchIntent } from '../src/lib/ora/intent-extractor.server';

async function testExt() {
  const res = await extractPropertySearchIntent({
    message: "quero apartamento em Tambaú com 3 quartos até 650 mil"
  });
  console.log("Result:", res);
}
testExt().catch(console.error);
