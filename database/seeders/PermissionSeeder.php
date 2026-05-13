<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

/**
 * Systematic RBAC:
 *
 * - super-admin: every permission (including users.permissions — role matrix).
 * - admin:       all operational permissions except users.permissions.
 * - manager:     team lead — broad tasks/CRM/chat/planner; no users.*, no spaces/teams “manage”.
 * - user:        default member — create/edit own work, chat, CRM day-to-day, no task delete/assign.
 *
 * Slugs follow module.action where practical (tasks.view, tasks.delete, …).
 */
class PermissionSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        foreach ($this->definitions() as $row) {
            Permission::firstOrCreate(
                ['slug' => $row['slug']],
                $row
            );
        }

        $allIds = Permission::pluck('id');

        $super = Role::firstOrCreate(
            ['slug' => 'super-admin'],
            [
                'name' => 'Super Admin',
                'description' => 'Full platform access, including role–permission matrix.',
                'is_default' => false,
            ]
        );
        $super->permissions()->sync($allIds);

        $admin = Role::firstOrCreate(
            ['slug' => 'admin'],
            [
                'name' => 'Admin',
                'description' => 'Manage users and operations; cannot edit the permission matrix.',
                'is_default' => false,
            ]
        );
        $admin->permissions()->sync(
            Permission::whereNotIn('slug', ['users.permissions'])->pluck('id')
        );

        $manager = Role::firstOrCreate(
            ['slug' => 'manager'],
            [
                'name' => 'Manager',
                'description' => 'Team lead: tasks, CRM, chat, planner; no user admin or space ownership tools.',
                'is_default' => false,
            ]
        );
        $manager->permissions()->sync(
            Permission::whereIn('slug', $this->managerSlugs())->pluck('id')
        );

        $user = Role::firstOrCreate(
            ['slug' => 'user'],
            [
                'name' => 'User',
                'description' => 'Standard member — collaborate on tasks, chat, and CRM.',
                'is_default' => true,
            ]
        );
        $user->permissions()->sync(
            Permission::whereIn('slug', $this->userSlugs())->pluck('id')
        );

        $this->command?->info('Roles & permissions seeded (super-admin, admin, manager, user).');
    }

    /**
     * @return list<array{name:string,slug:string,module:string,description:string}>
     */
    private function definitions(): array
    {
        return [
            ['name' => 'View Tasks', 'slug' => 'tasks.view', 'module' => 'tasks', 'description' => 'View tasks'],
            ['name' => 'Create Tasks', 'slug' => 'tasks.create', 'module' => 'tasks', 'description' => 'Create tasks'],
            ['name' => 'Edit Tasks', 'slug' => 'tasks.edit', 'module' => 'tasks', 'description' => 'Edit tasks'],
            ['name' => 'Delete Tasks', 'slug' => 'tasks.delete', 'module' => 'tasks', 'description' => 'Delete tasks'],
            ['name' => 'Assign Tasks', 'slug' => 'tasks.assign', 'module' => 'tasks', 'description' => 'Assign tasks to users'],

            ['name' => 'View CRM', 'slug' => 'crm.view', 'module' => 'crm', 'description' => 'View CRM'],
            ['name' => 'Manage Contacts', 'slug' => 'crm.contacts.manage', 'module' => 'crm', 'description' => 'Create/update/delete contacts'],
            ['name' => 'Manage Companies', 'slug' => 'crm.companies.manage', 'module' => 'crm', 'description' => 'Create/update/delete companies'],
            ['name' => 'Manage Deals', 'slug' => 'crm.deals.manage', 'module' => 'crm', 'description' => 'Create/update/delete deals'],

            ['name' => 'View Chat', 'slug' => 'chat.view', 'module' => 'chat', 'description' => 'View channels and DMs'],
            ['name' => 'Send Messages', 'slug' => 'chat.send', 'module' => 'chat', 'description' => 'Send chat messages'],
            ['name' => 'Manage Channels', 'slug' => 'chat.manage', 'module' => 'chat', 'description' => 'Create/manage channels'],

            ['name' => 'View Teams', 'slug' => 'teams.view', 'module' => 'teams', 'description' => 'View teams'],
            ['name' => 'Manage Teams', 'slug' => 'teams.manage', 'module' => 'teams', 'description' => 'Manage team settings'],
            ['name' => 'Invite Members', 'slug' => 'teams.invite', 'module' => 'teams', 'description' => 'Invite team members'],

            ['name' => 'View Spaces', 'slug' => 'spaces.view', 'module' => 'spaces', 'description' => 'View spaces'],
            ['name' => 'Manage Spaces', 'slug' => 'spaces.manage', 'module' => 'spaces', 'description' => 'Create/update/delete spaces'],

            ['name' => 'View Goals', 'slug' => 'goals.view', 'module' => 'goals', 'description' => 'View goals'],
            ['name' => 'Manage Goals', 'slug' => 'goals.manage', 'module' => 'goals', 'description' => 'Manage goals'],

            ['name' => 'View Dashboards', 'slug' => 'dashboards.view', 'module' => 'dashboards', 'description' => 'View dashboards'],
            ['name' => 'Manage Dashboards', 'slug' => 'dashboards.manage', 'module' => 'dashboards', 'description' => 'Manage dashboards'],

            ['name' => 'View Planner', 'slug' => 'planner.view', 'module' => 'planner', 'description' => 'View planner'],
            ['name' => 'Manage Planner', 'slug' => 'planner.manage', 'module' => 'planner', 'description' => 'Manage planner blocks'],

            ['name' => 'View Users', 'slug' => 'users.view', 'module' => 'users', 'description' => 'View user directory'],
            ['name' => 'Manage Users', 'slug' => 'users.manage', 'module' => 'users', 'description' => 'Manage users and roles (not permission matrix)'],
            ['name' => 'Manage Permissions', 'slug' => 'users.permissions', 'module' => 'users', 'description' => 'Edit which permissions each role has'],

            ['name' => 'Invite Users', 'slug' => 'invite.users', 'module' => 'invite', 'description' => 'Send workspace invitations'],
        ];
    }

    /**
     * @return list<string>
     */
    private function managerSlugs(): array
    {
        return [
            'tasks.view', 'tasks.create', 'tasks.edit', 'tasks.delete', 'tasks.assign',
            'crm.view', 'crm.contacts.manage', 'crm.companies.manage', 'crm.deals.manage',
            'chat.view', 'chat.send', 'chat.manage',
            'teams.view', 'teams.invite',
            'spaces.view',
            'goals.view', 'goals.manage',
            'dashboards.view',
            'planner.view', 'planner.manage',
            'invite.users',
        ];
    }

    /**
     * @return list<string>
     */
    private function userSlugs(): array
    {
        return [
            'tasks.view', 'tasks.create', 'tasks.edit',
            'crm.view', 'crm.contacts.manage', 'crm.companies.manage', 'crm.deals.manage',
            'chat.view', 'chat.send',
            'teams.view', 'teams.invite',
            'spaces.view',
            'goals.view', 'goals.manage',
            'dashboards.view',
            'planner.view', 'planner.manage',
        ];
    }
}
