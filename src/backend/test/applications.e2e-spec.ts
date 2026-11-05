import request from 'supertest';
import type { ApplicationStatus, Project } from '../src/common/domain';
import {
  ADMIN,
  asUser,
  AUTHOR,
  createTestApp,
  resetDatabase,
  seedAdmin,
  STRANGER,
  type TestApp,
} from './e2e-support';

describe('Applications API (e2e)', () => {
  let context: TestApp;

  beforeAll(async () => {
    context = await createTestApp();
  });

  afterAll(async () => {
    await context.app.close();
  });

  beforeEach(async () => {
    await resetDatabase(context.dataSource);
    await seedAdmin(context.dataSource);
  });

  const server = () => context.app.getHttpServer();

  async function createApplication(
    user = AUTHOR,
    title = 'Нужен сайт',
    project: Project = 'Music',
  ): Promise<{ id: string; [key: string]: unknown }> {
    const response = await request(server())
      .post('/applications')
      .set(asUser(user))
      .send({ title, project })
      .expect(201);

    return response.body as { id: string; [key: string]: unknown };
  }

  function changeStatus(
    id: string,
    status: ApplicationStatus,
    user = AUTHOR,
  ) {
    return request(server())
      .patch(`/applications/${id}/status`)
      .set(asUser(user))
      .send({ status });
  }

  it('creates an application with an initial status event and notifies admins', async () => {
    const created = await createApplication();

    expect(created).toMatchObject({
      title: 'Нужен сайт',
      project: 'Music',
      status: 'Открыта',
      authorId: AUTHOR.id,
      authorName: AUTHOR.username,
      messagesCount: 0,
      lastMessageAt: null,
    });
    expect(created.id).toMatch(/^\d+$/);

    const chat = await request(server())
      .get(`/applications/${created.id}/chat`)
      .expect(200);
    expect(chat.body).toHaveLength(1);
    expect(chat.body[0]).toMatchObject({
      type: 'status',
      applicationId: created.id,
      authorId: AUTHOR.id,
      status: 'Открыта',
    });
    expect(chat.body[0].previousStatus).toBeUndefined();

    const notifications = await request(server())
      .get('/notifications')
      .set(asUser(ADMIN))
      .expect(200);
    expect(notifications.body.unreadCount).toBe(1);
    expect(notifications.body.items[0]).toMatchObject({
      kind: 'application_created',
      applicationId: created.id,
      applicationTitle: 'Нужен сайт',
      actorName: AUTHOR.username,
      status: 'Открыта',
      read: false,
    });
  });

  it('validates create payloads and requires authentication', async () => {
    await request(server())
      .post('/applications')
      .set(asUser(AUTHOR))
      .send({ title: '   ', project: 'Music' })
      .expect(400);

    await request(server())
      .post('/applications')
      .set(asUser(AUTHOR))
      .send({ title: 'Нужен сайт', project: 'Unknown' })
      .expect(400);

    await request(server())
      .post('/applications')
      .send({ title: 'Нужен сайт', project: 'Music' })
      .expect(401);
  });

  it('filters, searches and sorts applications', async () => {
    const first = await createApplication(AUTHOR, 'Alpha site', 'Music');
    const second = await createApplication(AUTHOR, 'Beta app', 'Delivery');
    const third = await createApplication(ADMIN, 'Gamma portal', '1X');

    const newest = await request(server()).get('/applications').expect(200);
    expect(newest.body.map((item: { id: string }) => item.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);

    const oldest = await request(server())
      .get('/applications')
      .query({ sort: 'oldest' })
      .expect(200);
    expect(oldest.body.map((item: { id: string }) => item.id)).toEqual([
      first.id,
      second.id,
      third.id,
    ]);

    const open = await request(server())
      .get('/applications')
      .query({ status: 'Открыта' })
      .expect(200);
    expect(open.body).toHaveLength(3);

    const closed = await request(server())
      .get('/applications')
      .query({ status: 'Закрыта' })
      .expect(200);
    expect(closed.body).toEqual([]);

    const music = await request(server())
      .get('/applications')
      .query({ project: 'Music' })
      .expect(200);
    expect(music.body.map((item: { id: string }) => item.id)).toEqual([
      first.id,
    ]);

    const search = await request(server())
      .get('/applications')
      .query({ search: 'beta' })
      .expect(200);
    expect(search.body.map((item: { id: string }) => item.id)).toEqual([
      second.id,
    ]);

    const mine = await request(server())
      .get('/applications')
      .set(asUser(AUTHOR))
      .query({ mine: 'true' })
      .expect(200);
    expect(mine.body.map((item: { id: string }) => item.id)).toEqual([
      second.id,
      first.id,
    ]);

    await request(server())
      .get('/applications')
      .query({ mine: 'true' })
      .expect(401);
  });

  it('rejects invalid list filters', async () => {
    await request(server())
      .get('/applications')
      .query({ status: 'Неизвестный статус' })
      .expect(400);

    await request(server())
      .get('/applications')
      .query({ mine: 'maybe' })
      .expect(400);

    await request(server())
      .get('/applications')
      .query({ sort: 'popular' })
      .expect(400);
  });

  it('enforces status transitions and records them in the chat', async () => {
    const created = await createApplication();

    await changeStatus(created.id, 'В обработке', AUTHOR).expect(403);

    const closed = await changeStatus(created.id, 'Закрыта', AUTHOR).expect(200);
    expect(closed.body.status).toBe('Закрыта');

    await changeStatus(created.id, 'Закрыта', AUTHOR).expect(409);
    await changeStatus(created.id, 'Открыта', STRANGER).expect(403);

    const reopened = await changeStatus(created.id, 'Открыта', ADMIN).expect(200);
    expect(reopened.body.status).toBe('Открыта');

    const adminNotifications = await request(server())
      .get('/notifications')
      .set(asUser(ADMIN))
      .expect(200);
    expect(adminNotifications.body.unreadCount).toBe(2);
    expect(
      adminNotifications.body.items.map((item: { kind: string }) => item.kind),
    ).toEqual(['status_changed', 'application_created']);

    const authorNotifications = await request(server())
      .get('/notifications')
      .set(asUser(AUTHOR))
      .expect(200);
    expect(authorNotifications.body.unreadCount).toBe(1);
    expect(authorNotifications.body.items[0]).toMatchObject({
      kind: 'status_changed',
      applicationId: created.id,
      status: 'Открыта',
      previousStatus: 'Закрыта',
      actorName: ADMIN.username,
    });

    const chat = await request(server())
      .get(`/applications/${created.id}/chat`)
      .expect(200);
    expect(chat.body.map((item: { type: string }) => item.type)).toEqual([
      'status',
      'status',
      'status',
    ]);
    expect(chat.body[1]).toMatchObject({
      status: 'Закрыта',
      previousStatus: 'Открыта',
    });
    expect(chat.body[2]).toMatchObject({
      status: 'Открыта',
      previousStatus: 'Закрыта',
    });
  });

  it('returns 404 for missing applications', async () => {
    await request(server()).get('/applications/999999').expect(404);
    await request(server()).get('/applications/not-a-number').expect(404);
  });
});
