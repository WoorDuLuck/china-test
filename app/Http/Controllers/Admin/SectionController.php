<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SectionController extends Controller
{
    public function index()
    {
        return Inertia::render('admin/sections/index', [
            'sections' => Section::withCount('questions')
                ->orderBy('title')
                ->paginate(20)
                ->withQueryString(),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/sections/create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:256'],
            'description' => ['nullable', 'string'],
        ]);

        Section::create($data);

        return redirect()->route('admin.sections.index')
            ->with('status', 'Раздел создан.');
    }

    public function edit(Section $section)
    {
        return Inertia::render('admin/sections/edit', [
            'section' => $section,
        ]);
    }

    public function update(Request $request, Section $section)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:256'],
            'description' => ['nullable', 'string'],
        ]);

        $section->update($data);

        return redirect()->route('admin.sections.index')
            ->with('status', 'Раздел обновлён.');
    }

    public function destroy(Section $section)
    {
        if ($section->questions()->exists()) {
            return back()->withErrors([
                'section' => 'Нельзя удалить раздел, пока в нём есть вопросы.',
            ]);
        }

        $section->delete();

        return redirect()->route('admin.sections.index')
            ->with('status', 'Раздел удалён.');
    }
}