import { useForm } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';

type Option = {
    uid: string;
    id: number | null;
    text: string;
    image_existing: string | null;
    order_position: number | null;
    is_correct: boolean;
    remove: boolean;
    file?: File | null;
};

type Props = {
    action: string;
    method: 'post' | 'put';
    sections: { id: number; title: string }[];
    types: { id: number; name: string; key: 'single' | 'multiple' | 'ordering' | 'gap_fill' }[];
    question?: {
        id: number;
        section_id: number;
        type_id: number;
        text: string;
        image: string | null;
        options: {
            id: number;
            text: string | null;
            image: string | null;
            order_position: number | null;
            is_correct: boolean;
        }[];
    };
};

let uidCounter = 0;
const uid = () => `o-${++uidCounter}`;

export default function QuestionForm({ action, method, sections, types, question }: Props) {
    const initialTypeId = question?.type_id ?? types[0]?.id;
    const initialTypeKey = types.find((t) => t.id === initialTypeId)?.key ?? 'single';

    const initialOptions: Option[] = (question?.options?.length ? question.options : [
        { id: null, text: '', image: null, order_position: null, is_correct: false },
        { id: null, text: '', image: null, order_position: null, is_correct: false },
    ]).map((o) => ({
        uid: uid(),
        id: o.id,
        text: o.text ?? '',
        image_existing: o.image ?? null,
        order_position: o.order_position,
        is_correct: o.is_correct,
        remove: false,
        file: null,
    }));

    const form = useForm<{
        section_id: number;
        type_id: number;
        text: string;
        image: File | null;
        options: Option[];
    }>({
        section_id: question?.section_id ?? sections[0]?.id,
        type_id: initialTypeId,
        text: question?.text ?? '',
        image: null,
        options: initialOptions,
    });

    const typeKey = useMemo(
        () => types.find((t) => t.id === form.data.type_id)?.key ?? 'single',
        [form.data.type_id, types],
    );

    const isSingle = typeKey === 'single';
    const isMultiple = typeKey === 'multiple';
    const isOrdering = typeKey === 'ordering';
    const isGapFill = typeKey === 'gap_fill';

    const setOption = (index: number, patch: Partial<Option>) => {
        const next = [...form.data.options];
        next[index] = { ...next[index], ...patch };
        form.setData('options', next);
    };

    const onTypeChange = (id: number) => {
        const key = types.find((t) => t.id === id)?.key;
        const next = form.data.options.map((o) => ({
            ...o,
            is_correct: key === 'single' || key === 'multiple' ? o.is_correct : false,
            order_position: key === 'ordering' || key === 'gap_fill' ? o.order_position : null,
        }));
        form.setData((prev) => ({ ...prev, type_id: id, options: next }));
    };

    const setCorrect = (index: number, checked: boolean) => {
        if (isSingle) {
            const next = form.data.options.map((o, i) => ({ ...o, is_correct: i === index ? checked : false }));
            form.setData('options', next);
        } else {
            setOption(index, { is_correct: checked });
        }
    };

    const addOption = () => {
        form.setData('options', [
            ...form.data.options,
            { uid: uid(), id: null, text: '', image_existing: null, order_position: null, is_correct: false, remove: false, file: null },
        ]);
    };

    const removeOption = (index: number) => {
        const o = form.data.options[index];
        if (o.id) {
            setOption(index, { remove: true });
        } else {
            form.setData('options', form.data.options.filter((_, i) => i !== index));
        }
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        // Отправляем multipart, чтобы ушли файлы опций
        method === 'post' ? form.post(action, { forceFormData: true }) : form.put(action, { forceFormData: true });
    };

    return (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm mb-1">Раздел</label>
                    <select
                        value={form.data.section_id}
                        onChange={(e) => form.setData('section_id', Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                    >
                        {sections.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                    {form.errors.section_id && <p className="text-red-600 text-sm">{form.errors.section_id}</p>}
                </div>

                <div>
                    <label className="block text-sm mb-1">Тип вопроса</label>
                    <select
                        value={form.data.type_id}
                        onChange={(e) => onTypeChange(Number(e.target.value))}
                        className="w-full border rounded px-3 py-2"
                    >
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm mb-1">Текст вопроса</label>
                <textarea
                    value={form.data.text}
                    onChange={(e) => form.setData('text', e.target.value)}
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                />
                {isGapFill && (
                    <p className="text-xs text-gray-500 mt-1">
                        Используйте маркеры <code>{'{{1}}'}</code>, <code>{'{{2}}'}</code>,{' '}
                        <code>{'{{3}}'}</code> — от 1 до 3 пропусков.
                    </p>
                )}
                {form.errors.text && <p className="text-red-600 text-sm">{form.errors.text}</p>}
            </div>

            <div>
                <label className="block text-sm mb-1">Изображение вопроса (необязательно)</label>
                <input type="file" accept="image/*"
                       onChange={(e) => form.setData('image', e.target.files?.[0] ?? null)} />
                {question?.image && <p className="text-xs text-gray-500">Текущее: {question.image}</p>}
            </div>

            <div>
                <div className="flex items-center mb-2">
                    <span className="text-sm font-semibold">Варианты ответа</span>
                    <button type="button" onClick={addOption}
                            className="ml-auto text-sm px-2 py-1 rounded bg-gray-200">+ Добавить</button>
                </div>

                {form.data.options.map((opt, index) => (
                    <div key={opt.uid}
                         className={`border rounded p-3 mb-2 space-y-2 ${opt.remove ? 'opacity-50' : ''}`}>
                        <div className="flex gap-2 items-start flex-wrap">
                            {(isSingle || isMultiple) && (
                                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                                    <input
                                        type={isSingle ? 'radio' : 'checkbox'}
                                        checked={opt.is_correct}
                                        onChange={(e) => setCorrect(index, e.target.checked)}
                                    />
                                    Правильный
                                </label>
                            )}

                            {(isOrdering || isGapFill) && (
                                <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                                    <span>{isOrdering ? 'Позиция:' : 'Пропуск №'}</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={isGapFill ? 3 : 99}
                                        value={opt.order_position ?? ''}
                                        onChange={(e) => setOption(index, {
                                            order_position: e.target.value === '' ? null : Number(e.target.value),
                                        })}
                                        className="w-16 border rounded px-2 py-1"
                                    />
                                </label>
                            )}

                            <input
                                type="text"
                                value={opt.text}
                                onChange={(e) => setOption(index, { text: e.target.value })}
                                placeholder="Текст ответа"
                                className="flex-1 border rounded px-2 py-1"
                            />

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setOption(index, { file: e.target.files?.[0] ?? null })}
                                className="text-xs"
                            />

                            <button type="button" onClick={() => removeOption(index)}
                                    className="text-red-600 text-sm">×</button>
                        </div>

                        {opt.image_existing && (
                            <p className="text-xs text-gray-500">Текущее изображение: {opt.image_existing}</p>
                        )}
                    </div>
                ))}
            </div>

            <button disabled={form.processing}
                    className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                Сохранить
            </button>
        </form>
    );
}