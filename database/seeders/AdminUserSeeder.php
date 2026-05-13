<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Default local admin (change password after first login).
     */
    public function run(): void
    {
        $role = Role::query()->where('slug', 'super-admin')->first()
            ?? Role::query()->where('slug', 'admin')->first();
        if (! $role) {
            $this->call(PermissionSeeder::class);
            $role = Role::query()->where('slug', 'super-admin')->first()
                ?? Role::query()->where('slug', 'admin')->firstOrFail();
        }

        User::query()->updateOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('password'),
                'role' => in_array($role->slug, ['super-admin', 'admin'], true) ? 'admin' : 'member',
                'role_id' => $role->id,
                'email_verified_at' => now(),
            ]
        );

        $this->command?->info('Admin user: admin@example.com / password — role: '.$role->slug.' (change in production).');
    }
}
