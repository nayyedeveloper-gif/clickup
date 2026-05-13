<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreignId('task_list_id')
                ->nullable()
                ->after('space_id')
                ->constrained('task_lists')
                ->nullOnDelete();

            $table->foreignId('parent_task_id')
                ->nullable()
                ->after('task_list_id')
                ->constrained('tasks')
                ->cascadeOnDelete();

            $table->unsignedInteger('position')->default(0)->after('parent_task_id');

            $table->index(['task_list_id', 'position']);
            $table->index('parent_task_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['task_list_id']);
            $table->dropForeign(['parent_task_id']);
            $table->dropIndex(['task_list_id', 'position']);
            $table->dropIndex(['parent_task_id']);
            $table->dropColumn(['task_list_id', 'parent_task_id', 'position']);
        });
    }
};
