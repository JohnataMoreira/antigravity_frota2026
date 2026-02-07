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
        // console.log(`Client connected: ${client.id}`);
        // In real app, verify token in handshake auth
        // const token = client.handshake.auth.token;
    }

    handleDisconnect(client: Socket) {
        // console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join_organization')
    handleJoinOrganization(client: Socket, organizationId: string) {
        client.join(`org_${organizationId}`);
        // console.log(`Client ${client.id} joined org_${organizationId}`);
    }

    @SubscribeMessage('update_location')
    handleLocationUpdate(client: Socket, payload: { vehicleId: string; lat: number; lng: number; organizationId: string }) {
        // Save to DB? Redis? For now, just relay.
        // console.log('Location update', payload);
        this.server.to(`org_${payload.organizationId}`).emit('vehicle_location_updated', payload);
    }
}
