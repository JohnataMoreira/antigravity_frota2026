import {
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
// import { WsJwtGuard } from '../auth/ws-jwt.guard'; // TODO: Implement WS Guard

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: 'locations',
})
export class LocationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    handleConnection(client: Socket) {
        const token = client.handshake.auth.token;
        if (!token) {
            console.log(`Connection rejected: No token for client ${client.id}`);
            // client.disconnect(); // Enable after testing
        }
    }

    handleDisconnect(client: Socket) {
        // Cleanup if needed
    }

    @SubscribeMessage('join_organization')
    handleJoinOrganization(client: Socket, organizationId: string) {
        if (!organizationId) return;

        // Leave previous rooms to avoid multiplexing
        client.rooms.forEach(room => {
            if (room.startsWith('org_')) client.leave(room);
        });

        client.join(`org_${organizationId}`);
        console.log(`Client ${client.id} joined room: org_${organizationId}`);
    }

    @SubscribeMessage('update_location')
    handleLocationUpdate(client: Socket, payload: { vehicleId: string; lat: number; lng: number; organizationId: string }) {
        if (!payload.organizationId) return;

        // Broadcast ONLY to the specific organization room
        this.server.to(`org_${payload.organizationId}`).emit('vehicle_location_updated', payload);
    }
}
