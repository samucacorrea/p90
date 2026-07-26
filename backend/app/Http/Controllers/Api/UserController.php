<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with(['classesTeaching']);

        if ($request->filled('q')) {
            $term = '%' . $request->string('q')->toString() . '%';
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->where('name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $users = $query->paginate($perPage);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:6'],
            'phone' => ['nullable', 'string', 'max:40'],
            'birth_date' => ['nullable', 'date'],
            'belt' => ['nullable', 'string', 'max:50'],
            'degree' => ['nullable', 'string', 'max:50'],
            'bio' => ['nullable', 'string'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        $data['password'] = Hash::make($data['password'] ?? 'Temp@123');

        if ($request->hasFile('avatar')) {
            $data['avatar_path'] = $request->file('avatar')->store('teachers', 'public');
        }

        $user = User::create($data);

        return response()->json(['data' => $user->load('classesTeaching')], 201);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::query()->with(['classesTeaching'])->findOrFail($id);

        return response()->json(['data' => $user]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['sometimes', 'in:admin,teacher'],
            'phone' => ['nullable', 'string', 'max:40'],
            'birth_date' => ['nullable', 'date'],
            'belt' => ['nullable', 'string', 'max:50'],
            'degree' => ['nullable', 'string', 'max:50'],
            'bio' => ['nullable', 'string'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if ($request->hasFile('avatar')) {
            $data['avatar_path'] = $request->file('avatar')->store('teachers', 'public');
        }

        $user->update($data);

        return response()->json(['data' => $user->load('classesTeaching')]);
    }

    public function destroy(string $id): JsonResponse
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['message' => 'User removed.']);
    }
}
