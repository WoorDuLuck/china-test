<?php

namespace App\Services;

use App\Enums\QuestionTypeKey;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\TestSetting;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Session;

class TestSessionService
{
    private const SESSION_KEY = 'test';

    /*
    |--------------------------------------------------------------------------
    | Публичный API
    |--------------------------------------------------------------------------
    */

    /**
     * Начать новый тест. Перезаписывает любую существующую сессию.
     * Возвращает false, если настройки пусты / не хватает вопросов.
     */
    public function start(): bool
    {
        $questions = $this->buildQuestions();

        if ($questions->isEmpty()) {
            return false;
        }

        Session::put(self::SESSION_KEY, [
            'started_at' => now()->toIso8601String(),
            'questions'  => $this->snapshot($questions),
            'answers'    => [],
            'result'     => null,
        ]);

        return true;
    }

    public function hasActive(): bool
    {
        return Session::has(self::SESSION_KEY)
            && ! empty(Session::get(self::SESSION_KEY . '.questions'));
    }

    public function isFinished(): bool
    {
        return Session::has(self::SESSION_KEY . '.result');
    }

    /**
     * Вопросы для отображения (без is_correct!). Порядок опций — уже перемешан и сохранён в snapshot.
     *
     * @return array<int, array{
     *     id:int, type:string, text:string, image:?string,
     *     options: array<int, array{id:int, text:?string, image:?string}>
     * }>
     */
    public function questionsForDisplay(): array
    {
        $snapshot = Session::get(self::SESSION_KEY . '.questions', []);

        return array_map(function (array $q) {
            return [
                'id'      => $q['id'],
                'type'    => $q['type'],
                'text'    => $q['text'],
                'image'   => $q['image'],
                'options' => array_map(
                    fn (array $o) => ['id' => $o['id'], 'text' => $o['text'], 'image' => $o['image']],
                    $q['options'],
                ),
            ];
        }, $snapshot);
    }

    /**
     * Для gap_fill: массив [question_id => [номер_пропуска => список option_id из пула]].
     * Клиент рендерит <select> рядом с каждым {{n}}, где значение — option_id.
     * Пул одинаков для всех пропусков вопроса; порядок слов — из snapshot.
     *
     * @return array<int, array<int, int[]>>
     */
    public function gapPools(): array
    {
        $snapshot = Session::get(self::SESSION_KEY . '.questions', []);
        $out = [];

        foreach ($snapshot as $q) {
            if ($q['type'] !== QuestionTypeKey::GapFill->value) {
                continue;
            }

            $poolIds = array_column($q['options'], 'id');
            $gaps    = $this->parseGapNumbers($q['text']);

            $out[$q['id']] = array_fill_keys($gaps, $poolIds);
        }

        return $out;
    }

    /**
     * Сохранить ответ пользователя. Используется, если захотите промежуточное сохранение;
     * при отправке формы вызывается массивом через setAnswers().
     */
    public function setAnswers(array $answers): void
    {
        $snapshot  = Session::get(self::SESSION_KEY . '.questions', []);
        $questions = collect($snapshot)->keyBy('id');
        $clean     = [];

        foreach ($questions as $id => $q) {
            if (! array_key_exists($id, $answers)) {
                continue;
            }
            $value = $this->normalizeAnswer($q, $answers[$id]);
            if ($value !== null) {
                $clean[$id] = $value;
            }
        }

        Session::put(self::SESSION_KEY . '.answers', $clean);
    }

    /**
     * Проверить, что все вопросы отвечены.
     *
     * @return int[] id неотвеченных вопросов
     */
    public function unansweredIds(): array
    {
        $snapshot = Session::get(self::SESSION_KEY . '.questions', []);
        $answers  = Session::get(self::SESSION_KEY . '.answers', []);
        $unanswered = [];

        foreach ($snapshot as $q) {
            if (! $this->isAnswerPresent($q, $answers[$q['id']] ?? null)) {
                $unanswered[] = $q['id'];
            }
        }

        return $unanswered;
    }

    /**
     * Финализация: проверка, подсчёт баллов, запись результата в сессию.
     * Возвращает детализацию или null, если есть неотвеченные вопросы.
     */
    public function finish(): ?array
    {
        if ($this->unansweredIds() !== []) {
            return null;
        }

        $snapshot = Session::get(self::SESSION_KEY . '.questions', []);
        $answers  = Session::get(self::SESSION_KEY . '.answers', []);
        $details  = [];
        $total    = 0.0;

        foreach ($snapshot as $q) {
            $check = $this->checkQuestion($q, $answers[$q['id']]);
            $total += $check['score'];
            $details[] = [
                'question_id' => $q['id'],
                'status'      => $check['status'], // correct | partial | wrong
                'score'       => $check['score'],
            ];
        }

        $result = [
            'score'      => round($total, 2),
            'total'      => count($snapshot),
            'details'    => $details,
            'finished_at'=> now()->toIso8601String(),
        ];

        Session::put(self::SESSION_KEY . '.result', $result);

        return $result;
    }

    public function result(): ?array
    {
        return Session::get(self::SESSION_KEY . '.result');
    }

    /**
     * Обзор: для страницы результата — вопрос, ответ пользователя, правильный ответ, статус.
     */
    public function review(): array
    {
        $snapshot = Session::get(self::SESSION_KEY . '.questions', []);
        $answers  = Session::get(self::SESSION_KEY . '.answers', []);
        $result   = $this->result();
        $statusById = collect($result['details'] ?? [])->keyBy('question_id');

        return array_map(function (array $q) use ($answers, $statusById) {
            $userAnswer = $answers[$q['id']] ?? null;
            $check      = $this->checkQuestion($q, $userAnswer);

            return [
                'id'           => $q['id'],
                'type'         => $q['type'],
                'text'         => $q['text'],
                'image'        => $q['image'],
                'options'      => $q['options'],
                'option_texts' => collect($q['options'])->mapWithKeys(
                    fn (array $o) => [$o['id'] => $o['text']]
                )->all(),
                'user_answer'  => $userAnswer,
                'correct'      => $check['correct'],
                'status'       => $statusById[$q['id']]['status'] ?? $check['status'],
                'score'        => $statusById[$q['id']]['score'] ?? $check['score'],
            ];
        }, $snapshot);
    }

    public function forget(): void
    {
        Session::forget(self::SESSION_KEY);
    }

    /*
    |--------------------------------------------------------------------------
    | Внутренняя логика
    |--------------------------------------------------------------------------
    */

    /**
     * Собрать вопросы согласно настройкам: случайно из каждого раздела.
     */
    private function buildQuestions(): Collection
    {
        $distribution = TestSetting::current()->distribution();
        $picked = collect();

        foreach ($distribution as $row) {
            $sectionId = (int) ($row['section_id'] ?? 0);
            $count     = (int) ($row['count'] ?? 0);

            if ($sectionId <= 0 || $count <= 0) {
                continue;
            }

            $questions = Question::query()
                ->where('section_id', $sectionId)
                ->with(['type', 'options'])
                ->inRandomOrder()
                ->limit($count)
                ->get();

            $picked = $picked->merge($questions);
        }

        return $picked->values();
    }

    /**
     * Преобразовать коллекцию вопросов в массив, пригодный для хранения в сессии.
     * Здесь же перемешиваются опции и фиксируется правильный ответ.
     */
    private function snapshot(Collection $questions): array
    {
        return $questions->map(function (Question $q) {
            $typeKey = $q->typeKey()->value;

            $options = $q->options->map(function (QuestionOption $o) use ($typeKey) {
                return [
                    'id'             => $o->id,
                    'text'           => $o->text,
                    'image'          => $o->image,
                    'order_position' => $o->order_position,
                    'is_correct'     => $o->is_correct,
                ];
            })->all();

            // Перемешиваем опции. Для ordering/ gap_fill показываем тоже в случайном порядке,
            // чтобы нельзя было вывести правильный порядок из нумерации.
            $options = $this->shuffleOptions($options);

            return [
                'id'      => $q->id,
                'type'    => $typeKey,
                'text'    => $q->text,
                'image'   => $q->image,
                'options' => $options,
            ];
        })->all();
    }

    private function shuffleOptions(array $options): array
    {
        shuffle($options);

        return $options;
    }

    /**
     * Убедиться, что ответ имеет правильную форму. Возвращает null, если ответ пуст/невалиден.
     */
    private function normalizeAnswer(array $question, mixed $value): mixed
    {
        $type = $question['type'];
        $allowedIds = array_column($question['options'], 'id');

        return match ($type) {
            QuestionTypeKey::Single->value => is_numeric($value) && in_array((int) $value, $allowedIds, true)
                ? (int) $value : null,

            QuestionTypeKey::Multiple->value => is_array($value)
                ? array_values(array_intersect(array_map('intval', $value), $allowedIds)) : null,

            QuestionTypeKey::Ordering->value => is_array($value)
                ? array_values(array_intersect(array_map('intval', $value), $allowedIds)) : null,

            QuestionTypeKey::GapFill->value => is_array($value)
                ? (function () use ($value, $allowedIds) {
                    $clean = [];
                    foreach ($value as $gap => $optId) {
                        $gap = (int) $gap;
                        $optId = (int) $optId;
                        if ($gap >= 1 && in_array($optId, $allowedIds, true)) {
                            $clean[$gap] = $optId;
                        }
                    }
                    return $clean;
                })() : null,

            default => null,
        };
    }

    private function isAnswerPresent(array $question, mixed $answer): bool
    {
        return match ($question['type']) {
            QuestionTypeKey::Single->value   => is_int($answer),
            QuestionTypeKey::Multiple->value => is_array($answer) && count($answer) > 0,
            QuestionTypeKey::Ordering->value => is_array($answer) && count($answer) === count($question['options']),
            QuestionTypeKey::GapFill->value  => is_array($answer)
                && count($answer) === count($this->parseGapNumbers($question['text'])),
            default => false,
        };
    }

    /**
     * Проверка одного вопроса.
     *
     * @return array{status:string, score:float, correct:mixed}
     */
    private function checkQuestion(array $question, mixed $answer): array
    {
        $type = $question['type'];

        return match ($type) {
            QuestionTypeKey::Single->value   => $this->checkSingle($question, $answer),
            QuestionTypeKey::Multiple->value => $this->checkMultiple($question, $answer),
            QuestionTypeKey::Ordering->value => $this->checkOrdering($question, $answer),
            QuestionTypeKey::GapFill->value  => $this->checkGapFill($question, $answer),
            default => ['status' => 'wrong', 'score' => 0.0, 'correct' => null],
        };
    }

    private function checkSingle(array $question, mixed $answer): array
    {
        $correct = array_column(
            array_filter($question['options'], fn ($o) => ! empty($o['is_correct'])),
            'id',
        );
        $correctId = $correct[0] ?? null;
        $ok        = is_int($answer) && $answer === $correctId;

        return [
            'status'  => $ok ? 'correct' : 'wrong',
            'score'   => $ok ? 1.0 : 0.0,
            'correct' => $correctId,
        ];
    }

    private function checkMultiple(array $question, mixed $answer): array
    {
        $correctIds = array_column(
            array_filter($question['options'], fn ($o) => ! empty($o['is_correct'])),
            'id',
        );
        $given = is_array($answer) ? array_map('intval', $answer) : [];

        $allCorrectSelected = array_diff($correctIds, $given) === [];
        $noWrongSelected    = array_diff($given, $correctIds) === [];

        if ($allCorrectSelected && $noWrongSelected) {
            return ['status' => 'correct', 'score' => 1.0, 'correct' => $correctIds];
        }

        if ($noWrongSelected && count($given) > 0) {
            return ['status' => 'partial', 'score' => 0.5, 'correct' => $correctIds];
        }

        return ['status' => 'wrong', 'score' => 0.0, 'correct' => $correctIds];
    }

    private function checkOrdering(array $question, mixed $answer): array
    {
        // Эталон: [option_id => order_position]
        $expected = [];
        foreach ($question['options'] as $o) {
            $expected[$o['id']] = (int) $o['order_position'];
        }

        if (! is_array($answer) || count($answer) !== count($expected)) {
            return ['status' => 'wrong', 'score' => 0.0, 'correct' => $expected];
        }

        $correctPositions = 0;
        foreach ($answer as $index => $optionId) {
            $position = $index + 1;
            if (($expected[$optionId] ?? null) === $position) {
                $correctPositions++;
            }
        }

        $total    = count($expected);
        $isFull   = $correctPositions === $total;
        $half     = (int) ceil($total / 2);
        $isHalf   = $correctPositions >= $half;

        $status = $isFull ? 'correct' : ($isHalf ? 'partial' : 'wrong');
        $score  = $isFull ? 1.0 : ($isHalf ? 0.5 : 0.0);

        return ['status' => $status, 'score' => $score, 'correct' => $expected];
    }

    private function checkGapFill(array $question, mixed $answer): array
    {
        // Эталон: [gap_number => option_id]
        $expected = [];
        foreach ($question['options'] as $o) {
            if ($o['order_position'] !== null) {
                $expected[(int) $o['order_position']] = $o['id'];
            }
        }

        $gaps = $this->parseGapNumbers($question['text']);
        if (! is_array($answer) || count($answer) !== count($gaps)) {
            return ['status' => 'wrong', 'score' => 0.0, 'correct' => $expected];
        }

        $correctGaps = 0;
        foreach ($gaps as $gap) {
            $given = (int) ($answer[$gap] ?? 0);
            if (($expected[$gap] ?? null) === $given) {
                $correctGaps++;
            }
        }

        $status = $correctGaps === count($gaps)
            ? 'correct'
            : ($correctGaps > 0 ? 'partial' : 'wrong');
        $score = $status === 'correct' ? 1.0 : ($status === 'partial' ? 0.5 : 0.0);

        return ['status' => $status, 'score' => $score, 'correct' => $expected];
    }

    /**
     * @return int[]
     */
    private function parseGapNumbers(string $text): array
    {
        if (preg_match_all('/\{\{(\d+)\}\}/', $text, $m)) {
            $nums = array_map('intval', $m[1]);
            sort($nums);
            return array_values(array_unique($nums));
        }

        return [];
    }
}
