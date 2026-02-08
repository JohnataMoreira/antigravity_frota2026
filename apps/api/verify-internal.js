const http = require('http');

console.log('🔍 Testando conectividade interna: http://web:80');

const req = http.get('http://web:80', (res) => {
    console.log(`✅ Conexão bem-sucedida!`);
    console.log(`Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`Conteúdo recebido: ${data.substring(0, 100)}...`);
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.error(`❌ Erro de conexão: ${err.message}`);
    process.exit(1);
});

req.setTimeout(5000, () => {
    console.error('❌ Timeout: O site não respondeu em 5 segundos.');
    req.destroy();
    process.exit(1);
});
