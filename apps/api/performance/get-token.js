const axios = require('axios');

async function getStagingToken() {
  const STAGING_URL = 'https://frota.johnatamoreira.com.br/api';
  const email = `bench.${Date.now()}@test.com`;
  const password = 'password123';

  console.log(`Registering bench user: ${email}...`);
  try {
    const res = await axios.post(`${STAGING_URL}/v1/auth/register-org`, {
      firstName: 'Bench',
      lastName: 'Test',
      orgName: 'Bench Org',
      email,
      password
    });

    console.log('--- TOKEN START ---');
    console.log(res.body?.access_token || res.data?.access_token);
    console.log('--- TOKEN END ---');
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
  }
}

getStagingToken();
