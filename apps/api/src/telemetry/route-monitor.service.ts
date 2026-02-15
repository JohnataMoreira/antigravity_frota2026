import { Injectable } from '@nestjs/common';
import { Geofence } from '@prisma/client';

@Injectable()
export class RouteMonitorService {
    /**
     * Calculates the distance from a point to a polyline (planned route) in meters.
     * Uses the Haversine formula for distance between points.
     */
    getDistanceFromRoute(point: [number, number], route: [number, number][]): number {
        if (!route || route.length < 2) return 0;

        let minDistance = Infinity;

        for (let i = 0; i < route.length - 1; i++) {
            const distance = this.distToSegment(point, route[i], route[i + 1]);
            if (distance < minDistance) {
                minDistance = distance;
            }
        }

        return minDistance;
    }

    /**
     * Checks if a point is inside a geofence.
     */
    isPointInsideGeofence(point: [number, number], geofence: Geofence): boolean {
        const coords = geofence.coordinates as any;

        if (geofence.type === 'CIRCLE') {
            const distance = this.getDistance(point, coords.center);
            return distance <= coords.radius;
        }

        if (geofence.type === 'POLYGON') {
            return this.isPointInPolygon(point, coords as [number, number][]);
        }

        return true;
    }

    private distToSegment(p: [number, number], v: [number, number], w: [number, number]): number {
        const l2 = this.getDistanceSq(v, w);
        if (l2 === 0) return this.getDistance(p, v);

        // Project point p onto line segment vw
        let t = ((p[0] - v[0]) * (w[0] - v[0]) + (p[1] - v[1]) * (w[1] - v[1])) / l2;
        t = Math.max(0, Math.min(1, t));

        const projection: [number, number] = [
            v[0] + t * (w[0] - v[0]),
            v[1] + t * (w[1] - v[1])
        ];

        return this.getDistance(p, projection);
    }

    private getDistance(p1: [number, number], p2: [number, number]): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = p1[0] * Math.PI / 180;
        const φ2 = p2[0] * Math.PI / 180;
        const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
        const Δλ = (p2[1] - p1[1]) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private getDistanceSq(p1: [number, number], p2: [number, number]): number {
        return Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2);
    }

    private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i][0], yi = polygon[i][1];
            const xj = polygon[j][0], yj = polygon[j][1];

            const intersect = ((yi > point[1]) !== (yj > point[1])) &&
                (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }
}
