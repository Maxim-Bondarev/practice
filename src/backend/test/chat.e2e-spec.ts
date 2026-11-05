import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { Project } from '../src/common/domain';
import {
  ADMIN,
  asUser,
  AUTHOR,
  createTestApp,
  resetDatabase,
  seedAdmin,
  STRANGER,
  tick,
  type TestApp,
} from './e2e-support';

describe('Chat API (e2e)', () => {
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
    title = 'Нужен сайт',
    project: Project = 'Music',
  ): Promise<string> {
    const response = await request(server())
      .post('/applications')
      .set(asUser(AUTHOR))
      .send({ title, project })
      .expect(201);
    return response.body.id as string;
  }

  function sendMessage(
    applicationId: string,
    body: { text?: string },
    user = AUTHOR,
  ) {
    return request(server())
      .post(`/applications/${applicationId}/chat/messages`)
      .set(asUser(user))
      .send(body);
  }

  it('adds messages to the feed, updates stats and notifies participants', async () => {
    const applicationId = await createApplication();

    const authorMessage = await sendMessage(
      applicationId,
      { text: 'Привет' },
      AUTHOR,
    ).expect(201);
    expect(authorMessage.body).toMatchObject({
      type: 'message',
      applicationId,
      authorId: AUTHOR.id,
      authorName: AUTHOR.username,
      isAdmin: false,
      text: 'Привет',
    });
    expect(authorMessage.body.attachment).toBeUndefined();

    await tick();

    const adminMessage = await sendMessage(
      applicationId,
      { text: 'Здравствуйте' },
      ADMIN,
    ).expect(201);
    expect(adminMessage.body).toMatchObject({
      type: 'message',
      authorId: ADMIN.id,
      isAdmin: true,
      text: 'Здравствуйте',
    });

    const feed = await request(server())
      .get(`/applications/${applicationId}/chat`)
      .expect(200);
    expect(feed.body.map((item: { type: string }) => item.type)).toEqual([
      'status',
      'message',
      'message',
    ]);
    expect(feed.body[1].text).toBe('Привет');
    expect(feed.body[2].text).toBe('Здравствуйте');

    const application = await request(server())
      .get(`/applications/${applicationId}`)
      .expect(200);
    expect(application.body.messagesCount).toBe(2);
    expect(application.body.lastMessageAt).not.toBeNull();

    const authorNotifications = await request(server())
      .get('/notifications')
      .set(asUser(AUTHOR))
      .expect(200);
    expect(authorNotifications.body.unreadCount).toBe(1);
    expect(authorNotifications.body.items[0]).toMatchObject({
      kind: 'message_created',
      applicationId,
      applicationTitle: 'Нужен сайт',
      actorName: ADMIN.username,
      text: 'Здравствуйте',
    });

    const adminNotifications = await request(server())
      .get('/notifications')
      .set(asUser(ADMIN))
      .expect(200);
    // The application creation and the author's message.
    expect(adminNotifications.body.unreadCount).toBe(2);
    expect(adminNotifications.body.items[0]).toMatchObject({
      kind: 'message_created',
      actorName: AUTHOR.username,
      text: 'Привет',
    });
  });

  it('rejects unauthorized participants and empty messages', async () => {
    const applicationId = await createApplication();

    await request(server())
      .post(`/applications/${applicationId}/chat/messages`)
      .send({ text: 'Привет' })
      .expect(401);

    await sendMessage(applicationId, { text: 'Привет' }, STRANGER).expect(403);

    await sendMessage(applicationId, {}, AUTHOR).expect(400);

    await sendMessage(applicationId, { text: 'x'.repeat(2001) }, AUTHOR).expect(
      400,
    );

    await request(server())
      .post('/applications/999999/chat/messages')
      .set(asUser(AUTHOR))
      .send({ text: 'Привет' })
      .expect(404);
  });

  it('stores attachments and serves them by id', async () => {
    const applicationId = await createApplication();

    const response = await request(server())
      .post(`/applications/${applicationId}/chat/messages`)
      .set(asUser(AUTHOR))
      .field('text', 'Лог ошибки')
      .attach('file', Buffer.from('hello world'), {
        filename: 'error.txt',
        contentType: 'text/plain',
      })
      .expect(201);

    expect(response.body.text).toBe('Лог ошибки');
    expect(response.body.attachment).toMatchObject({
      name: 'error.txt',
      size: 11,
      type: 'text/plain',
    });

    const file = await request(server())
      .get(`/files/${response.body.attachment.id}`)
      .expect(200);
    expect(file.headers['content-type']).toContain('text/plain');
    expect(file.headers['content-disposition']).toContain('error.txt');
    expect(file.text).toBe('hello world');

    const feed = await request(server())
      .get(`/applications/${applicationId}/chat`)
      .expect(200);
    expect(feed.body[1].attachment).toEqual(response.body.attachment);

    await request(server()).get(`/files/${randomUUID()}`).expect(404);
    await request(server()).get('/files/not-a-uuid').expect(404);
  });

  it('supports the after cursor and rejects invalid values', async () => {
    const applicationId = await createApplication();

    const initial = await request(server())
      .get(`/applications/${applicationId}/chat`)
      .expect(200);
    const firstCreatedAt = initial.body[0].createdAt as string;

    await tick();

    const message = await sendMessage(applicationId, { text: 'Ответ' }).expect(
      201,
    );

    const incremental = await request(server())
      .get(`/applications/${applicationId}/chat`)
      .query({ after: firstCreatedAt })
      .expect(200);
    expect(incremental.body).toHaveLength(1);
    expect(incremental.body[0].id).toBe(message.body.id);

    await request(server())
      .get(`/applications/${applicationId}/chat`)
      .query({ after: 'not-a-date' })
      .expect(400);

    await request(server()).get('/applications/999999/chat').expect(404);
  });
});
