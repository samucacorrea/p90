<!doctype html>
<html lang="pt-br">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Instalador P90 Admin</title>
    <style>
      :root {
        color-scheme: light;
      }
      body {
        margin: 0;
        font-family: "Segoe UI", sans-serif;
        background: #f5f6f8;
        color: #111827;
      }
      .wrap {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
      }
      .card {
        width: 100%;
        max-width: 720px;
        background: #fff;
        border-radius: 18px;
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
        border: 1px solid #e5e7eb;
        padding: 28px;
      }
      .brand {
        font-weight: 800;
        font-size: 20px;
        color: #b4122a;
        margin-bottom: 16px;
      }
      h1 {
        font-size: 22px;
        margin: 0 0 12px;
      }
      p {
        margin: 0 0 16px;
        color: #6b7280;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .item {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ok {
        color: #16a34a;
        font-weight: 700;
      }
      .fail {
        color: #dc2626;
        font-weight: 700;
      }
      .actions {
        margin-top: 20px;
        display: flex;
        gap: 12px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 12px 18px;
        border-radius: 12px;
        border: none;
        cursor: pointer;
        font-weight: 700;
        text-decoration: none;
      }
      .primary {
        background: #b4122a;
        color: #fff;
      }
      .secondary {
        background: #e5e7eb;
        color: #111827;
      }
      .input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        font-size: 14px;
      }
      .label {
        font-size: 12px;
        font-weight: 700;
        color: #6b7280;
        margin-bottom: 6px;
        display: block;
      }
      .section {
        margin-top: 20px;
      }
      .error {
        background: #fee2e2;
        color: #991b1b;
        padding: 10px 12px;
        border-radius: 10px;
        margin-bottom: 12px;
        font-size: 13px;
      }
      .footer {
        margin-top: 16px;
        color: #9ca3af;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="brand">P90 Admin</div>
        @yield('content')
      </div>
      <div class="footer">Instalador assistido para o painel P90 Admin.</div>
    </div>
  </body>
</html>
