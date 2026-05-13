<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create roles
        $adminRole = Role::firstOrCreate(
            ['slug' => 'admin'],
            ['name' => 'Admin', 'description' => 'Full access to all features', 'is_default' => false]
        );

        $userRole = Role::firstOrCreate(
            ['slug' => 'user'],
            ['name' => 'User', 'description' => 'Limited access to assigned features', 'is_default' => true]
        );

        // Define module permissions
        $permissions = [
            // Tasks module
            ['name' => 'View Tasks', 'slug' => 'tasks.view', 'module' => 'tasks', 'description' => 'Can view tasks'],
            ['name' => 'Create Tasks', 'slug' => 'tasks.create', 'module' => 'tasks', 'description' => 'Can create tasks'],
            ['name' => 'Edit Tasks', 'slug' => 'tasks.edit', 'module' => 'tasks', 'description' => 'Can edit tasks'],
            ['name' => 'Delete Tasks', 'slug' => 'tasks.delete', 'module' => 'tasks', 'description' => 'Can delete tasks'],
            ['name' => 'Assign Tasks', 'slug' => 'tasks.assign', 'module' => 'tasks', 'description' => 'Can assign tasks to users'],

            // CRM module
            ['name' => 'View CRM', 'slug' => 'crm.view', 'module' => 'crm', 'description' => 'Can view CRM data'],
            ['name' => 'Manage Contacts', 'slug' => 'crm.contacts.manage', 'module' => 'crm', 'description' => 'Can manage contacts'],
            ['name' => 'Manage Companies', 'slug' => 'crm.companies.manage', 'module' => 'crm', 'description' => 'Can manage companies'],
            ['name' => 'Manage Deals', 'slug' => 'crm.deals.manage', 'module' => 'crm', 'description' => 'Can manage deals'],

            // Chat module
            ['name' => 'View Chat', 'slug' => 'chat.view', 'module' => 'chat', 'description' => 'Can view chat channels'],
            ['name' => 'Send Messages', 'slug' => 'chat.send', 'module' => 'chat', 'description' => 'Can send messages'],
            ['name' => 'Manage Channels', 'slug' => 'chat.manage', 'module' => 'chat', 'description' => 'Can manage channels'],

            // Teams module
            ['name' => 'View Teams', 'slug' => 'teams.view', 'module' => 'teams', 'description' => 'Can view teams'],
            ['name' => 'Manage Teams', 'slug' => 'teams.manage', 'module' => 'teams', 'description' => 'Can manage teams'],
            ['name' => 'Invite Members', 'slug' => 'teams.invite', 'module' => 'teams', 'description' => 'Can invite team members'],

            // Spaces module
            ['name' => 'View Spaces', 'slug' => 'spaces.view', 'module' => 'spaces', 'description' => 'Can view spaces'],
            ['name' => 'Manage Spaces', 'slug' => 'spaces.manage', 'module' => 'spaces', 'description' => 'Can manage spaces'],

            // Goals module
            ['name' => 'View Goals', 'slug' => 'goals.view', 'module' => 'goals', 'description' => 'Can view goals'],
            ['name' => 'Manage Goals', 'slug' => 'goals.manage', 'module' => 'goals', 'description' => 'Can manage goals'],

            // Dashboards module
            ['name' => 'View Dashboards', 'slug' => 'dashboards.view', 'module' => 'dashboards', 'description' => 'Can view dashboards'],
            ['name' => 'Manage Dashboards', 'slug' => 'dashboards.manage', 'module' => 'dashboards', 'description' => 'Can manage dashboards'],

            // Planner module
            ['name' => 'View Planner', 'slug' => 'planner.view', 'module' => 'planner', 'description' => 'Can view planner'],
            ['name' => 'Manage Planner', 'slug' => 'planner.manage', 'module' => 'planner', 'description' => 'Can manage planner blocks'],

            // Users module
            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users', 'description' => 'Can view users'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'module' => 'users', 'description' => 'Can manage users'],
            ['name' => 'Manage Permissions', 'slug' => 'users.permissions', 'module' => 'users', 'description' => 'Can manage user permissions'],

            // Invite module
            ['name' => 'Invite Users', 'slug' => 'invite.users', 'module' => 'invite', 'description' => 'Can invite users to the platform'],
        ];

        foreach ($permissions as $permission) {
            $perm = Permission::firstOrCreate(
                ['slug' => $permission['slug']],
                $permission
            );
        }

        // Assign all permissions to admin
        $adminRole->permissions()->sync(Permission::pluck('id'));

        // Assign basic permissions to user
        $userPermissions = Permission::whereIn('slug', [
            'tasks.view', 'tasks.create', 'tasks.edit',
            'crm.view', 'crm.contacts.manage', 'crm.companies.manage', 'crm.deals.manage',
            'chat.view', 'chat.send',
            'teams.view', 'teams.invite',
            'spaces.view',
            'goals.view', 'goals.manage',
            'dashboards.view',
            'planner.view', 'planner.manage',
        ])->pluck('id');

        $userRole->permissions()->sync($userPermissions);

        $this->command->info('Permissions and roles seeded successfully.');
    }
}
