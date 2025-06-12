FROM postgres:15

# Устанавливаем переменные окружения
ENV POSTGRES_DB=todoapp
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=password

# Открываем порт 5432
EXPOSE 5432

# Создаем директорию для данных
VOLUME ["/var/lib/postgresql/data"]

# Команда по умолчанию уже установлена в базовом образе postgres
