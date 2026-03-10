const http = require('http');

async function post(path, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': payload.length
            }
        }, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => resolve({ status: res.statusCode, body: body.substring(0, 500) }));
        });
        req.on('error', (e) => reject(new Error(`Request failed: ${e.message}`)));
        req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log('--- Testing Login ---');
    try {
        const loginRes = await post('/auth/login', {
            email: 'admin@paraopeba.com.br',
            password: 'Frota@2026'
        });
        console.log('Login Status:', loginRes.status);
        console.log('Login Body Snippet:', loginRes.body);
    } catch (e) {
        console.error('Login Failed:', e.message);
    }

    console.log('\n--- Testing Register Org ---');
    try {
        const timestamp = Date.now();
        const registerRes = await post('/auth/register-org', {
            firstName: 'Test',
            lastName: 'User',
            orgName: 'Test Org ' + timestamp,
            document: 'DOC' + timestamp,
            email: 'test' + timestamp + '@example.com',
            password: 'Password123'
        });
        console.log('Register Status:', registerRes.status);
        console.log('Register Body Snippet:', registerRes.body);
    } catch (e) {
        console.error('Register Failed:', e.message);
    }
}

runTests();
