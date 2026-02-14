import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    namespace: 'locations',
    cors: { origin: '*' },
})
export class LocationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(private jwtService: JwtService) { }

    async handleConnection(client: Socket) {
        const token = client.handshake.auth.token?.split(' ')[1] || client.handshake.auth.token;

        if (!token) {
            console.log('WS Connection error: No token provided');
            client.disconnect();
            return;
        }

        try {
            const payload = this.jwtService.verify(token);
            const organizationId = payload.organizationId;

            if (!organizationId) {
                console.log('WS Connection error: No organizationId in token');
                client.disconnect();
                return;
            }

            // Join tenant room
            client.join(`org_${organizationId}`);
            console.log(`Client connected and joined room: org_${organizationId}`);
        } catch {
            console.log('WS Connection error: Invalid token');
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }
}
