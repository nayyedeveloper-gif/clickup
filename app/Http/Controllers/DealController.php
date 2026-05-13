<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Contact;
use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DealController extends Controller
{
    public function index(Request $request): Response
    {
        $pipeline = $request->filled('pipeline')
            ? Pipeline::with('stages')->find($request->pipeline)
            : Pipeline::with('stages')->where('is_default', true)->first()
                ?? Pipeline::with('stages')->orderBy('position')->first();

        if (! $pipeline) {
            $pipeline = Pipeline::create(['name' => 'Sales Pipeline', 'is_default' => true]);
            $pipeline->load('stages');
        }

        $deals = Deal::with(['company:id,name,color', 'contact:id,first_name,last_name', 'owner:id,name'])
            ->where('pipeline_id', $pipeline->id)
            ->orderBy('position')
            ->get();

        return Inertia::render('Crm/Deals', [
            'pipeline' => $pipeline,
            'pipelines' => Pipeline::orderBy('position')->get(['id', 'name', 'is_default']),
            'deals' => $deals,
            'companies' => Company::orderBy('name')->get(['id', 'name', 'color']),
            'contacts' => Contact::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'company_id']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);
        $validated['owner_id'] = $request->user()->id;
        $validated['position'] = (int) Deal::where('pipeline_stage_id', $validated['pipeline_stage_id'])->max('position') + 1;
        Deal::create($validated);

        return back();
    }

    public function show(Request $request, Deal $deal)
    {
        $deal->load([
            'pipeline.stages',
            'stage',
            'company:id,name,color',
            'contact:id,first_name,last_name',
            'owner:id,name',
            'activities' => fn ($q) => $q->orderByDesc('happened_at'),
            'activities.user:id,name',
        ]);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['deal' => $deal]);
        }

        return Inertia::render('Crm/DealDetail', [
            'deal' => $deal,
            'companies' => Company::orderBy('name')->get(['id', 'name', 'color']),
            'contacts' => Contact::orderBy('first_name')->get(['id', 'first_name', 'last_name', 'company_id']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Deal $deal): RedirectResponse
    {
        $validated = $this->validateData($request, true);

        // If stage changed, append to end of new stage
        if (isset($validated['pipeline_stage_id']) && $validated['pipeline_stage_id'] !== $deal->pipeline_stage_id) {
            $validated['position'] = (int) Deal::where('pipeline_stage_id', $validated['pipeline_stage_id'])->max('position') + 1;

            $newStage = \App\Models\PipelineStage::find($validated['pipeline_stage_id']);
            if ($newStage && in_array($newStage->type, ['won', 'lost'], true) && ! $deal->closed_at) {
                $validated['closed_at'] = now()->toDateString();
            }
            if ($newStage && $newStage->type === 'open') {
                $validated['closed_at'] = null;
            }
        }

        $deal->update($validated);

        return back();
    }

    public function destroy(Deal $deal): RedirectResponse
    {
        $deal->delete();

        return back();
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $rule = fn (string $base) => $partial ? 'sometimes|'.$base : $base;

        return $request->validate([
            'pipeline_id' => $rule('required|exists:pipelines,id'),
            'pipeline_stage_id' => $rule('required|exists:pipeline_stages,id'),
            'company_id' => $rule('nullable|exists:companies,id'),
            'contact_id' => $rule('nullable|exists:contacts,id'),
            'title' => $rule('required|string|max:200'),
            'amount' => $rule('nullable|numeric|min:0'),
            'currency' => $rule('nullable|string|max:8'),
            'expected_close_date' => $rule('nullable|date'),
            'notes' => $rule('nullable|string'),
        ]);
    }
}
