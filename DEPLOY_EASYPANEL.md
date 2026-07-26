# Deploy com Easy Panel

## Arquitetura

- `p90.pro`: frontend Next.js em `frontend/web-admin`
- `back.p90.pro`: backend Laravel em `backend`
- MySQL como servico separado no Easy Panel

## Frontend

- Build context: `frontend/web-admin`
- Dockerfile: `frontend/web-admin/Dockerfile`
- Porta interna: `3000`
- Variaveis:
  - `NEXT_PUBLIC_API_BASE_URL=https://back.p90.pro/api`
  - `NODE_ENV=production`
  - referencia: `frontend/web-admin/.env.production.example`

## Backend

- Build context: `backend`
- Dockerfile: `backend/Dockerfile`
- Porta interna: `80`
- Variaveis minimas:
  - `APP_NAME=P90 Admin`
  - `APP_KEY=<gerada com php artisan key:generate --show>`
  - `APP_ENV=production`
  - `APP_DEBUG=false`
  - `APP_URL=https://back.p90.pro`
  - `APP_INSTALLED=false`
  - `DB_CONNECTION=mysql`
  - `DB_HOST=<host do mysql>`
  - `DB_PORT=3306`
  - `DB_DATABASE=<database>`
  - `DB_USERNAME=<usuario>`
  - `DB_PASSWORD=<senha>`
  - `SESSION_DRIVER=database`
  - `CACHE_STORE=database`
  - `QUEUE_CONNECTION=database`
  - `SANCTUM_STATEFUL_DOMAINS=p90.pro,www.p90.pro`
  - referencia: `backend/.env.easypanel.example`

## Volume recomendado

- montar volume persistente em `/var/www/html/storage`

## Fluxo sugerido

1. Criar o banco MySQL no Easy Panel.
2. Publicar o backend em `back.p90.pro`.
3. Abrir `https://back.p90.pro/install` e concluir o wizard.
4. Publicar o frontend em `p90.pro`.
5. Definir `NEXT_PUBLIC_API_BASE_URL=https://back.p90.pro/api`.

## Validacao local com Docker

Arquivos preparados:

- `docker-compose.yml`
- `backend/.env.docker`
- `frontend/web-admin/.env.docker`

Subida local:

```bash
docker compose up --build
```

URLs locais:

- frontend: `http://localhost:3001/admin/login`
- backend: `http://localhost:8000`
- instalador: `http://localhost:8000/install`
- mysql host local: `127.0.0.1:3307`

## Observacoes

- O frontend nao usa mais export estatico.
- O backend continua com instalador web, agora dentro do container.
- Se quisermos fila real depois, adicionamos Redis numa segunda etapa.
