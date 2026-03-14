const { io } = require('socket.io-client');

async function runWSStressTest() {
  const url = process.env.WS_URL || 'https://frota.johnatamoreira.com.br';
  const quota = 50; // Number of concurrent connections
  const connections = [];

  console.log(`Starting WebSocket stress test with ${quota} connections to ${url}...`);

  for (let i = 0; i < quota; i++) {
    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket'],
      secure: true,
      rejectUnauthorized: false
    });

    socket.on('connect', () => {
      if (i % 10 === 0) console.log(`  Connection ${i} established.`);
    });

    socket.on('connect_error', (err) => {
      console.error(`  Connection ${i} error:`, err.message);
    });

    connections.push(socket);
  }

  // Keep connections open for 10 seconds
  await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('Closing connections...');
  connections.forEach(s => s.close());
  console.log('WS Stress Test Completed.');
}

runWSStressTest().catch(console.error);
