import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@app/app.module';
import { PrismaClient } from '@prisma/client';

describe('Auth Sessions Alias IT', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const email = 'alias-it@example.com';
  const password = 'P@ssw0rd!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('revoke via body alias', async () => {
    const server = app.getHttpServer();
    const agent = request.agent(server);

    // Ensure a user exists
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash: '$2a$10$Q6o6a8qkPB/Oo9s4yq7kQe9d2Jv2tQhEStYB9V6r6gT4QXzv2n9j2' },
    });

    // Login
    const loginRes = await agent.post('/auth/login').send({ email, password }).expect(200);
    const setCookie = loginRes.get('set-cookie') as unknown;
    const cookies = Array.isArray(setCookie) ? (setCookie as string[]) : String(setCookie ?? '').split('\n');
    const xsrfCookie = cookies.find((c) => c.startsWith('XSRF-TOKEN=')) || '';
    const xsrfValue = xsrfCookie.split(';')[0].split('=')[1] || '';

    // List sessions
    const list = await agent.get('/auth/sessions').expect(200);
    const sessions: Array<{ id: string }> = list.body;
    expect(sessions.length).toBeGreaterThan(0);
    const sid = sessions[0].id;

    // Revoke via body alias
    await agent.post('/auth/sessions/revoke').set('X-XSRF-TOKEN', xsrfValue).send({ id: sid }).expect(201);

    // Verify it is gone
    const after = await agent.get('/auth/sessions').expect(200);
    const afterSessions: Array<{ id: string }> = after.body;
    expect(afterSessions.find((s) => s.id === sid)).toBeFalsy();
  });
});

