<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (! $this->isInstalled()) {
            config([
                'session.driver' => 'file',
                'cache.default' => 'file',
            ]);
        }

        if ($this->shouldForceHttps()) {
            URL::forceScheme('https');
        }
    }

    private function isInstalled(): bool
    {
        return file_exists(storage_path('app/installed')) || env('APP_INSTALLED') === 'true';
    }

    private function shouldForceHttps(): bool
    {
        $appUrl = (string) config('app.url', '');

        return str_starts_with($appUrl, 'https://')
            || request()->header('x-forwarded-proto') === 'https'
            || request()->server('HTTPS') === 'on';
    }
}
