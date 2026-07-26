<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureNotInstalled
{
    public function handle(Request $request, Closure $next): Response
    {
        $installedFile = storage_path('app/installed');
        $isInstalled = file_exists($installedFile) || env('APP_INSTALLED') === 'true';

        if ($isInstalled) {
            return redirect('/');
        }

        return $next($request);
    }
}
