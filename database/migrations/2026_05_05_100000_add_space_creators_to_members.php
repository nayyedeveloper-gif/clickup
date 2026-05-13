<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add all space creators to space_user table if not already there
        $spaces = DB::table('spaces')->select('id', 'created_by')->get();
        
        foreach ($spaces as $space) {
            if ($space->created_by) {
                $exists = DB::table('space_user')
                    ->where('space_id', $space->id)
                    ->where('user_id', $space->created_by)
                    ->exists();
                
                if (!$exists) {
                    DB::table('space_user')->insert([
                        'space_id' => $space->id,
                        'user_id' => $space->created_by,
                        'role' => 'owner',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove space creators from space_user table (optional - can be left empty)
    }
};
