# P90 Web Admin

Frontend administrativo em Next.js para o dominio `p90.pro`.

## Ambiente local

Crie o arquivo `.env.local` com base em `.env.example`.

Exemplo:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_ADMIN_BG_URL=
```

Instalacao e execucao:

```bash
npm install
npm run dev
```

O painel inicia em:

```text
http://localhost:3000/admin/login
```

## Producao

Este projeto foi preparado para rodar em container no Easy Panel.

- dominio do frontend: `p90.pro`
- backend esperado: `https://back.p90.pro`
- variavel principal:

```env
NEXT_PUBLIC_API_BASE_URL=https://back.p90.pro/api
```

## Build

```bash
npm run build
npm run start
```

O projeto usa `output: "standalone"` no Next para simplificar o runtime em Docker.
