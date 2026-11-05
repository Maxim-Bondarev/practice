import request from 'supertest';
import { createTestApp, type TestApp } from './e2e-support';

describe('Health (e2e)', () => {
  let context: TestApp;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.app.close();
  });

  it('GET /', () => {
    return request(context.app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
