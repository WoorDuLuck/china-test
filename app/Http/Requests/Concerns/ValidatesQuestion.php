<?php

namespace App\Http\Requests\Concerns;

use App\Enums\QuestionTypeKey;
use App\Models\Question;
use App\Models\QuestionType;
use Illuminate\Validation\Validator;

trait ValidatesQuestion
{
    /**
     * Базовые правила для полей вопроса (не зависят от типа).
     */
    protected function baseRules(): array
    {
        return [
            'section_id' => ['required', 'integer', 'exists:sections,id'],
            'type_id'    => ['required', 'integer', 'exists:question_types,id'],
            'text'       => ['required', 'string', 'max:10000'],
            'image'      => ['nullable', 'image', 'max:4096'],

            'options'            => ['required', 'array', 'min:2'],
            'options.*.id'       => ['nullable', 'integer'],
            'options.*.text'     => ['nullable', 'string', 'max:1000'],
            'options.*.image'    => ['nullable', 'image', 'max:4096'],
            'options.*.order_position' => ['nullable', 'integer', 'min:1'],
            'options.*.is_correct'     => ['nullable', 'boolean'],
            'options.*.remove'         => ['nullable', 'boolean'],
        ];
    }

    /**
     * Определяем ключ типа вопроса по type_id.
     */
    protected function resolveTypeKey(): ?QuestionTypeKey
    {
        $typeId = $this->input('type_id');
        if (! $typeId) {
            return null;
        }

        /** @var QuestionType|null $type */
        $type = QuestionType::find($typeId);

        return $type?->key;
    }

    /**
     * Дополнительные правила по типу.
     */
    protected function rulesByType(?QuestionTypeKey $key): array
    {
        return match ($key) {
            QuestionTypeKey::Single   => $this->singleRules(),
            QuestionTypeKey::Multiple => $this->multipleRules(),
            QuestionTypeKey::Ordering => $this->orderingRules(),
            QuestionTypeKey::GapFill  => $this->gapFillRules(),
            default                   => [],
        };
    }

    /**
     * Убираем строки, помеченные на удаление (для update), чтобы валидация не падала.
     */
    protected function filterRemovedOptions(): void
    {
        $options = $this->input('options', []);
        $options = array_values(array_filter(
            $options,
            fn ($o) => empty($o['remove']),
        ));
        $this->merge(['options' => $options]);
    }

    /*
    |--------------------------------------------------------------------------
    | Правила по типам
    |--------------------------------------------------------------------------
    */

    private function singleRules(): array
    {
        // Ровно одна опция с is_correct = 1
        return [];
    }

    private function multipleRules(): array
    {
        // Минимум одна опция с is_correct = 1
        return [];
    }

    private function orderingRules(): array
    {
        return [
            'options.*.order_position' => ['required', 'integer', 'min:1'],
        ];
    }

    private function gapFillRules(): array
    {
        return [
            'options.*.order_position' => ['required', 'integer', 'min:1', 'max:3'],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Пост-валидация (after): правила, которые не выразить стандартными rules
    |--------------------------------------------------------------------------
    */

    protected function afterValidate(Validator $validator): void
    {
        $key = $this->resolveTypeKey();
        if (! $key) {
            return;
        }

        // Каждая опция должна иметь либо текст, либо картинку
        $this->validateOptionsNotEmpty($validator);

        match ($key) {
            QuestionTypeKey::Single   => $this->validateSingle($validator),
            QuestionTypeKey::Multiple => $this->validateMultiple($validator),
            QuestionTypeKey::Ordering => $this->validateOrdering($validator),
            QuestionTypeKey::GapFill  => $this->validateGapFill($validator),
        };
    }

    private function validateOptionsNotEmpty(Validator $validator): void
    {
        foreach ((array) $this->input('options', []) as $i => $opt) {
            $hasText  = ! empty(trim((string) ($opt['text'] ?? '')));
            $hasImage = $this->hasFile("options.$i.image")
                || ! empty($opt['image_existing'] ?? null);

            if (! $hasText && ! $hasImage) {
                $validator->errors()->add(
                    "options.$i.text",
                    'Заполните текст ответа или приложите изображение.',
                );
            }
        }
    }

    private function validateSingle(Validator $validator): void
    {
        $correct = $this->correctCount();

        if ($correct !== 1) {
            $validator->errors()->add(
                'options',
                'Для типа «Один ответ» ровно одна опция должна быть отмечена как правильная.',
            );
        }
    }

    private function validateMultiple(Validator $validator): void
    {
        $correct = $this->correctCount();

        if ($correct < 1) {
            $validator->errors()->add(
                'options',
                'Для типа «Несколько ответов» отметьте хотя бы одну правильную опцию.',
            );
        }

        if ($correct === count($this->input('options', []))) {
            $validator->errors()->add(
                'options',
                'Все опции не могут быть правильными — иначе вопрос бессмысленен.',
            );
        }
    }

    private function validateOrdering(Validator $validator): void
    {
        $positions = array_map(
            fn ($o) => (int) ($o['order_position'] ?? 0),
            $this->input('options', []),
        );
        sort($positions);

        $expected = range(1, count($positions));
        if ($positions !== $expected) {
            $validator->errors()->add(
                'options',
                'Позиции должны быть уникальны и образовывать непрерывный ряд 1..N.',
            );
        }
    }

    private function validateGapFill(Validator $validator): void
    {
        $text = (string) $this->input('text', '');
        $gaps = $this->extractGapNumbers($text);

        if ($gaps === [] || count($gaps) > 3) {
            $validator->errors()->add(
                'text',
                'В тексте должно быть от 1 до 3 маркеров пропуска вида {{1}}, {{2}}, {{3}}.',
            );
            return;
        }

        // Проверяем, что номера идут 1..N без пропусков
        sort($gaps);
        $expected = range(1, count($gaps));
        if ($gaps !== $expected) {
            $validator->errors()->add(
                'text',
                'Маркеры пропусков должны идти по порядку: {{1}}, {{2}}, ... без пропусков.',
            );
        }

        $options = (array) $this->input('options', []);

        // Каждый пропуск должен иметь ровно один вариант с данным order_position
        foreach ($expected as $gap) {
            $count = 0;
            foreach ($options as $o) {
                if ((int) ($o['order_position'] ?? 0) === $gap) {
                    $count++;
                }
            }
            if ($count !== 1) {
                $validator->errors()->add(
                    'options',
                    "Для пропуска {{$gap}} должен быть ровно один правильный вариант.",
                );
            }
        }

        // Слова не должны повторяться (по тексту, без учёта регистра)
        $seen = [];
        foreach ($options as $i => $o) {
            $t = mb_strtolower(trim((string) ($o['text'] ?? '')));
            if ($t === '') {
                continue;
            }
            if (isset($seen[$t])) {
                $validator->errors()->add(
                    "options.$i.text",
                    'Слова в наборе не должны повторяться.',
                );
            }
            $seen[$t] = true;
        }

        // order_position должен быть в пределах существующих пропусков
        foreach ($options as $i => $o) {
            $pos = (int) ($o['order_position'] ?? 0);
            if (! in_array($pos, $expected, true)) {
                $validator->errors()->add(
                    "options.$i.order_position",
                    "Номер пропуска должен быть одним из: " . implode(', ', $expected),
                );
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    private function correctCount(): int
    {
        $n = 0;
        foreach ((array) $this->input('options', []) as $o) {
            if (! empty($o['is_correct'])) {
                $n++;
            }
        }

        return $n;
    }

    /**
     * @return int[]
     */
    private function extractGapNumbers(string $text): array
    {
        if (! preg_match_all('/\{\{(\d+)\}\}/', $text, $m)) {
            return [];
        }

        return array_values(array_unique(array_map('intval', $m[1])));
    }

    /**
     * Проверка «сохранённая картинка существует у опции» — нужна, чтобы не потерять
     * изображение при редактировании без повторной загрузки.
     */
    protected function existingOptionImage(int $index): ?string
    {
        $id = $this->input("options.$index.id");
        if (! $id) {
            return null;
        }

        /** @var Question|null $question */
        $question = $this->route('question');
        if (! $question) {
            return null;
        }

        return $question->options->firstWhere('id', (int) $id)?->image;
    }
}