const autocannon = require('autocannon');
const { promisify } = require('util');

async function runLoadTest() {
  const url = process.env.API_URL || 'http://localhost:3000';
  const token = process.env.AUTH_TOKEN;

  if (!token) {
    console.error('AUTH_TOKEN is required for testing authenticated routes.');
    process.exit(1);
  }

  const routes = [
    { name: 'Get Vehicles', path: '/api/v1/vehicles' },
    { name: 'Get Journeys', path: '/api/v1/journeys' },
    { name: 'Get Health', path: '/api/v1/health' }
  ];

  for (const route of routes) {
    console.log(`\nBenchmarking ${route.name} (${route.path})...`);
    
    const result = await autocannon({
      url: `${url}${route.path}`,
      connections: 10,
      pipelining: 1,
      duration: 10,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`  Requests/sec: ${result.requests.average}`);
    console.log(`  Latency (P99): ${result.latency.p99} ms`);
    console.log(`  Errors: ${result.errors}`);
  }
}

runLoadTest().catch(console.error);
