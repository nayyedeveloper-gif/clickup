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
        // Update users table role enum
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['owner', 'admin', 'manager', 'member'])->default('member')->change();
        });

        // Add Manager role to roles table
        DB::table('roles')->insertOrIgnore([
            'name' => 'Manager',
            'slug' => 'manager',
            'description' => 'Can see all team members tasks',
            'is_default' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['owner', 'admin', 'member'])->default('member')->change();
        });

        DB::table('roles')->where('slug', 'manager')->delete();
    }
};
