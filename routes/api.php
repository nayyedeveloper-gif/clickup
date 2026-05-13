<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChannelController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\SpaceController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\GoogleAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/test', function () {
    return response()->json(['status' => 'success', 'message' => 'API is working']);
});

Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/auth/google', [GoogleAuthController::class, 'mobileLogin']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Spaces (RBAC + SpacePolicy)
    Route::middleware('permission:spaces.view')->group(function () {
        Route::apiResource('spaces', SpaceController::class)->names([
            'index' => 'api.spaces.index',
            'store' => 'api.spaces.store',
            'show' => 'api.spaces.show',
            'update' => 'api.spaces.update',
            'destroy' => 'api.spaces.destroy',
        ]);
    });

    // Channels: explicit routes + permissions (align with web ChannelPolicy)
    Route::middleware('permission:chat.view')->group(function () {
        Route::get('/spaces/{space}/channels', [ChannelController::class, 'index']);
        Route::get('/channels/{channel}', [ChannelController::class, 'show'])->name('api.channels.show');
        Route::get('/channels/{channel}/messages', [ChannelController::class, 'messages']);
    });

    Route::middleware(['permission:chat.view', 'permission:chat.send'])->group(function () {
        Route::post('/channels', [ChannelController::class, 'store'])->name('api.channels.store');
        Route::post('/channels/{channel}/messages', [ChannelController::class, 'sendMessage']);
    });

    // Tasks (names prefixed with 'api.' to avoid conflict with web route names in Ziggy)
    Route::apiResource('tasks', TaskController::class)->names([
        'index' => 'api.tasks.index',
        'store' => 'api.tasks.store',
        'show' => 'api.tasks.show',
        'update' => 'api.tasks.update',
        'destroy' => 'api.tasks.destroy',
    ]);
    Route::post('/tasks/{task}/comments', [TaskController::class, 'addComment'])->name('api.task-comments.store');

    // Direct Messages
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/{user}', [MessageController::class, 'show']);
    Route::post('/messages/{user}', [MessageController::class, 'store']);
});
