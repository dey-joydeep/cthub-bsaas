import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import jestOpenAPI from 'jest-openapi';
import fs from 'node:fs';
import path from 'node:path';
import { AppModule } from '@app/app.module';

describe('OpenAPI Contract — Auth (production grade spot checks)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const modRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modRef.createNestApplication();
    await app.init();
    const specPath = path.join(process.cwd(), 'docs/specs/auth/API/openapi.yaml');
    const spec = fs.readFileSync(specPath, 'utf8');
    jestOpenAPI(spec);
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/login matches schema', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'secret123' });
    expect(res).toSatisfyApiSpec();
  });

  it('POST /auth/refresh includes envelope and matches schema', async () => {
    const res = await request(app.getHttpServer()).post('/auth/refresh').send({});
    expect(res).toSatisfyApiSpec();
  });

  it('POST /auth/password/change matches schema (401/422)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/password/change')
      .send({ currentPassword: 'x', newPassword: 'y' });
    expect(res).toSatisfyApiSpec();
  });

  it('POST /auth/email/change/confirm matches schema', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/email/change/confirm')
      .send({ token: 'tok' });
    expect(res).toSatisfyApiSpec();
  });
});

