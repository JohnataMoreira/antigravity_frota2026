/**
 * Frota2026 - Fleet Tracking Simulator 🚛
 * Use este script para testar o rastreamento em tempo real no Dashboard Admin.
 * 
 * Uso: node simulate-tracking.js <orgId> <vehicleId> [token]
 */

const { io } = require('socket.io-client');

const args = process.argv.slice(2);
const orgId = args[0] || '123';
const vehicleId = args[1] || 'simulated-truck-1';
const token = args[2] || '';

// URL da API (Ajustado para o seu domínio de produção)
const API_URL = 'https://johnatamoreira.com.br';
const NAMESPACE = '/locations';

console.log(`🚀 Iniciando simulador para Veículo: ${vehicleId} (Org: ${orgId})`);

const socket = io(`${API_URL}${NAMESPACE}`, {
    auth: { token },
    transports: ['websocket']
});

socket.on('connect', () => {
    console.log('✅ Conectado ao Backend! Iniciando transmissão de coordenadas...');

    // Join room just in case (though simulated sender doesn't need to listen)
    socket.emit('join_organization', orgId);

    // Coordenadas iniciais (São Paulo)
    let lat = -23.55052;
    let lng = -46.633309;

    setInterval(() => {
        // Simula movimento leve (jitter)
        lat += (Math.random() - 0.5) * 0.0005;
        lng += (Math.random() - 0.5) * 0.0005;

        console.log(`📍 Enviando: Lat ${lat.toFixed(6)}, Lng ${lng.toFixed(6)}`);

        socket.emit('update_location', {
            vehicleId,
            organizationId: orgId,
            lat,
            lng
        });
    }, 3000); // 3 segundos
});

socket.on('connect_error', (err) => {
    console.error('❌ Erro de conexão:', err.message);
});

socket.on('disconnect', () => {
    console.log('⚠️ Desconectado do servidor.');
});
