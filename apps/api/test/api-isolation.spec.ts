import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    chunkPushNotifications: jest.fn().mockReturnValue([]),
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
  })),
}));

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('API Isolation & Tenant Security (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const mockNotificationsService = {
    sendPushNotificationToUser: jest.fn().mockResolvedValue(true),
    notifyAdmins: jest.fn().mockResolvedValue(true),
  };

  const tenantA = {
    email: `admin.a.${Date.now()}@test.com`,
    password: 'password123',
    orgName: 'Org A',
    token: '',
    orgId: '',
  };

  const tenantB = {
    email: `admin.b.${Date.now()}@test.com`,
    password: 'password123',
    orgName: 'Org B',
    token: '',
    orgId: '',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NotificationsService)
      .useValue(mockNotificationsService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // 1. Register Tenant A
    const resA = await request(app.getHttpServer())
      .post('/api/auth/register-org')
      .send({
        firstName: 'Admin',
        lastName: 'A',
        orgName: tenantA.orgName,
        email: tenantA.email,
        password: tenantA.password,
      });
    tenantA.token = resA.body.access_token;
    tenantA.orgId = resA.body.user.organizationId;

    // 2. Register Tenant B
    const resB = await request(app.getHttpServer())
      .post('/api/auth/register-org')
      .send({
        firstName: 'Admin',
        lastName: 'B',
        orgName: tenantB.orgName,
        email: tenantB.email,
        password: tenantB.password,
      });
    tenantB.token = resB.body.access_token;
    tenantB.orgId = resB.body.user.organizationId;
  });

  afterAll(async () => {
    // Optional: Cleanup test data
    // await prisma.organization.deleteMany({ where: { id: { in: [tenantA.orgId, tenantB.orgId] } } });
    await app.close();
  });

  it('deve isolar veículos por organização', async () => {
    // Tenant A cria veículo
    const vehicleA = await request(app.getHttpServer())
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        plate: `AAA${Math.floor(Math.random() * 1000)}`,
        model: 'Car A',
        type: 'CAR',
        currentKm: 1000,
      });

    // Tenant B cria veículo
    const vehicleB = await request(app.getHttpServer())
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tenantB.token}`)
      .send({
        plate: `BBB${Math.floor(Math.random() * 1000)}`,
        model: 'Car B',
        type: 'CAR',
        currentKm: 2000,
      });

    // Tenant A lista veículos
    const listA = await request(app.getHttpServer())
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${tenantA.token}`);

    expect(listA.body.some((v: any) => v.plate === vehicleA.body.plate)).toBeTruthy();
    expect(listA.body.some((v: any) => v.plate === vehicleB.body.plate)).toBeFalsy();

    // Tenant A tenta acessar veículo do Tenant B diretamente
    const accessB = await request(app.getHttpServer())
      .get(`/api/vehicles/${vehicleB.body.id}`)
      .set('Authorization', `Bearer ${tenantA.token}`);

    expect([403, 404]).toContain(accessB.status);
  });

  it('deve impedir criação de jornada com KM inferior ao atual do veículo', async () => {
    const vehicle = await request(app.getHttpServer())
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        plate: `KM${Math.floor(Math.random() * 1000)}`,
        model: 'KM Test',
        type: 'CAR',
        currentKm: 5000,
      });

    const journey = await request(app.getHttpServer())
      .post('/api/journeys')
      .set('Authorization', `Bearer ${tenantA.token}`)
      .send({
        vehicleId: vehicle.body.id,
        startKm: 4000, // Menor que 5000
      });

    expect(journey.status).toBe(400);
    expect(journey.body.message).toMatch(/KM/i);
  });
});
