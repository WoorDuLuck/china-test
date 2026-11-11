<?php

namespace App\Http\Controllers;

use App\Services\TestSessionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestController extends Controller
{
    public function __construct(private TestSessionService $svc) {}

    public function start()
    {
        $this->svc->forget();
        abort_unless($this->svc->start(), 500, 'Тест не настроен');

        return redirect()->route('test.show');
    }

    public function show()
    {
        abort_unless($this->svc->hasActive(), 404);

        return Inertia::render('Test/Show', [
            'questions' => $this->svc->questionsForDisplay(),
            'gaps'      => $this->svc->gapPools(),
            'unanswered' => session('unanswered', []),
        ]);
    }

    public function submit(Request $request)
    {
        abort_unless($this->svc->hasActive(), 404);

        $this->svc->setAnswers($request->input('answers', []));

        if (($unanswered = $this->svc->unansweredIds()) !== []) {
            return redirect()->route('test.show')
                ->with('unanswered', $unanswered)
                ->withErrors(['answers' => 'Ответьте на все вопросы']);
        }

        $this->svc->finish();

        return redirect()->route('test.result');
    }

    public function result()
    {
        abort_unless($this->svc->isFinished(), 404);

        return Inertia::render('Test/Result', [
            'result' => $this->svc->result(),
            'review' => $this->svc->review(),
        ]);
    }

    public function reset()
    {
        $this->svc->forget();
        return redirect()->route('home');
    }
}