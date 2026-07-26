@extends('install.layout')

@section('content')
  <h1>Configuracoes do sistema</h1>
  <p>Informe os dados do banco e o admin inicial.</p>

  @if ($errors->any())
    <div class="error">
      @foreach ($errors->all() as $error)
        <div>{{ $error }}</div>
      @endforeach
    </div>
  @endif

  <form method="POST" action="{{ route('install.run') }}" enctype="multipart/form-data">
    @csrf
    <div class="section">
      <h2 style="font-size:16px; margin:0 0 10px;">Aplicacao</h2>
      <label class="label">Nome do App</label>
      <input class="input" name="app_name" value="{{ old('app_name', 'P90 Admin') }}" required>

      <label class="label" style="margin-top:12px;">URL do App</label>
      <input class="input" name="app_url" value="{{ old('app_url', request()->getSchemeAndHttpHost()) }}" required>
    </div>

    <div class="section">
      <h2 style="font-size:16px; margin:0 0 10px;">Banco de Dados</h2>
      <label class="label">Host</label>
      <input class="input" name="db_host" value="{{ old('db_host', '127.0.0.1') }}" required>

      <label class="label" style="margin-top:12px;">Porta</label>
      <input class="input" name="db_port" value="{{ old('db_port', '3306') }}">

      <label class="label" style="margin-top:12px;">Database</label>
      <input class="input" name="db_database" value="{{ old('db_database') }}" required>

      <label class="label" style="margin-top:12px;">Usuario</label>
      <input class="input" name="db_username" value="{{ old('db_username') }}" required>

      <label class="label" style="margin-top:12px;">Senha</label>
      <input class="input" name="db_password" type="password" value="{{ old('db_password') }}">
    </div>

    <div class="section">
      <h2 style="font-size:16px; margin:0 0 10px;">Admin Inicial</h2>
      <label class="label">Nome</label>
      <input class="input" name="admin_name" value="{{ old('admin_name') }}" required>

      <label class="label" style="margin-top:12px;">Email</label>
      <input class="input" name="admin_email" type="email" value="{{ old('admin_email') }}" required>

      <label class="label" style="margin-top:12px;">Telefone</label>
      <input class="input" name="admin_phone" value="{{ old('admin_phone') }}">

      <label class="label" style="margin-top:12px;">Data de nascimento</label>
      <input class="input" name="admin_birth_date" placeholder="YYYY-MM-DD" value="{{ old('admin_birth_date') }}">

      <label class="label" style="margin-top:12px;">Senha</label>
      <input class="input" name="admin_password" type="password" required>

      <label class="label" style="margin-top:12px;">Faixa</label>
      <input class="input" name="admin_belt" value="{{ old('admin_belt', 'Preta') }}">

      <label class="label" style="margin-top:12px;">Graus</label>
      <input class="input" name="admin_degree" value="{{ old('admin_degree', '0') }}">

      <label class="label" style="margin-top:12px;">Biografia</label>
      <textarea class="input" name="admin_bio" rows="3">{{ old('admin_bio') }}</textarea>

      <label class="label" style="margin-top:12px;">Foto (opcional)</label>
      <input class="input" name="admin_avatar" type="file" accept="image/*">
    </div>

    <div class="actions">
      <a class="button secondary" href="{{ route('install.requirements') }}">Voltar</a>
      <button class="button primary" type="submit">Instalar</button>
    </div>
  </form>
@endsection
