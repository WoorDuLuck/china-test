import { Head, Link } from '@inertiajs/react';

type Status = 'correct' | 'partial' | 'wrong';

type ReviewItem = {
    id: number;
    type: 'single' | 'multiple' | 'ordering' | 'gap_fill';
    text: string;
    image: string | null;
    options: { id: number; text: string | null; image: string | null }[];
    user_answer: number | number[] | Record<number, number> | null;
    correct: number | number[] | Record<number, number>;
    option_texts: Record<number, string | null>;
    status: Status;
    score: number;
};

type Result = { score: number; total: number; finished_at: string };

type Props = {
    result: Result;
    review: ReviewItem[];
};

const statusMeta: Record<Status, { label: string; className: string }> = {
    correct: { label: 'Верно', className: 'bg-green-100 text-green-800' },
    partial: { label: 'Частично верно', className: 'bg-yellow-100 text-yellow-800' },
    wrong:   { label: 'Неверно', className: 'bg-red-100 text-red-800' },
};

export default function Result({ result, review }: Props) {
    return (
        <>
            <Head title="Результат тестирования" />
            <div className="min-h-screen bg-gray-50 text-[#1b1b18]">
                <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
                    <section className="bg-white rounded shadow p-6 text-center">
                        <h1 className="text-xl font-bold mb-2">Тест завершён</h1>
                        <p className="text-4xl font-bold text-blue-600">
                            {result.score} <span className="text-base text-gray-500">из {result.total}</span>
                        </p>
                        <p className="mt-2 text-sm text-gray-600">
                            Завершено: {new Date(result.finished_at).toLocaleString('ru-RU')}
                        </p>

                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link
                                href={route('test.start')}
                                method="post"
                                as="button"
                                className="px-4 py-2 rounded bg-blue-600 text-white"
                            >
                                Пройти заново
                            </Link>
                            <Link
                                href={route('home')}
                                className="px-4 py-2 rounded border border-gray-300"
                            >
                                На главную
                            </Link>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-lg font-semibold">Обзор ответов</h2>

                        {review.map((item, idx) => {
                            const meta = statusMeta[item.status];
                            return (
                                <div key={item.id} className="bg-white rounded shadow p-4 md:p-6">
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <div className="text-xs uppercase tracking-wide text-gray-500">
                                            Вопрос {idx + 1}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${meta.className}`}>
                                            {meta.label} · {item.score} б.
                                        </span>
                                    </div>

                                    <div className="mb-3 whitespace-pre-line">
                                        {item.type === 'gap_fill'
                                            ? item.text.replace(/\{\{(\d+)\}\}/g, '_____')
                                            : item.text}
                                    </div>

                                    {item.image && (
                                        <img src={`/storage/${item.image}`} alt="" className="mb-3 max-h-64 rounded" />
                                    )}

                                    <AnswerReview item={item} />
                                </div>
                            );
                        })}
                    </section>
                </main>
            </div>
        </>
    );
}

function AnswerReview({ item }: { item: ReviewItem }) {
    const label = (id: number) => item.option_texts[id] ?? `option #${id}`;

    if (item.type === 'single') {
        const user = item.user_answer as number | null;
        const correct = item.correct as number;
        return (
            <ul className="space-y-1 text-sm">
                {item.options.map((o) => {
                    const isUser = user === o.id;
                    const isCorrect = correct === o.id;
                    return (
                        <li key={o.id} className={itemClass(isUser, isCorrect)}>
                            <span className="mr-1">{isUser ? '●' : '○'}</span>
                            {label(o.id)}
                            {isCorrect && <span className="ml-2 text-green-700 text-xs">(верный)</span>}
                            {isUser && !isCorrect && <span className="ml-2 text-red-700 text-xs">(ваш выбор)</span>}
                        </li>
                    );
                })}
            </ul>
        );
    }

    if (item.type === 'multiple') {
        const user = new Set((item.user_answer as number[]) ?? []);
        const correct = new Set(item.correct as number[]);
        return (
            <ul className="space-y-1 text-sm">
                {item.options.map((o) => {
                    const isUser = user.has(o.id);
                    const isCorrect = correct.has(o.id);
                    return (
                        <li key={o.id} className={itemClass(isUser, isCorrect)}>
                            <span className="mr-1">{isUser ? '☑' : '☐'}</span>
                            {label(o.id)}
                            {isCorrect && <span className="ml-2 text-green-700 text-xs">(верный)</span>}
                            {isUser && !isCorrect && <span className="ml-2 text-red-700 text-xs">(лишний)</span>}
                        </li>
                    );
                })}
            </ul>
        );
    }

    if (item.type === 'ordering') {
        const user = (item.user_answer as number[]) ?? [];
        const expected = item.correct as Record<number, number>; // option_id → позиция
        return (
            <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">Ваш порядок</div>
                    <ol className="list-decimal list-inside space-y-1">
                        {user.map((id) => (
                            <li key={id}>{label(id)}</li>
                        ))}
                    </ol>
                </div>
                <div>
                    <div className="text-xs uppercase text-gray-500 mb-1">Правильный порядок</div>
                    <ol className="list-decimal list-inside space-y-1">
                        {Object.entries(expected)
                            .sort((a, b) => a[1] - b[1])
                            .map(([id]) => (
                                <li key={id}>{label(Number(id))}</li>
                            ))}
                    </ol>
                </div>
            </div>
        );
    }

    // gap_fill
    const user = (item.user_answer as Record<number, number>) ?? {};
    const expected = item.correct as Record<number, number>; // gap → option_id
    const gapNumbers = Object.keys(expected).map(Number).sort((a, b) => a - b);

    return (
        <div className="text-sm space-y-1">
            {gapNumbers.map((gap) => {
                const userId = user[gap];
                const correctId = expected[gap];
                const ok = userId === correctId;
                return (
                    <div key={gap} className={ok ? 'text-green-700' : 'text-red-700'}>
                        Пропуск {gap}: ваш — <b>{userId ? label(userId) : '—'}</b>,
                        верный — <b>{label(correctId)}</b>
                    </div>
                );
            })}
        </div>
    );
}

function itemClass(isUser: boolean, isCorrect: boolean): string {
    if (isCorrect) return 'text-green-800';
    if (isUser) return 'text-red-700';
    return '';
}