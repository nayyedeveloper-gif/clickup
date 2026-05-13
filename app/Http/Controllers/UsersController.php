<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\Space;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::with(['roleModel:id,name,slug', 'spaces:id,name'])
            ->select('id', 'name', 'email', 'role', 'role_id', 'email_verified_at')
            ->orderBy('name')
            ->get();

        $roles = Role::with('permissions')->get();
        $permissions = Permission::orderBy('module')->orderBy('name')->get();
        $allSpaces = Space::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $roles,
            'permissions' => $permissions,
            'allSpaces' => $allSpaces,
        ]);
    }

    public function updateSpaces(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'space_ids' => 'array',
            'space_ids.*' => 'exists:spaces,id',
        ]);

        $user->spaces()->sync($validated['space_ids'] ?? []);

        return back()->with('success', 'User spaces updated successfully.');
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user->role_id = $validated['role_id'];

        $role = Role::find($validated['role_id']);
        $slug = $role?->slug ?? 'user';
        $user->role = match ($slug) {
            'super-admin', 'admin' => 'admin',
            'manager' => 'manager',
            default => 'member',
        };

        $user->save();

        return back()->with('success', 'User role updated successfully.');
    }

    public function updateRolePermissions(Request $request): RedirectResponse
    {
        if (! $request->user()->isSuperAdmin()) {
            return back()->with('error', 'Only a super administrator can edit the role permission matrix.');
        }

        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        $role = Role::find($validated['role_id']);
        $role->permissions()->sync($validated['permission_ids'] ?? []);

        return back()->with('success', 'Role permissions updated successfully.');
    }

    public function toggleActive(User $user): RedirectResponse
    {
        if ($user->email_verified_at) {
            $user->email_verified_at = null;
        } else {
            $user->email_verified_at = now();
        }
        $user->save();

        return back();
    }

    public function destroy(User $user): RedirectResponse
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
