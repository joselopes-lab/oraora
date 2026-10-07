import { requireAgencyAuth } from './src/app/dashboard/imobiliaria/actions.server';

async function run() {
  console.log('--- CALLING requireAgencyAuth DIRECTLY VIA TSX ---');
  try {
    const result = await requireAgencyAuth(undefined, 'mock-test-uid');
    console.log('Result:', result);
  } catch (err: any) {
    console.error('Error occurred in requireAgencyAuth:', err.message);
  }
}

run();
