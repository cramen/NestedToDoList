**Как использовать:**

1. **С Dockerfile:**
```bash
# Собираем образ
docker build -t todoapp-postgres .

# Запускаем контейнер
docker run -d --name todoapp-postgres -p 5432:5432 todoapp-postgres
```

2. **С docker-compose (рекомендуется):**
```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down
```

3. **Или просто используйте готовый образ PostgreSQL:**
```bash
docker run -d \
  --name todoapp-postgres \
  -e POSTGRES_DB=todoapp \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15
```

**Подключение к БД:**
- Хост: localhost (или 127.0.0.1)
- Порт: 5432
- База данных: todoapp
- Пользователь: postgres
- Пароль: password
