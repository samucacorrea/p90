<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class InstallController extends Controller
{
    public function redirect(): View|RedirectResponse
    {
        if (!$this->isInstalled()) {
            return redirect()->route('install.requirements');
        }

        return view('welcome');
    }

    public function requirements(): View
    {
        $checks = [
            'php' => version_compare(PHP_VERSION, '8.2.0', '>='),
            'openssl' => extension_loaded('openssl'),
            'pdo' => extension_loaded('pdo'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'mbstring' => extension_loaded('mbstring'),
            'tokenizer' => extension_loaded('tokenizer'),
            'json' => extension_loaded('json'),
            'curl' => extension_loaded('curl'),
            'fileinfo' => extension_loaded('fileinfo'),
            'xml' => extension_loaded('xml'),
        ];

        $writable = [
            'storage' => is_writable(storage_path()),
            'bootstrap_cache' => is_writable(base_path('bootstrap/cache')),
            'env' => $this->canWriteEnv(),
        ];

        return view('install.requirements', [
            'checks' => $checks,
            'writable' => $writable,
            'allGood' => !in_array(false, $checks, true)
                && $writable['storage']
                && $writable['bootstrap_cache'],
        ]);
    }

    public function config(): View|RedirectResponse
    {
        if ($this->isInstalled()) {
            return redirect('/');
        }

        return view('install.config');
    }

    public function run(Request $request): View|RedirectResponse
    {
        if ($this->isInstalled()) {
            return redirect('/');
        }

        $data = $request->validate([
            'app_name' => ['required', 'string', 'max:255'],
            'app_url' => ['required', 'url'],
            'db_host' => ['required', 'string', 'max:255'],
            'db_port' => ['nullable', 'string', 'max:10'],
            'db_database' => ['required', 'string', 'max:255'],
            'db_username' => ['required', 'string', 'max:255'],
            'db_password' => ['nullable', 'string'],
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'email', 'max:255'],
            'admin_password' => ['required', 'string', 'min:8'],
            'admin_phone' => ['nullable', 'string', 'max:40'],
            'admin_birth_date' => ['nullable', 'date'],
            'admin_belt' => ['nullable', 'string', 'max:50'],
            'admin_degree' => ['nullable', 'string', 'max:50'],
            'admin_bio' => ['nullable', 'string'],
            'admin_avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        $dbPort = $data['db_port'] ?: '3306';

        config([
            'database.connections.mysql.host' => $data['db_host'],
            'database.connections.mysql.port' => $dbPort,
            'database.connections.mysql.database' => $data['db_database'],
            'database.connections.mysql.username' => $data['db_username'],
            'database.connections.mysql.password' => $data['db_password'],
        ]);

        DB::purge('mysql');

        try {
            DB::connection('mysql')->getPdo();
        } catch (\Throwable $e) {
            return back()->withErrors(['db' => 'Falha ao conectar no banco de dados. Verifique as credenciais.'])->withInput();
        }

        $this->ensureEnvFile();
        $canWriteEnv = $this->canWriteEnv();
        $appKey = config('app.key');

        if (! $canWriteEnv && blank($appKey)) {
            return back()
                ->withErrors([
                    'env' => 'O instalador nao conseguiu persistir a chave da aplicacao. Defina APP_KEY nas variaveis do container ou libere escrita no arquivo .env.',
                ])
                ->withInput();
        }

        if (blank($appKey)) {
            $appKey = 'base64:' . base64_encode(random_bytes(32));
        }

        if ($canWriteEnv) {
            $this->updateEnv([
                'APP_NAME' => '"' . $data['app_name'] . '"',
                'APP_URL' => $data['app_url'],
                'APP_ENV' => 'production',
                'APP_DEBUG' => 'false',
                'APP_INSTALLED' => 'true',
                'APP_KEY' => $appKey,
                'DB_CONNECTION' => 'mysql',
                'DB_HOST' => $data['db_host'],
                'DB_PORT' => $dbPort,
                'DB_DATABASE' => $data['db_database'],
                'DB_USERNAME' => $data['db_username'],
                'DB_PASSWORD' => $data['db_password'] ?? '',
            ]);
        }

        config([
            'app.key' => $appKey,
        ]);

        try {
            Artisan::call('config:clear');
        } catch (\Throwable $e) {
            return back()
                ->withErrors([
                    'install' => 'Falha ao limpar a configuracao da aplicacao durante a instalacao.',
                ])
                ->withInput();
        }

        config([
            'database.connections.mysql.host' => $data['db_host'],
            'database.connections.mysql.port' => $dbPort,
            'database.connections.mysql.database' => $data['db_database'],
            'database.connections.mysql.username' => $data['db_username'],
            'database.connections.mysql.password' => $data['db_password'],
        ]);
        DB::purge('mysql');
        DB::reconnect('mysql');

        try {
            Artisan::call('migrate', ['--force' => true]);
            Artisan::call('storage:link');
        } catch (\Throwable $e) {
            return back()
                ->withErrors([
                    'install' => 'Falha ao finalizar a instalacao. Verifique permissoes de storage, symlink e acesso ao banco.',
                ])
                ->withInput();
        }

        $avatarPath = null;
        if ($request->hasFile('admin_avatar')) {
            $avatarPath = $request->file('admin_avatar')->store('teachers', 'public');
        }

        User::updateOrCreate(
            ['email' => $data['admin_email']],
            [
                'name' => $data['admin_name'],
                'password' => Hash::make($data['admin_password']),
                'role' => 'admin',
                'phone' => $data['admin_phone'] ?? null,
                'birth_date' => $data['admin_birth_date'] ?? null,
                'belt' => $data['admin_belt'] ?? null,
                'degree' => $data['admin_degree'] ?? null,
                'bio' => $data['admin_bio'] ?? null,
                'avatar_path' => $avatarPath,
            ]
        );

        $this->markInstalled();

        return view('install.finish', [
            'appUrl' => $data['app_url'],
            'adminEmail' => $data['admin_email'],
        ]);
    }

    private function isInstalled(): bool
    {
        return file_exists(storage_path('app/installed')) || env('APP_INSTALLED') === 'true';
    }

    private function markInstalled(): void
    {
        $path = storage_path('app/installed');
        if (!file_exists($path)) {
            file_put_contents($path, now()->toDateTimeString());
        }
    }

    private function ensureEnvFile(): void
    {
        $envPath = base_path('.env');
        if (!file_exists($envPath) && file_exists(base_path('.env.example'))) {
            copy(base_path('.env.example'), $envPath);
        }
    }

    private function canWriteEnv(): bool
    {
        $envPath = base_path('.env');

        return !file_exists($envPath) || is_writable($envPath);
    }

    private function updateEnv(array $values): void
    {
        $envPath = base_path('.env');
        $contents = file_exists($envPath) ? file_get_contents($envPath) : '';

        foreach ($values as $key => $value) {
            $pattern = "/^" . preg_quote($key, '/') . "=.*/m";
            $line = $key . '=' . $value;

            if (preg_match($pattern, $contents)) {
                $contents = preg_replace($pattern, $line, $contents);
            } else {
                $contents .= (str_ends_with($contents, "\n") || $contents === '' ? '' : "\n") . $line;
            }
        }

        file_put_contents($envPath, $contents . "\n");
    }
}
