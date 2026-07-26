@extends('install.layout')

@section('content')
  <h1>Instalacao concluida</h1>
  <p>O sistema foi instalado com sucesso.</p>

  <div class="section">
    <div class="item">
      <span>URL</span>
      <span class="ok">{{ $appUrl }}</span>
    </div>
    <div class="item" style="margin-top:8px;">
      <span>Admin</span>
      <span class="ok">{{ $adminEmail }}</span>
    </div>
  </div>

  <div class="actions">
    <a class="button primary" href="/">Ir para o sistema</a>
  </div>
@endsection
