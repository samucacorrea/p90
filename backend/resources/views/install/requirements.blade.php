@extends('install.layout')

@section('content')
  <h1>Verificacao de requisitos</h1>
  <p>Confirme se o servidor atende os pre-requisitos antes de iniciar a instalacao.</p>

  <div class="section">
    <h2 style="font-size:16px; margin:0 0 10px;">Extensoes e PHP</h2>
    <div class="grid">
      @foreach($checks as $label => $ok)
        <div class="item">
          <span>{{ strtoupper($label) }}</span>
          <span class="{{ $ok ? 'ok' : 'fail' }}">{{ $ok ? 'OK' : 'FALTA' }}</span>
        </div>
      @endforeach
    </div>
  </div>

  <div class="section">
    <h2 style="font-size:16px; margin:0 0 10px;">Permissoes</h2>
    <div class="grid">
      @foreach($writable as $label => $ok)
        <div class="item">
          <span>{{ strtoupper($label) }}</span>
          <span class="{{ $ok ? 'ok' : 'fail' }}">{{ $ok ? 'OK' : 'BLOQUEADO' }}</span>
        </div>
      @endforeach
    </div>
  </div>

  <div class="actions">
    <a class="button secondary" href="{{ route('install.requirements') }}">Recarregar</a>
    @if($allGood)
      <a class="button primary" href="{{ route('install.config') }}">Continuar</a>
    @else
      <span style="color:#dc2626; font-weight:600;">Ajuste os requisitos antes de continuar.</span>
    @endif
  </div>
@endsection
