# AutoGIS - Платформа для автомастеров

## Структура проекта

```
/
├── backend/          # Go backend (API, БД, WebSocket)
├── src/             # React frontend
├── public/          # Статические файлы
└── server.ts        # Dev mock-сервер (только для разработки фронта)
```

## Запуск проекта

### Backend (Go)

```bash
cd backend

# Установить зависимости
go mod download

# Запустить PostgreSQL (Docker)
docker-compose up -d

# Запустить backend
make dev
# или
go run ./cmd/server
```

Backend будет на **http://localhost:3001**

### Frontend (React + Vite)

```bash
# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
```

Frontend будет на **http://localhost:5173**

## Переменные окружения

### Backend (`backend/.env`)
```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=auto_masters
JWT_SECRET=your-secret-key
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:3001
```

## Production

Для продакшена используется:
- Go backend с PostgreSQL + PostGIS
- React frontend (build через `npm run build`)
- Nginx для статики

**Mock сервер (`server.ts`) НЕ используется в продакшене!**
