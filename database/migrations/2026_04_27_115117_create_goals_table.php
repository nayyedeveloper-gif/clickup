<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('goals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('folder_id')->nullable()->constrained('goal_folders')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('target_type', ['number', 'currency', 'percentage', 'boolean', 'task'])->default('number');
            $table->decimal('target_value', 14, 2)->default(1);
            $table->decimal('current_value', 14, 2)->default(0);
            $table->string('unit', 16)->nullable();
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['active', 'completed', 'archived'])->default('active');
            $table->string('color', 16)->default('#7c3aed');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['owner_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('goals');
    }
};
