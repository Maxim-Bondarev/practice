import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Feedback API')
    .setVersion('2.0.0')
    .setDescription(
      [
        'Бэкенд сервиса обращений (заявок) с чатом по каждой заявке.',
        '',
        'Авторизация — Keycloak, realm `practics`: access-токен передаётся в `Authorization: Bearer <jwt>`.',
        'Роль администратора — `admin` в `realm_access.roles`.',
        '',
        'Публичные методы (список/просмотр заявок, чат, файлы) доступны без токена.',
        'Кнопка Authorize принимает JWT и сохраняет его между перезагрузками страницы.',
      ].join('\n'),
    )
    .addServer('http://localhost:9100', 'Backend в docker compose')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Access-токен Keycloak (realm practics). Например, токен клиента frontend.',
      },
      'keycloak',
    )
    .addTag('Applications', 'Заявки и их статусы')
    .addTag('Chat', 'Лента чата заявки (сообщения и смены статуса)')
    .addTag('Files', 'Вложения чата')
    .addTag('Notifications', 'Уведомления текущего пользователя')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    yamlDocumentUrl: 'docs/yaml',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}
