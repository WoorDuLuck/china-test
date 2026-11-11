<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuestionRequest;
use App\Http\Requests\UpdateQuestionRequest;
use App\Models\Question;
use App\Models\QuestionType;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class QuestionController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('admin/questions/index', [
            'questions' => Question::query()
                ->with(['section:id,title', 'type:id,name,key'])
                ->when($request->integer('section_id'), fn ($q, $id) => $q->where('section_id', $id))
                ->when($request->integer('type_id'),    fn ($q, $id) => $q->where('type_id', $id))
                ->latest('id')
                ->paginate(20)
                ->withQueryString(),
            'sections' => Section::orderBy('title')->get(['id', 'title']),
            'types'    => QuestionType::orderBy('id')->get(['id', 'name', 'key']),
            'filters'  => $request->only(['section_id', 'type_id']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/questions/create', [
            'sections' => Section::orderBy('title')->get(['id', 'title']),
            'types'    => QuestionType::orderBy('id')->get(['id', 'name', 'key']),
        ]);
    }

    public function store(StoreQuestionRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request) {
            $question = Question::create([
                'section_id' => $data['section_id'],
                'type_id'    => $data['type_id'],
                'text'       => $data['text'],
                'image'      => $request->file('image')?->store('questions', 'public'),
            ]);

            $this->syncOptions($question, $data['options'] ?? [], $request);
        });

        return redirect()->route('admin.questions.index')
            ->with('status', 'Вопрос создан.');
    }

    public function edit(Question $question)
    {
        $question->load('options');

        return Inertia::render('admin/questions/edit', [
            'question' => $question,
            'sections' => Section::orderBy('title')->get(['id', 'title']),
            'types'    => QuestionType::orderBy('id')->get(['id', 'name', 'key']),
        ]);
    }

    public function update(UpdateQuestionRequest $request, Question $question)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $request, $question) {
            $question->update([
                'section_id' => $data['section_id'],
                'type_id'    => $data['type_id'],
                'text'       => $data['text'],
                'image'      => $request->file('image')?->store('questions', 'public')
                                ?? $question->image,
            ]);

            $this->syncOptions($question, $data['options'] ?? [], $request);
        });

        return redirect()->route('admin.questions.index')
            ->with('status', 'Вопрос обновлён.');
    }

    public function destroy(Question $question)
    {
        DB::transaction(function () use ($question) {
            $question->options()->delete();
            $question->delete();
        });

        return redirect()->route('admin.questions.index')
            ->with('status', 'Вопрос удалён.');
    }

    private function syncOptions(Question $question, array $options, Request $request): void
    {
        $keepIds = [];

        foreach ($options as $i => $opt) {
            $payload = [
                'text'           => $opt['text'] ?? null,
                'order_position' => $opt['order_position'] ?? null,
                'is_correct'     => (bool) ($opt['is_correct'] ?? false),
            ];

            if ($file = $request->file("options.$i.image")) {
                $payload['image'] = $file->store('options', 'public');
            }

            if (! empty($opt['id'])) {
                $option = $question->options()->findOrFail($opt['id']);
                $option->update($payload);
                $keepIds[] = $option->id;
            } else {
                $created = $question->options()->create($payload);
                $keepIds[] = $created->id;
            }
        }

        foreach ($question->options()->whereNotIn('id', $keepIds)->get() as $o) {
            if ($o->image) {
                Storage::disk('public')->delete($o->image);
            }
            $o->delete();
        }
    }
}