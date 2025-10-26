import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@app/app.module';

describe('CorrelationId & Retry-After (API smoke)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('adds x-correlation-id and returns Retry-After on throttled endpoint', async () => {
    const server = app.getHttpServer();
    const agent = request(server);

    // Use a @SkipCsrf throttled endpoint to avoid CSRF: webauthn login/start has @Throttle(10/min)
    for (let i = 0; i < 10; i++) {
      await agent.post('/auth/webauthn/login/start').send({ email: 'smoke@example.com' }).expect(200);
    }

    const res = await agent
      .post('/auth/webauthn/login/start')
      .set('x-correlation-id', 'cid-e2e-001')
      .send({ email: 'smoke@example.com' })
      .expect(429);

    // Should include retry-after header and x-correlation-id echoed by middleware
    expect(res.header['retry-after']).toBeDefined();
    expect(res.header['x-correlation-id']).toBeDefined();
  });
});