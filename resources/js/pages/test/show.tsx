import { Head, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type QuestionType = 'single' | 'multiple' | 'ordering' | 'gap_fill';

type Option = { id: number; text: string | null; image: string | null };
type Question = {
    id: number;
    type: QuestionType;
    text: string;
    image: string | null;
    options: Option[];
};

type Props = {
    questions: Question[];
    gaps: Record<number, Record<number, number[]>>;
    unanswered: number[];
    errors?: Record<string, string>;
};

// answers по question_id — значение зависит от типа:
//   single: number
//   multiple: number[]
//   ordering: number[]      (последовательность option_id)
//   gap_fill: Record<gapNumber, number>
type Answers = Record<number, number | number[] | Record<number, number>>;

export default function Show({ questions, gaps, unanswered, errors }: Props) {
    const [answers, setAnswers] = useState<Answers>({});
    const [submitting, setSubmitting] = useState(false);

    const missing = useMemo(
        () => questions.filter((q) => !isAnswered(q, answers[q.id])).map((q) => q.id),
        [questions, answers],
    );

    const setAnswer = (questionId: number, value: Answers[number]) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (missing.length > 0) {
            // подсветим неотвеченные и скроллим к первому
            document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setSubmitting(true);
        router.post(route('test.submit'), { answers }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Тестирование — Культура и живопись Китая" />
            <div className="min-h-screen bg-gray-50 text-[#1b1b18]">
                <header className="bg-white border-b sticky top-0 z-10">
                    <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
                        <span className="font-medium">Тестирование</span>
                        <span className="text-sm text-gray-600">
                            Отвечено: {questions.length - missing.length} / {questions.length}
                        </span>
                    </div>
                    <div className="h-1 bg-gray-200">
                        <div
                            className="h-1 bg-blue-600 transition-all"
                            style={{ width: `${((questions.length - missing.length) / questions.length) * 100}%` }}
                        />
                    </div>
                </header>

                <form onSubmit={submit} className="mx-auto max-w-3xl px-4 py-6 space-y-4">
                    {errors?.answers && (
                        <div className="p-3 rounded bg-red-100 text-red-800">{errors.answers}</div>
                    )}

                    {questions.map((q, idx) => {
                        const isMissing = missing.includes(q.id);
                        return (
                            <div
                                key={q.id}
                                id={`q-${q.id}`}
                                className={`bg-white rounded shadow p-4 md:p-6 ${isMissing && submitting ? 'ring-2 ring-red-300' : ''}`}
                            >
                                <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                                    Вопрос {idx + 1} из {questions.length}
                                </div>
                                <div className="mb-3 whitespace-pre-line">
                                    {renderQuestionText(q.text, q.type)}
                                </div>

                                {q.image && (
                                    <img
                                        src={`/storage/${q.image}`}
                                        alt=""
                                        className="mb-3 max-h-64 rounded"
                                        loading="lazy"
                                    />
                                )}

                                {q.type === 'single' && (
                                    <SingleInput
                                        options={q.options}
                                        value={answers[q.id] as number | undefined}
                                        onChange={(v) => setAnswer(q.id, v)}
                                    />
                                )}

                                {q.type === 'multiple' && (
                                    <MultipleInput
                                        options={q.options}
                                        value={(answers[q.id] as number[]) ?? []}
                                        onChange={(v) => setAnswer(q.id, v)}
                                    />
                                )}

                                {q.type === 'ordering' && (
                                    <OrderingInput
                                        options={q.options}
                                        value={(answers[q.id] as number[]) ?? []}
                                        onChange={(v) => setAnswer(q.id, v)}
                                    />
                                )}

                                {q.type === 'gap_fill' && (
                                    <GapFillInput
                                        question={q}
                                        gaps={gaps[q.id] ?? {}}
                                        options={q.options}
                                        value={(answers[q.id] as Record<number, number>) ?? {}}
                                        onChange={(v) => setAnswer(q.id, v)}
                                    />
                                )}

                                {isMissing && (
                                    <p className="mt-2 text-sm text-red-600">Ответьте на этот вопрос.</p>
                                )}
                            </div>
                        );
                    })}

                    <div className="bg-white rounded shadow p-4 flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                        >
                            {submitting ? 'Отправляем…' : 'Отправить ответы'}
                        </button>
                        <span className="text-sm text-gray-600">
                            {missing.length > 0
                                ? `Осталось ответить: ${missing.length}`
                                : 'Все вопросы отвечены'}
                        </span>
                    </div>
                </form>
            </div>
        </>
    );
}

/* ---------- Помощники ---------- */

function isAnswered(q: Question, value: Answers[number] | undefined): boolean {
    switch (q.type) {
        case 'single':
            return typeof value === 'number';
        case 'multiple':
            return Array.isArray(value) && value.length > 0;
        case 'ordering':
            return Array.isArray(value) && value.length === q.options.length;
        case 'gap_fill': {
            if (!value || typeof value !== 'object') return false;
            const gaps = extractGapNumbers(q.text);
            return gaps.length > 0 && gaps.every((g) => typeof (value as Record<number, number>)[g] === 'number');
        }
        default:
            return false;
    }
}

function extractGapNumbers(text: string): number[] {
    const matches = [...text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
    return [...new Set(matches)].sort((a, b) => a - b);
}

/**
 * Заменяем {{n}} в тексте на визуальные «пропуски».
 * На странице Show значение выставляется через GapFillInput, поэтому здесь —
 * только текстовые маркеры «_____», чтобы не путать пользователя.
 */
function renderQuestionText(text: string, type: QuestionType) {
    if (type !== 'gap_fill') return text;
    return text.replace(/\{\{(\d+)\}\}/g, '_____');
}

/* ---------- Инпуты по типу ---------- */

function SingleInput({
    options,
    value,
    onChange,
}: {
    options: Option[];
    value: number | undefined;
    onChange: (v: number) => void;
}) {
    return (
        <div className="space-y-2">
            {options.map((o) => (
                <label key={o.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                        type="radio"
                        name="single"
                        checked={value === o.id}
                        onChange={() => onChange(o.id)}
                        className="mt-1"
                    />
                    <span>{o.text ?? '(без текста)'}</span>
                </label>
            ))}
        </div>
    );
}

function MultipleInput({
    options,
    value,
    onChange,
}: {
    options: Option[];
    value: number[];
    onChange: (v: number[]) => void;
}) {
    const toggle = (id: number) => {
        const set = new Set(value);
        set.has(id) ? set.delete(id) : set.add(id);
        onChange([...set]);
    };

    return (
        <div className="space-y-2">
            {options.map((o) => (
                <label key={o.id} className="flex items-start gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={value.includes(o.id)}
                        onChange={() => toggle(o.id)}
                        className="mt-1"
                    />
                    <span>{o.text ?? '(без текста)'}</span>
                </label>
            ))}
        </div>
    );
}

function OrderingInput({
    options,
    value,
    onChange,
}: {
    options: Option[];
    value: number[];
    onChange: (v: number[]) => void;
}) {
    // value — последовательность option_id в порядке, который указал пользователь.
    // Изначально пусто → пользователь заполняет по одному.
    const setAt = (index: number, optionId: number) => {
        const next = [...value];
        next[index] = optionId;
        onChange(next);
    };

    const clearAt = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    // Добавить следующий по порядку (для удобства — берём первый неиспользованный)
    const addNext = () => {
        const used = new Set(value);
        const next = options.find((o) => !used.has(o.id));
        if (next) onChange([...value, next.id]);
    };

    const used = new Set(value);

    return (
        <div className="space-y-2">
            <div className="text-sm text-gray-600">
                Расставьте варианты по порядку: 1 — первый, 2 — второй и т.д.
            </div>
            <ol className="space-y-2">
                {value.map((id, i) => {
                    const opt = options.find((o) => o.id === id);
                    return (
                        <li key={`${id}-${i}`} className="flex items-center gap-2 bg-gray-50 rounded p-2">
                            <span className="w-6 text-right font-medium">{i + 1}.</span>
                            <span className="flex-1">{opt?.text ?? '(без текста)'}</span>
                            <button
                                type="button"
                                onClick={() => clearAt(i)}
                                className="text-red-600 text-sm"
                            >
                                ×
                            </button>
                        </li>
                    );
                })}
            </ol>

            {value.length < options.length && (
                <div className="pt-2">
                    <button
                        type="button"
                        onClick={addNext}
                        className="text-sm px-3 py-1 rounded bg-gray-200"
                    >
                        + Добавить следующий вариант
                    </button>
                </div>
            )}

            {options.filter((o) => !used.has(o.id)).length > 0 && (
                <details className="pt-2">
                    <summary className="text-sm text-gray-600 cursor-pointer">
                        Показать ещё не выбранные ({options.filter((o) => !used.has(o.id)).length})
                    </summary>
                    <div className="mt-2 space-y-1">
                        {options
                            .filter((o) => !used.has(o.id))
                            .map((o) => (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => setAt(value.length, o.id)}
                                    className="block text-left text-sm px-2 py-1 rounded bg-gray-100 w-full"
                                >
                                    {o.text ?? '(без текста)'}
                                </button>
                            ))}
                    </div>
                </details>
            )}
        </div>
    );
}

function GapFillInput({
    question,
    gaps,
    options,
    value,
    onChange,
}: {
    question: Question;
    gaps: Record<number, number[]>;
    options: Option[];
    value: Record<number, number>;
    onChange: (v: Record<number, number>) => void;
}) {
    const gapNumbers = extractGapNumbers(question.text);
    const optionById = useMemo(
        () => Object.fromEntries(options.map((o) => [o.id, o])),
        [options],
    );

    const setGap = (gap: number, optionId: number | '') => {
        const next = { ...value };
        if (optionId === '') delete next[gap];
        else next[gap] = Number(optionId);
        onChange(next);
    };

    return (
        <div className="space-y-3">
            <div className="text-sm text-gray-600">
                Заполните пропуски. Одно и то же слово не используется дважды.
            </div>
            {gapNumbers.map((gap) => (
                <label key={gap} className="flex items-center gap-2">
                    <span className="w-20 text-sm">Пропуск {gap}:</span>
                    <select
                        value={value[gap] ?? ''}
                        onChange={(e) => setGap(gap, e.target.value === '' ? '' : Number(e.target.value))}
                        className="flex-1 border rounded px-2 py-1"
                    >
                        <option value="">— выберите слово —</option>
                        {(gaps[gap] ?? []).map((id) => (
                            <option key={id} value={id}>
                                {optionById[id]?.text ?? `option #${id}`}
                            </option>
                        ))}
                    </select>
                </label>
            ))}
        </div>
    );
}