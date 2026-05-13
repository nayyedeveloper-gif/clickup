<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $companies = Company::withCount(['contacts', 'deals'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->q.'%');
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('Crm/Companies', [
            'companies' => $companies,
            'filters' => $request->only('q'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);
        $validated['owner_id'] = $request->user()->id;
        Company::create($validated);

        return back();
    }

    public function show(Company $company): Response
    {
        $company->load([
            'owner:id,name',
            'contacts' => fn ($q) => $q->orderByDesc('created_at'),
            'contacts.owner:id,name',
            'deals' => fn ($q) => $q->orderByDesc('created_at'),
            'deals.stage',
            'deals.contact:id,first_name,last_name',
            'activities' => fn ($q) => $q->orderByDesc('happened_at'),
            'activities.user:id,name',
        ]);

        return Inertia::render('Crm/CompanyDetail', [
            'company' => $company,
        ]);
    }

    public function update(Request $request, Company $company): RedirectResponse
    {
        $company->update($this->validateData($request, true));

        return back();
    }

    public function destroy(Company $company): RedirectResponse
    {
        $company->delete();

        return back();
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $rule = fn (string $base) => $partial ? 'sometimes|'.$base : $base;

        return $request->validate([
            'name' => $rule('required|string|max:160'),
            'industry' => $rule('nullable|string|max:120'),
            'website' => $rule('nullable|string|max:255'),
            'phone' => $rule('nullable|string|max:60'),
            'email' => $rule('nullable|email|max:160'),
            'address' => $rule('nullable|string'),
            'notes' => $rule('nullable|string'),
            'color' => $rule('nullable|string|max:16'),
        ]);
    }
}
