<?php

namespace App\Http\Controllers;

use App\Models\CrmActivity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CrmActivityController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'contact_id' => 'nullable|exists:contacts,id',
            'company_id' => 'nullable|exists:companies,id',
            'deal_id' => 'nullable|exists:deals,id',
            'type' => 'required|in:note,call,email,meeting,task',
            'subject' => 'nullable|string|max:200',
            'body' => 'nullable|string',
            'happened_at' => 'nullable|date',
        ]);

        CrmActivity::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'happened_at' => $validated['happened_at'] ?? now(),
        ]);

        return back();
    }

    public function destroy(CrmActivity $activity): RedirectResponse
    {
        abort_unless($activity->user_id === request()->user()->id, 403);
        $activity->delete();

        return back();
    }
}
