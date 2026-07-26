#!/usr/bin/env sh
set -e

if [ -n "${DB_HOST:-}" ]; then
  until php -r '
    $host = getenv("DB_HOST");
    $port = (int) (getenv("DB_PORT") ?: 3306);
    $connection = @fsockopen($host, $port, $errno, $errstr, 2);
    if ($connection) {
      fclose($connection);
      exit(0);
    }
    exit(1);
  '; do
    echo "Aguardando banco de dados em ${DB_HOST}:${DB_PORT:-3306}..."
    sleep 2
  done
fi

php artisan config:clear >/dev/null 2>&1 || true
php artisan cache:clear >/dev/null 2>&1 || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

if [ ! -L public/storage ]; then
  php artisan storage:link >/dev/null 2>&1 || true
fi

php-fpm -D
exec nginx -g "daemon off;"
