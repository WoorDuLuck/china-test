import AdminLayout from '@/layouts/admin-layout';
import { Link, router } from '@inertiajs/react';

type Row = {
    id: number;
    text: string;
    section: { id: number; title: string } | null;
    type: { id: number; name: string; key: string } | null;
};

type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[] };

type Props = {
    questions: Paginated<Row>;
    sections: { id: number; title: string }[];
    types: { id: number; name: string; key: string }[];
    filters: { section_id?: number; type_id?: number };
};

export default function Index({ questions, sections, types, filters }: Props) {
    const filter = (patch: Record<string, string | undefined>) => {
        router.get(route('admin.questions.index'), { ...filters, ...patch }, { preserveState: true });
    };

    const destroy = (id: number) => {
        if (confirm('Удалить вопрос?')) router.delete(route('admin.questions.destroy', id));
    };

    return (
        <AdminLayout title="Вопросы">
            <div className="flex items-center mb-4">
                <h1 className="text-xl font-bold">Вопросы</h1>
                <Link href={route('admin.questions.create')}
                      className="ml-auto px-3 py-2 rounded bg-blue-600 text-white">
                    Добавить
                </Link>
            </div>

            <div className="mb-4 flex gap-2">
                <select
                    value={filters.section_id ?? ''}
                    onChange={(e) => filter({ section_id: e.target.value || undefined })}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Все разделы</option>
                    {sections.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                </select>
                <select
                    value={filters.type_id ?? ''}
                    onChange={(e) => filter({ type_id: e.target.value || undefined })}
                    className="border rounded px-2 py-1"
                >
                    <option value="">Все типы</option>
                    {types.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>
            </div>

            <table className="w-full bg-white rounded shadow text-sm">
                <thead className="bg-gray-100 text-left">
                <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Раздел</th>
                    <th className="p-2">Тип</th>
                    <th className="p-2">Текст</th>
                    <th className="p-2"></th>
                </tr>
                </thead>
                <tbody>
                {questions.data.map((q) => (
                    <tr key={q.id} className="border-t">
                        <td className="p-2">{q.id}</td>
                        <td className="p-2">{q.section?.title}</td>
                        <td className="p-2">{q.type?.name}</td>
                        <td className="p-2">{q.text.slice(0, 80)}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                            <Link href={route('admin.questions.edit', q.id)} className="text-blue-600">
                                Изменить
                            </Link>
                            <button onClick={() => destroy(q.id)} className="text-red-600 ml-2">
                                Удалить
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="mt-4 flex gap-2">
                {questions.links.map((l, i) =>
                    l.url ? (
                        <Link key={i} href={l.url}
                              className={`px-3 py-1 rounded ${l.active ? 'bg-blue-600 text-white' : 'bg-white'}`}
                              dangerouslySetInnerHTML={{ __html: l.label }} />
                    ) : (
                        <span key={i} className="px-3 py-1 text-gray-400"
                              dangerouslySetInnerHTML={{ __html: l.label }} />
                    )
                )}
            </div>
        </AdminLayout>
    );
}