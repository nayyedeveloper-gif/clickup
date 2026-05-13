<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Contact;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    public function index(Request $request): Response
    {
        $contacts = Contact::with(['company:id,name,color', 'owner:id,name'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = '%'.$request->q.'%';
                $q->where(function ($q) use ($term) {
                    $q->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->status))
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Crm/Contacts', [
            'contacts' => $contacts,
            'companies' => Company::orderBy('name')->get(['id', 'name', 'color']),
            'users' => User::orderBy('name')->get(['id', 'name']),
            'filters' => $request->only('q', 'status'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateData($request);
        $validated['owner_id'] = $request->user()->id;
        Contact::create($validated);

        return back();
    }

    public function show(Contact $contact): Response
    {
        $contact->load([
            'company',
            'owner',
            'deals.stage',
            'activities.user:id,name',
        ]);

        return Inertia::render('Crm/ContactDetail', [
            'contact' => $contact,
            'companies' => Company::orderBy('name')->get(['id', 'name']),
            'users' => User::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Contact $contact): RedirectResponse
    {
        $contact->update($this->validateData($request, true));

        return back();
    }

    public function destroy(Contact $contact): RedirectResponse
    {
        $contact->delete();

        return back();
    }

    private function validateData(Request $request, bool $partial = false): array
    {
        $rule = fn (string $base) => $partial ? 'sometimes|'.$base : $base;

        return $request->validate([
            'first_name' => $rule('required|string|max:120'),
            'last_name' => $rule('nullable|string|max:120'),
            'email' => $rule('nullable|email|max:160'),
            'phone' => $rule('nullable|string|max:60'),
            'title' => $rule('nullable|string|max:120'),
            'company_id' => $rule('nullable|exists:companies,id'),
            'status' => $rule('required|in:lead,prospect,customer,lost'),
            'notes' => $rule('nullable|string'),
        ]);
    }
}
