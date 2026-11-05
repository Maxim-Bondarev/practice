import request from 'supertest';
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

describe('Notifications API (e2e)', () => {
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

  async function createApplication(title: string): Promise<string> {
    const response = await request(server())
      .post('/applications')
      .set(asUser(AUTHOR))
      .send({ title, project: 'Music' })
      .expect(201);
    return response.body.id as string;
  }

  function listNotifications(user = ADMIN, query: object = {}) {
    return request(server())
      .get('/notifications')
      .set(asUser(user))
      .query(query);
  }

  function markRead(body: object, user = ADMIN) {
    return request(server())
      .post('/notifications/read')
      .set(asUser(user))
      .send(body);
  }

  it('notifies administrators and scopes the list by recipient', async () => {
    const applicationId = await createApplication('Нужен сайт');

    const admin = await listNotifications(ADMIN).expect(200);
    expect(admin.body.unreadCount).toBe(1);
    expect(admin.body.items).toHaveLength(1);
    expect(admin.body.items[0]).toMatchObject({
      kind: 'application_created',
      applicationId,
      applicationTitle: 'Нужен сайт',
      actorName: AUTHOR.username,
      read: false,
    });

    const author = await listNotifications(AUTHOR).expect(200);
    expect(author.body).toEqual({ items: [], unreadCount: 0 });

    const stranger = await listNotifications(STRANGER).expect(200);
    expect(stranger.body).toEqual({ items: [], unreadCount: 0 });

    await request(server()).get('/notifications').expect(401);
  });

  it('marks notifications as read individually and in bulk', async () => {
    await createApplication('Первая заявка');

    const first = await listNotifications(ADMIN).expect(200);
    const notificationId = first.body.items[0].id as string;

    // A different user cannot mark the notification as read.
    await markRead({ ids: [notificationId] }, STRANGER).expect(204);
    const untouched = await listNotifications(ADMIN).expect(200);
    expect(untouched.body.unreadCount).toBe(1);

    await markRead({ ids: [notificationId] }, ADMIN).expect(204);
    const read = await listNotifications(ADMIN).expect(200);
    expect(read.body.unreadCount).toBe(0);
    expect(read.body.items[0].read).toBe(true);

    const unreadOnly = await listNotifications(ADMIN, {
      unreadOnly: 'true',
    }).expect(200);
    expect(unreadOnly.body.items).toEqual([]);

    await createApplication('Вторая заявка');

    const beforeBulk = await listNotifications(ADMIN).expect(200);
    expect(beforeBulk.body.unreadCount).toBe(1);

    await markRead({ all: true }, ADMIN).expect(204);

    const afterBulk = await listNotifications(ADMIN).expect(200);
    expect(afterBulk.body.unreadCount).toBe(0);
    expect(
      afterBulk.body.items.every((item: { read: boolean }) => item.read),
    ).toBe(true);
  });

  it('validates read requests', async () => {
    await markRead({}).expect(400);
    await markRead({ ids: ['not-a-uuid'] }).expect(400);

    await request(server())
      .post('/notifications/read')
      .send({ all: true })
      .expect(401);
  });

  it('notifies the author when an administrator replies in the chat', async () => {
    const applicationId = await createApplication('Нужен сайт');

    await markRead({ all: true }, ADMIN).expect(204);

    await request(server())
      .post(`/applications/${applicationId}/chat/messages`)
      .set(asUser(ADMIN))
      .send({ text: 'Ответ администратора' })
      .expect(201);

    const author = await listNotifications(AUTHOR).expect(200);
    expect(author.body.unreadCount).toBe(1);
    expect(author.body.items[0]).toMatchObject({
      kind: 'message_created',
      applicationId,
      applicationTitle: 'Нужен сайт',
      actorName: ADMIN.username,
      text: 'Ответ администратора',
      read: false,
    });

    // The administrator does not notify themselves.
    const admin = await listNotifications(ADMIN).expect(200);
    expect(admin.body.unreadCount).toBe(0);
    expect(admin.body.items).toHaveLength(1);
    expect(admin.body.items[0]).toMatchObject({
      kind: 'application_created',
      read: true,
    });
  });
});
