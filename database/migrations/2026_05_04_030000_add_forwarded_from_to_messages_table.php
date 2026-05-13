<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (! Schema::hasColumn('messages', 'forwarded_from_id')) {
                $table->foreignId('forwarded_from_id')
                    ->nullable()
                    ->after('reply_to_id')
                    ->constrained('messages')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            if (Schema::hasColumn('messages', 'forwarded_from_id')) {
                $table->dropConstrainedForeignId('forwarded_from_id');
            }
        });
    }
};
