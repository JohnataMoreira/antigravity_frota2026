const axios = require('axios');

async function testLogin() {
    const url = 'https://api-frota.johnatamoreira.com.br/api/auth/login';
    console.log(`Testing Login at: ${url}`);
    try {
        const response = await axios.post(url, {
            email: 'admin@paraopeba.com.br',
            password: 'password123' // Supondo esta senha ou similar
        });
        console.log('Login Success!');
        console.log('User:', response.data.user.name);
    } catch (error) {
        if (error.response) {
            console.error('Login Failed with status:', error.response.status);
            console.error('Message:', error.response.data.message);
        } else {
            console.error('Network Error:', error.message);
        }
    }
}

testLogin();
