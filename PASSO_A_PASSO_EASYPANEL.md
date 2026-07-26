# Passo a passo de deploy no Easy Panel

Este guia foi escrito para subir o projeto no Easy Panel usando Git e Docker, com esta arquitetura:

- `p90.pro` -> frontend Next.js
- `back.p90.pro` -> backend Laravel
- MySQL -> servico separado dentro do Easy Panel

Arquivos de referencia no projeto:

- `DEPLOY_EASYPANEL.md`
- `backend/.env.easypanel.example`
- `frontend/web-admin/.env.production.example`

## 1. O que voce precisa ter pronto antes

Antes de abrir o Easy Panel, confirme estes itens:

- o repositorio do projeto ja esta no GitHub, GitLab ou similar
- o DNS de `p90.pro` ja aponta para o servidor do Easy Panel
- o DNS de `back.p90.pro` ja aponta para o mesmo servidor
- voce tem acesso ao painel do Easy Panel
- voce ja consegue gerar uma `APP_KEY` do Laravel com:

```bash
cd backend
php artisan key:generate --show
```

Guarde essa chave. Voce vai colar no app do backend.

## 2. Criar o banco MySQL

No Easy Panel:

1. Clique em `Create Project` se ainda nao houver um projeto.
2. Dê um nome, por exemplo: `p90`.
3. Entre no projeto.
4. Clique em `Add Service`.
5. Escolha `Database`.
6. Escolha `MySQL`.
7. Preencha:
   - `Name`: `p90-mysql`
   - `Database`: `p90`
   - `Username`: `p90`
   - `Password`: crie uma senha forte
8. Clique em `Create`.
9. Espere o banco ficar com status `Running`.

Anote estes dados:

- host interno do banco no Easy Panel
- porta
- database
- username
- password

Se o Easy Panel mostrar um host interno como `p90-mysql`, use esse valor no backend.

## 3. Subir o backend `back.p90.pro`

No Easy Panel:

1. Clique em `Add Service`.
2. Escolha `App`.
3. Escolha a opcao de deploy por `Git Repository`.
4. Conecte seu GitHub/GitLab se necessario.
5. Selecione o repositorio deste projeto.
6. No campo de branch, escolha a branch correta.
7. Preencha os campos principais:
   - `Name`: `p90-backend`
   - `Build Path` ou `Context`: `backend`
   - `Dockerfile`: `backend/Dockerfile`
8. Em `Domain`, adicione:
   - `back.p90.pro`
9. Em `Port`, use:
   - `80`

## 4. Variaveis do backend

Ainda dentro do app `p90-backend`, abra a area de `Environment Variables` e cadastre:

```env
APP_NAME="P90 Admin"
APP_KEY=sua_app_key_gerada
APP_ENV=production
APP_DEBUG=false
APP_URL=https://back.p90.pro
APP_INSTALLED=false

DB_CONNECTION=mysql
DB_HOST=host_interno_do_mysql
DB_PORT=3306
DB_DATABASE=p90
DB_USERNAME=p90
DB_PASSWORD=sua_senha_do_mysql

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
SANCTUM_STATEFUL_DOMAINS=p90.pro,www.p90.pro

CACHE_STORE=database
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public

LOG_CHANNEL=stack
LOG_LEVEL=info
RUN_MIGRATIONS=true
```

## 5. Volume do backend

Ainda no app `p90-backend`:

1. Abra `Volumes` ou `Persistent Storage`.
2. Clique em `Add Volume`.
3. Monte o volume em:

```text
/var/www/html/storage
```

Isso garante persistencia para uploads, cache de arquivos e marcacao de instalado.

## 6. Publicar o backend

Agora:

1. Clique em `Deploy`.
2. Espere o build terminar.
3. Abra os logs do servico.
4. Confirme que:
   - o container subiu
   - o banco conectou
   - as migrations rodaram
   - nao houve erro fatal do Laravel

Quando terminar, teste no navegador:

- `https://back.p90.pro/up`
- `https://back.p90.pro/install`

Se `/install` abrir, o backend esta pronto para a configuracao inicial.

## 7. Rodar o instalador web

No navegador:

1. Abra `https://back.p90.pro/install`
2. Passe pela tela de requisitos
3. Clique em `Continuar`
4. Na configuracao:
   - `App Name`: `P90 Admin`
   - `App URL`: `https://back.p90.pro`
   - `DB Host`: host interno do MySQL
   - `DB Port`: `3306`
   - `DB Database`: `p90`
   - `DB Username`: `p90`
   - `DB Password`: sua senha
   - dados do administrador: preencha com seu usuario inicial
5. Clique em `Instalar` ou `Finalizar`

Quando concluir, valide:

- o admin foi criado
- o backend responde sem erro

## 8. Subir o frontend `p90.pro`

No Easy Panel:

1. Clique em `Add Service`
2. Escolha `App`
3. Escolha `Git Repository`
4. Selecione o mesmo repositorio
5. Preencha:
   - `Name`: `p90-frontend`
   - `Build Path` ou `Context`: `frontend/web-admin`
   - `Dockerfile`: `frontend/web-admin/Dockerfile`
6. Em `Domain`, adicione:
   - `p90.pro`
7. Em `Port`, use:
   - `3000`

## 9. Variaveis do frontend

No app `p90-frontend`, em `Environment Variables`, configure:

```env
NODE_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://back.p90.pro/api
NEXT_PUBLIC_ADMIN_BG_URL=
```

Se quiser definir uma imagem padrao de fundo do login, preencha `NEXT_PUBLIC_ADMIN_BG_URL` com a URL publica da imagem.

## 10. Publicar o frontend

Agora:

1. Clique em `Deploy`
2. Espere o build terminar
3. Abra os logs
4. Confirme que o `next build` terminou sem erro

Depois teste:

- `https://p90.pro/admin/login`

## 11. Teste final do fluxo

No navegador, valide nesta ordem:

1. `https://back.p90.pro/up`
2. `https://back.p90.pro/install` ou redirecionamento esperado se ja instalado
3. `https://p90.pro/admin/login`
4. fazer login no painel
5. abrir dashboard
6. abrir alunos, turmas, professores e configuracoes

## 12. Se algo der erro

Olhe primeiro estes pontos:

- `Logs` do servico `p90-backend`
- `Logs` do servico `p90-frontend`
- variaveis de ambiente do backend
- conexao com o MySQL
- DNS de `p90.pro` e `back.p90.pro`
- CORS no backend, se o login falhar por navegador

## 13. Ordem recomendada sempre que atualizar o sistema

1. subir mudancas para o Git
2. fazer redeploy do backend, se houve mudanca no Laravel
3. fazer redeploy do frontend, se houve mudanca no web admin
4. validar login e dashboard

## 14. URLs finais do projeto

- frontend: `https://p90.pro/admin/login`
- backend: `https://back.p90.pro`
- healthcheck Laravel: `https://back.p90.pro/up`
- instalador: `https://back.p90.pro/install`
