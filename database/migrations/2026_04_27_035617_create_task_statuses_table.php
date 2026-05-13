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
        Schema::create('task_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_list_id')->constrained()->cascadeOnDelete();
            $table->string('key', 50);          // machine name e.g. "to_do"
            $table->string('label', 60);        // display name e.g. "To Do"
            $table->string('color', 16)->default('#9ca3af');
            $table->enum('type', ['open', 'active', 'closed'])->default('open');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['task_list_id', 'key']);
            $table->index(['task_list_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_statuses');
    }
};
