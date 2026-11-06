# Feedback — сервис приёма и обработки обращений

Веб-сервис для работы с обращениями (заявками) пользователей по нескольким проектам.
Пользователь создаёт заявку и общается с поддержкой в чате заявки (текст и файлы), администратор
отвечает и меняет статус, а все участники получают уведомления.

Проект выполнен в рамках научно-производственной практики. Весь стек (интерфейс, API, база данных
и сервер аутентификации) поднимается одной командой — единственная внешняя зависимость это **Docker**.

## Цель и задачи

**Цель** — разработать воспроизводимый веб-сервис приёма и обработки обращений с ролевым доступом.

**Задачи:**

- описать предметную область, роли и требования (`docs/`);
- описать контракт API в формате OpenAPI (`docs/openapi.yaml`);
- реализовать серверную часть на NestJS с хранением данных в PostgreSQL;
- настроить аутентификацию через Keycloak (OpenID Connect, PKCE);
- реализовать клиентское приложение на React + TypeScript;
- упаковать все компоненты в Docker Compose.

## Возможности

- Список заявок с поиском (по названию, автору, номеру), фильтрами (статус, проект) и сортировкой.
- Создание заявки (проект: `1X`, `Music`, `Delivery`; описание до 1000 символов).
- Чат по каждой заявке: сообщения до 2000 символов и вложения до 10 МБ; в ленту автоматически
  добавляются события смены статуса.
- Статусы `Открыта` → `В обработке` → `Закрыта` с переходами, зависящими от роли.
- Уведомления (о новой заявке, сообщении, смене статуса), счётчик непрочитанных, отметка прочитанными.
- Вход и регистрация через Keycloak, страница аккаунта с историей заявок.

### Права доступа

| Действие | Гость | Пользователь | Автор заявки | Администратор |
|---|:---:|:---:|:---:|:---:|
| Просмотр заявок, чата, скачивание файлов | ✓ | ✓ | ✓ | ✓ |
| Создание заявки | — | ✓ | ✓ | ✓ |
| Сообщения в чат | — | — | ✓ (своя) | ✓ (любая) |
| Смена статуса | — | — | ✓ (ограниченно) | ✓ |
| Уведомления | — | ✓ | ✓ | ✓ |

Переходы статусов:

| Из статуса | Автор может перевести в | Администратор может перевести в |
|---|---|---|
| Открыта | Закрыта | В обработке, Закрыта |
| В обработке | Закрыта | Открыта, Закрыта |
| Закрыта | Открыта | Открыта, В обработке |

## Архитектура

Браузер (React SPA, nginx)  :9000
   │  REST + Bearer JWT              │  OpenID Connect (Authorization Code + PKCE)
   ▼                                 ▼
Backend (NestJS)  :9100 ──JWKS──▶ Keycloak  :9200
   │  TypeORM
   ▼
PostgreSQL 16  :9300

- **frontend** — Vite + React 19 + TypeScript, раздаётся через nginx; вход через `keycloak-js`;
  типизированный API-клиент генерируется из `openapi.yaml` (`openapi-typescript` + `openapi-fetch`).
- **backend** — NestJS, TypeORM, проверка JWT Keycloak (RS256, JWKS), валидация DTO, Swagger UI.
  Модули: `auth`, `users`, `applications`, `chat`, `notifications`.
- **postgres** — схема `app` (таблицы `users`, `applications`, `chat_items`, `chat_attachments`,
  `notifications`); схемы создаёт `docker/postgres/init.sql`, таблицы — TypeORM.
- **keycloak** — realm `practics` импортируется из `docker/keycloak/realm-export.json`
  (клиенты `frontend` и `backend`, роли `admin` и `user`, тестовые пользователи).

## Запуск

Требуется только [Docker](https://docs.docker.com/get-docker/) с Docker Compose.

```bash
git clone https://github.com/Maxim-Bondarev/practice.git
cd practice
docker compose up -d --build
```

Первый запуск занимает несколько минут (сборка образов, импорт realm в Keycloak). Когда контейнеры
запустятся, откройте http://localhost:9000.

Остановить: `docker compose down`. Остановить и удалить данные БД: `docker compose down -v`.

### Адреса

| Сервис | URL |
|---|---|
| Приложение (frontend) | http://localhost:9000 |
| API (backend) | http://localhost:9100 |
| Swagger UI | http://localhost:9100/docs |
| Keycloak (консоль администратора) | http://localhost:9200 |
| PostgreSQL | `localhost:9300`, БД `practics` |

### Тестовые учётные записи

| Логин | Пароль | Роль |
|---|---|---|
| `admin` | `admin` | администратор |
| `user` | `user` | пользователь |

Новых пользователей можно создать через регистрацию на странице входа. Консоль Keycloak:
`admin` / `admin`.

> Учётные данные и пароли в `compose.yaml` и `realm-export.json` предназначены только для
> локальной разработки. Перед использованием в продакшене их необходимо заменить.

## Структура репозитория

```
.
├── compose.yaml                 # описание четырёх сервисов и сети
├── docker/
│   ├── postgres/init.sql        # создание схем app и keycloak
│   └── keycloak/realm-export.json   # realm, клиенты, роли, пользователи
├── docs/
│   ├── openapi.yaml             # контракт REST API (OpenAPI 3.0.3)
│   ├── VISION.md                # описание идеи и функционала
│   └── stages/STAGE-1.md        # задание первого этапа
└── src/
    ├── backend/                 # NestJS API
    │   ├── src/                 # исходный код (auth, users, applications, chat, notifications)
    │   ├── test/                # интеграционные (e2e) тесты
    │   └── Dockerfile
    └── frontend/                # React SPA
        ├── src/                 # страницы, компоненты, API-клиент, контекст аутентификации
        ├── nginx.conf
        └── Dockerfile
```

## Разработка без Docker для приложений

Запустите инфраструктуру в Docker, а frontend и backend — локально (нужен Node.js 20+).

```bash
docker compose up -d postgres keycloak
```

Backend:

```bash
cd src/backend
npm ci
DATABASE_URL=postgres://postgres:123456@localhost:9300/practics \
KEYCLOAK_URL=http://localhost:9200 \
npm run start:dev          # http://localhost:3000
```

Frontend:

```bash
cd src/frontend
npm ci
# переменные VITE_API_URL, VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, VITE_KEYCLOAK_CLIENT_ID
npm run dev                # типы API генерируются автоматически (predev)
```

### Переменные окружения backend

| Переменная | Назначение | Значение в compose |
|---|---|---|
| `PORT` | порт приложения | `3000` |
| `DATABASE_URL` | строка подключения к PostgreSQL | `postgres://postgres:123456@postgres:5432/practics` |
| `DB_SYNCHRONIZE` | автосоздание таблиц TypeORM | `true` |
| `KEYCLOAK_URL` | внутренний адрес Keycloak (для JWKS) | `http://keycloak:8080` |
| `KEYCLOAK_REALM` | realm | `practics` |
| `KEYCLOAK_ISSUER` | ожидаемый `iss` токена (внешний адрес) | `http://localhost:9200/realms/practics` |
| `CORS_ORIGIN` | разрешённые origin через запятую | `http://localhost:9000` |

## Тесты

Интеграционные тесты backend (Jest + supertest) используют настоящую PostgreSQL и заменяют
аутентификацию Keycloak заголовком `x-test-user`.

```bash
docker compose up -d postgres
cd src/backend
npm ci
npm run test:e2e
```

По умолчанию создаётся отдельная база `practics_test` на `localhost:9300`; другой адрес можно задать
через `TEST_DATABASE_URL`.

## Документация API

Контракт описан в [`docs/openapi.yaml`](docs/openapi.yaml), интерактивная версия доступна в Swagger UI
по адресу http://localhost:9100/docs после запуска.

| Метод | Путь | Назначение |
|---|---|---|
| GET | `/applications` | список заявок (`status`, `project`, `search`, `mine`, `sort`) |
| POST | `/applications` | создать заявку |
| GET | `/applications/{id}` | заявка по номеру |
| PATCH | `/applications/{id}/status` | сменить статус |
| GET | `/applications/{id}/chat` | лента чата (`after`) |
| POST | `/applications/{id}/chat/messages` | отправить сообщение (multipart) |
| GET | `/files/{id}` | скачать вложение |
| GET | `/notifications` | уведомления текущего пользователя |
| POST | `/notifications/read` | отметить прочитанными |

## Технологии

React 19 · TypeScript · Vite · React Router · keycloak-js · NestJS · TypeORM · PostgreSQL 16 ·
Keycloak 24 · Docker Compose · nginx · Jest · supertest · OpenAPI
