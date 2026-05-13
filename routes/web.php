<?php

use App\Http\Controllers\AllTasksController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\CrmActivityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DealController;
use App\Http\Controllers\FolderController;
use App\Http\Controllers\GoalController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\InviteController;
use App\Http\Controllers\LinkPreviewController;
use App\Http\Controllers\MessageAttachmentController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\MyTasksController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PlannerController;
use App\Http\Controllers\PresenceController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\SpaceController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\TaskCommentController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskListController;
use App\Http\Controllers\TaskStatusController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TimeEntryController;
use App\Http\Controllers\UsersController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('home');
    }

    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return redirect()->route('home');
})->middleware(['auth', 'verified'])->name('dashboard');

// Invitation accept route (accessible without authentication)
Route::get('/invitations/accept/{token}', [InvitationController::class, 'accept'])->name('invitations.accept');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar.update');
    Route::delete('/profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');

    // Presence heartbeat
    Route::post('/presence/heartbeat', [PresenceController::class, 'heartbeat'])->name('presence.heartbeat');
    Route::post('/presence/lookup', [PresenceController::class, 'lookup'])->name('presence.lookup');

    // Web Push Notifications
    Route::get('/push/public-key', [PushSubscriptionController::class, 'publicKey'])->name('push.public-key');
    Route::post('/push/subscribe', [PushSubscriptionController::class, 'subscribe'])->name('push.subscribe');
    Route::post('/push/unsubscribe', [PushSubscriptionController::class, 'unsubscribe'])->name('push.unsubscribe');
    Route::post('/push/test', [PushSubscriptionController::class, 'test'])->name('push.test');

    // In-app Notifications (persistent list, mark as read)
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy'])->name('notifications.destroy');

    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Home redirects to the Inbox
    Route::get('/home', fn () => redirect()->route('inbox.index'))->name('home');

    // Inbox group
    Route::get('/inbox', [InboxController::class, 'index'])->name('inbox.index');
    Route::get('/replies', [InboxController::class, 'replies'])->name('replies.index');
    Route::get('/assigned-comments', [InboxController::class, 'assignedComments'])->name('assigned-comments.index');

    // My Tasks group
    Route::get('/my-tasks', [MyTasksController::class, 'index'])->name('my-tasks');
    Route::get('/my-tasks/assigned', [MyTasksController::class, 'assigned'])->name('my-tasks.assigned');
    Route::get('/my-tasks/today', [MyTasksController::class, 'today'])->name('my-tasks.today');
    Route::get('/my-tasks/personal', [MyTasksController::class, 'personal'])->name('my-tasks.personal');

    // Legacy: keep aliases used by older sidebar links
    Route::get('/assigned-to-me', fn () => redirect()->route('my-tasks.assigned'))->name('assigned-to-me');

    // All Tasks (workspace-level view)
    Route::get('/all-tasks', [AllTasksController::class, 'index'])->name('all-tasks');

    // Invite
    Route::middleware('permission:teams.invite')->group(function () {
        Route::get('/invite', [InviteController::class, 'index'])->name('invite.index');
        Route::post('/invite', [InviteController::class, 'store'])->name('invite.store');
        Route::post('/invite/{invitation}/resend', [InviteController::class, 'resend'])->name('invite.resend');
        Route::post('/invite/{invitation}/approve', [InviteController::class, 'approve'])->name('invite.approve');
        Route::delete('/invite/{invitation}', [InviteController::class, 'destroy'])->name('invite.destroy');
    });

    // Space routes (RBAC + SpacePolicy)
    Route::middleware('permission:spaces.view')->group(function () {
        Route::get('/spaces', [SpaceController::class, 'index'])->name('spaces.index');
        Route::post('/spaces', [SpaceController::class, 'store'])->name('spaces.store');
        Route::get('/spaces/{id}', [SpaceController::class, 'show'])->name('spaces.show');
        Route::put('/spaces/{id}', [SpaceController::class, 'update'])->name('spaces.update');
        Route::delete('/spaces/{id}', [SpaceController::class, 'destroy'])->name('spaces.destroy');

        Route::post('/spaces/{space}/tags', [TagController::class, 'store'])->name('tags.store');
        Route::post('/spaces/{space}/folders', [FolderController::class, 'store'])->name('folders.store');
    });

    // Task routes
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
    Route::get('/api/members', [TaskController::class, 'members'])->name('members.index');
    Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
    Route::put('/tasks/{id}', [TaskController::class, 'update'])->name('tasks.update');
    Route::delete('/tasks/{id}', [TaskController::class, 'destroy'])->name('tasks.destroy');

    // Task comments
    Route::get('/tasks/{task}/comments', [TaskCommentController::class, 'index'])->name('task-comments.index');
    Route::post('/tasks/{task}/comments', [TaskCommentController::class, 'store'])->name('task-comments.store');
    Route::delete('/task-comments/{comment}', [TaskCommentController::class, 'destroy'])->name('task-comments.destroy');

    // Time tracking
    Route::post('/tasks/{task}/time/start', [TimeEntryController::class, 'start'])->name('time.start');
    Route::post('/tasks/{task}/time/stop', [TimeEntryController::class, 'stop'])->name('time.stop');
    Route::delete('/time-entries/{entry}', [TimeEntryController::class, 'destroy'])->name('time.destroy');

    // Tags
    Route::post('/tasks/{task}/tags', [TagController::class, 'attach'])->name('tags.attach');
    Route::delete('/tasks/{task}/tags/{tag}', [TagController::class, 'detach'])->name('tags.detach');
    Route::delete('/tags/{tag}', [TagController::class, 'destroy'])->name('tags.destroy');

    // Folder routes (same permission as spaces)
    Route::middleware('permission:spaces.view')->group(function () {
        Route::put('/folders/{folder}', [FolderController::class, 'update'])->name('folders.update');
        Route::delete('/folders/{folder}', [FolderController::class, 'destroy'])->name('folders.destroy');
    });

    // List routes
    Route::get('/lists', fn () => redirect()->route('spaces.index'));
    Route::get('/lists/{list}', [TaskListController::class, 'show'])->name('lists.show');
    Route::post('/lists', [TaskListController::class, 'store'])->name('lists.store');
    Route::put('/lists/{list}', [TaskListController::class, 'update'])->name('lists.update');
    Route::post('/lists/{list}/favorite', [TaskListController::class, 'toggleFavorite'])->name('lists.favorite');
    Route::post('/lists/{list}/archive', [TaskListController::class, 'archive'])->name('lists.archive');
    Route::post('/lists/{list}/duplicate', [TaskListController::class, 'duplicate'])->name('lists.duplicate');
    Route::post('/lists/{list}/move', [TaskListController::class, 'move'])->name('lists.move');
    Route::delete('/lists/{list}', [TaskListController::class, 'destroy'])->name('lists.destroy');

    // Per-list custom statuses
    Route::post('/lists/{list}/statuses', [TaskStatusController::class, 'store'])->name('statuses.store');
    Route::put('/statuses/{status}', [TaskStatusController::class, 'update'])->name('statuses.update');
    Route::delete('/statuses/{status}', [TaskStatusController::class, 'destroy'])->name('statuses.destroy');

    // Teams
    Route::middleware('permission:teams.view')->group(function () {
        Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');
    });

    Route::middleware('permission:teams.manage')->group(function () {
        Route::post('/teams', [TeamController::class, 'store'])->name('teams.store');
        Route::get('/teams/{team}', [TeamController::class, 'show'])->name('teams.show');
        Route::put('/teams/{team}', [TeamController::class, 'update'])->name('teams.update');
        Route::delete('/teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');
        Route::post('/teams/{team}/members', [TeamController::class, 'addMember'])->name('teams.members.add');
        Route::put('/teams/{team}/members/{user}', [TeamController::class, 'updateMember'])->name('teams.members.update');
        Route::delete('/teams/{team}/members/{user}', [TeamController::class, 'removeMember'])->name('teams.members.remove');
    });

    // CRM
    Route::middleware('permission:crm.view')->group(function () {
        Route::get('/crm/contacts', [ContactController::class, 'index'])->name('crm.contacts.index');
        Route::get('/crm/companies', [CompanyController::class, 'index'])->name('crm.companies.index');
        Route::get('/crm/deals', [DealController::class, 'index'])->name('crm.deals.index');
    });

    Route::middleware('permission:crm.contacts.manage')->group(function () {
        Route::post('/crm/contacts', [ContactController::class, 'store'])->name('crm.contacts.store');
        Route::get('/crm/contacts/{contact}', [ContactController::class, 'show'])->name('crm.contacts.show');
        Route::put('/crm/contacts/{contact}', [ContactController::class, 'update'])->name('crm.contacts.update');
        Route::delete('/crm/contacts/{contact}', [ContactController::class, 'destroy'])->name('crm.contacts.destroy');
    });

    Route::middleware('permission:crm.companies.manage')->group(function () {
        Route::post('/crm/companies', [CompanyController::class, 'store'])->name('crm.companies.store');
        Route::get('/crm/companies/{company}', [CompanyController::class, 'show'])->name('crm.companies.show');
        Route::put('/crm/companies/{company}', [CompanyController::class, 'update'])->name('crm.companies.update');
        Route::delete('/crm/companies/{company}', [CompanyController::class, 'destroy'])->name('crm.companies.destroy');
    });

    Route::middleware('permission:crm.deals.manage')->group(function () {
        Route::post('/crm/deals', [DealController::class, 'store'])->name('crm.deals.store');
        Route::get('/crm/deals/{deal}', [DealController::class, 'show'])->name('crm.deals.show');
        Route::put('/crm/deals/{deal}', [DealController::class, 'update'])->name('crm.deals.update');
        Route::delete('/crm/deals/{deal}', [DealController::class, 'destroy'])->name('crm.deals.destroy');
    });

    Route::post('/crm/activities', [CrmActivityController::class, 'store'])->name('crm.activities.store');
    Route::delete('/crm/activities/{activity}', [CrmActivityController::class, 'destroy'])->name('crm.activities.destroy');

    // Goals
    Route::get('/goals', [GoalController::class, 'index'])->name('goals.index');
    Route::post('/goals', [GoalController::class, 'store'])->name('goals.store');
    Route::put('/goals/{goal}', [GoalController::class, 'update'])->name('goals.update');
    Route::delete('/goals/{goal}', [GoalController::class, 'destroy'])->name('goals.destroy');
    Route::post('/goal-folders', [GoalController::class, 'storeFolder'])->name('goal-folders.store');
    Route::delete('/goal-folders/{folder}', [GoalController::class, 'destroyFolder'])->name('goal-folders.destroy');

    // Planner
    Route::middleware('permission:planner.view')->group(function () {
        Route::get('/planner', [PlannerController::class, 'index'])->name('planner.index');
    });

    Route::middleware('permission:planner.manage')->group(function () {
        Route::post('/planner/blocks', [PlannerController::class, 'storeBlock'])->name('planner.blocks.store');
        Route::put('/planner/blocks/{block}', [PlannerController::class, 'updateBlock'])->name('planner.blocks.update');
        Route::delete('/planner/blocks/{block}', [PlannerController::class, 'destroyBlock'])->name('planner.blocks.destroy');
    });

    // Dashboards
    Route::middleware('permission:dashboards.view')->group(function () {
        Route::get('/dashboards', [DashboardController::class, 'index'])->name('dashboards.index');
        Route::get('/dashboards/{dashboard}', [DashboardController::class, 'show'])->name('dashboards.show');
    });

    Route::middleware('permission:dashboards.manage')->group(function () {
        Route::post('/dashboards', [DashboardController::class, 'store'])->name('dashboards.store');
        Route::put('/dashboards/{dashboard}', [DashboardController::class, 'update'])->name('dashboards.update');
        Route::delete('/dashboards/{dashboard}', [DashboardController::class, 'destroy'])->name('dashboards.destroy');
        Route::post('/dashboards/{dashboard}/widgets', [DashboardController::class, 'storeWidget'])->name('dashboards.widgets.store');
        Route::delete('/widgets/{widget}', [DashboardController::class, 'destroyWidget'])->name('dashboards.widgets.destroy');
    });

    // Invitation routes
    Route::post('/invitations', [InvitationController::class, 'store'])->name('invitations.store');

    // Channel routes (app permissions + ChannelPolicy for resource rules)
    Route::middleware('permission:chat.view')->group(function () {
        Route::get('/channels', [ChannelController::class, 'index'])->name('channels.index');
        Route::get('/channels/{channel}', [ChannelController::class, 'show'])->name('channels.show');
        Route::get('/channels/{channel}/edit', [ChannelController::class, 'edit'])->name('channels.edit');
        Route::put('/channels/{channel}', [ChannelController::class, 'update'])->name('channels.update');
        Route::delete('/channels/{channel}', [ChannelController::class, 'destroy'])->name('channels.destroy');
        Route::post('/channels/{channel}/members', [ChannelController::class, 'addMember'])->name('channels.addMember');
        Route::delete('/channels/{channel}/members/{user}', [ChannelController::class, 'removeMember'])->name('channels.removeMember');
        Route::get('/api/channels/{channel}/members', [ChannelController::class, 'getMembers'])->name('channels.members');
    });

    Route::middleware(['permission:chat.view', 'permission:chat.send'])->group(function () {
        Route::get('/channels/create', [ChannelController::class, 'create'])->name('channels.create');
        Route::post('/channels', [ChannelController::class, 'store'])->name('channels.store');
    });

    // Message routes
    Route::middleware('permission:chat.view')->group(function () {
        Route::get('/messages', [MessageController::class, 'index'])->name('messages.index');
        Route::get('/messages/attachments/{messageAttachment}', [MessageAttachmentController::class, 'show'])
            ->name('messages.attachments.show');
        Route::get('/messages/thread/{user}', [MessageController::class, 'thread'])->name('messages.thread');
        Route::get('/messages/media/{user}', [MessageController::class, 'media'])->name('messages.media');
        Route::post('/messages/{message}/mark-read', [MessageController::class, 'markAsRead'])->name('messages.mark-read');
        Route::get('/api/link-preview', [LinkPreviewController::class, 'show'])->name('link-preview');
        Route::get('/api/users/search', [MessageController::class, 'searchUsers'])->name('users.search');
    });

    Route::middleware('permission:chat.send')->group(function () {
        Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');
        Route::post('/messages/{message}/forward', [MessageController::class, 'forward'])->name('messages.forward');
        Route::delete('/messages/{message}', [MessageController::class, 'destroy'])->name('messages.destroy');
        Route::post('/messages/{message}/react', [MessageController::class, 'react'])->name('messages.react');
        Route::delete('/messages/{message}/react', [MessageController::class, 'unreact'])->name('messages.unreact');
    });

    // User & Permissions management (admin only)
    Route::middleware('permission:users.manage')->group(function () {
        Route::get('/users', [UsersController::class, 'index'])->name('users.index');
        Route::put('/users/{user}/role', [UsersController::class, 'updateRole'])->name('users.update-role');
        Route::put('/users/{user}/spaces', [UsersController::class, 'updateSpaces'])->name('users.update-spaces');
        Route::post('/users/{user}/toggle-active', [UsersController::class, 'toggleActive'])->name('users.toggle-active');
        Route::delete('/users/{user}', [UsersController::class, 'destroy'])->name('users.destroy');
        Route::post('/permissions/role', [UsersController::class, 'updateRolePermissions'])->name('permissions.update-role');
    });
});

require __DIR__.'/auth.php';
