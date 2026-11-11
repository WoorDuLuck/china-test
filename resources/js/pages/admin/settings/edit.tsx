import AdminLayout from '@/layouts/admin-layout';
import { useForm } from '@inertiajs/react';

type Row = { section_id: number; count: number };

type Props = {
    settings: { id: number; distribution: Row[] };
    sections: { id: number; title: string; questions_count: number }[];
};

export default function Edit({ settings, sections }: Props) {
    const initial = settings.distribution.length
        ? settings.distribution
        : [{ section_id: sections[0]?.id ?? 0, count: 1 }];

    const { data, setData, put, processing, errors } = useForm<{ distribution: Row[] }>({
        distribution: initial,
    });

    const add = () => setData('distribution', [...data.distribution, { section_id: sections[0]?.id ?? 0, count: 1 }]);
    const remove = (i: number) => setData('distribution', data.distribution.filter((_, k) => k !== i));
    const patch = (i: number, p: Partial<Row>) =>
        setData('distribution', data.distribution.map((r, k) => (k === i ? { ...r, ...p } : r)));

    return (
        <AdminLayout title="Настройки теста">
            <h1 className="text-xl font-bold mb-4">Настройки теста</h1>

            <form
                onSubmit={(e) => { e.preventDefault(); put(route('admin.settings.update')); }}
                className="bg-white p-4 rounded shadow space-y-3"
            >
                <p className="text-sm text-gray-600">
                    Укажите, сколько вопросов брать из каждого раздела. Разделы, которые не нужны, не добавляйте.
                </p>

                {data.distribution.map((row, i) => {
                    const available = sections.find((s) => s.id === row.section_id)?.questions_count ?? 0;
                    return (
                        <div key={i} className="flex gap-2 items-center">
                            <select
                                value={row.section_id}
                                onChange={(e) => patch(i, { section_id: Number(e.target.value) })}
                                className="flex-1 border rounded px-2 py-1"
                            >
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>{s.title} (доступно: {s.questions_count})</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min={1}
                                max={available || 1}
                                value={row.count}
                                onChange={(e) => patch(i, { count: Number(e.target.value) })}
                                className="w-24 border rounded px-2 py-1"
                            />
                            <button type="button" onClick={() => remove(i)} className="text-red-600">×</button>
                            {errors[`distribution.${i}.count`] && (
                                <p className="text-red-600 text-sm">{errors[`distribution.${i}.count`]}</p>
                            )}
                        </div>
                    );
                })}

                <button type="button" onClick={add} className="text-sm px-2 py-1 rounded bg-gray-200">
                    + Добавить раздел
                </button>

                <div>
                    <button disabled={processing}
                            className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                        Сохранить
                    </button>
                </div>
            </form>
        </AdminLayout>
    );
}