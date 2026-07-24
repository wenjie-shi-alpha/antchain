import { blockchain } from 'src/core/blockchain/index.ts';

const token = await blockchain.auth.getToken();
console.log(token);

// deno run -A src/examples/get-token-example.ts