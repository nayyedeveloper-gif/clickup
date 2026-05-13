<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_lists', function (Blueprint $table) {
            $table->string('icon', 32)->nullable()->after('color');
            $table->boolean('is_favorite')->default(false)->after('icon');
            $table->timestamp('archived_at')->nullable()->after('is_favorite');
        });
    }

    public function down(): void
    {
        Schema::table('task_lists', function (Blueprint $table) {
            $table->dropColumn(['icon', 'is_favorite', 'archived_at']);
        });
    }
};
