<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\TestSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestSettingController extends Controller
{
    public function edit()
    {
        return Inertia::render('admin/settings/edit', [
            'settings' => TestSetting::current(),
            'sections' => Section::withCount('questions')
                ->orderBy('title')
                ->get(['id', 'title']),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'distribution'              => ['array'],
            'distribution.*.section_id' => ['required', 'integer', 'exists:sections,id'],
            'distribution.*.count'      => ['required', 'integer', 'min:1', 'max:100'],
        ]);

        $errors = [];
        foreach ($data['distribution'] ?? [] as $i => $row) {
            $available = Section::find($row['section_id'])?->questions()->count() ?? 0;
            if ($row['count'] > $available) {
                $errors["distribution.$i.count"] =
                    "В разделе доступно только {$available} вопрос(ов).";
            }
        }
        if ($errors) {
            return back()->withErrors($errors)->withInput();
        }

        $bySection = [];
        foreach ($data['distribution'] ?? [] as $row) {
            $bySection[(int) $row['section_id']] = (int) $row['count'];
        }
        $distribution = collect($bySection)
            ->map(fn ($count, $sectionId) => ['section_id' => $sectionId, 'count' => $count])
            ->values()
            ->all();

        TestSetting::current()->update(['distribution' => $distribution]);

        return redirect()->route('admin.settings.edit')
            ->with('status', 'Настройки теста сохранены.');
    }
}