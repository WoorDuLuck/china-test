import AdminLayout from '@/layouts/admin-layout';
import { Link, router } from '@inertiajs/react';

type Section = { id: number; title: string; questions_count: number };
type Paginated<T> = { data: T[]; links: { url: string | null; label: string; active: boolean }[] };

export default function Index({ sections }: { sections: Paginated<Section> }) {
    const destroy = (id: number) => {
        if (confirm('Удалить раздел?')) {
            router.delete(route('admin.sections.destroy', id));
        }
    };

    return (
        <AdminLayout title="Разделы">
            <div className="flex items-center mb-4">
                <h1 className="text-xl font-bold">Разделы</h1>
                <Link
                    href={route('admin.sections.create')}
                    className="ml-auto px-3 py-2 rounded bg-blue-600 text-white"
                >
                    Добавить
                </Link>
            </div>

            <table className="w-full bg-white rounded shadow text-sm">
                <thead className="bg-gray-100 text-left">
                <tr>
                    <th className="p-2">ID</th>
                    <th className="p-2">Название</th>
                    <th className="p-2">Вопросов</th>
                    <th className="p-2"></th>
                </tr>
                </thead>
                <tbody>
                {sections.data.map((s) => (
                    <tr key={s.id} className="border-t">
                        <td className="p-2">{s.id}</td>
                        <td className="p-2">{s.title}</td>
                        <td className="p-2">{s.questions_count}</td>
                        <td className="p-2 text-right whitespace-nowrap">
                            <Link href={route('admin.sections.edit', s.id)} className="text-blue-600">
                                Изменить
                            </Link>
                            <button onClick={() => destroy(s.id)} className="text-red-600 ml-2">
                                Удалить
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div className="mt-4 flex gap-2">
                {sections.links.map((l, i) => (
                    l.url ? (
                        <Link key={i} href={l.url}
                              className={`px-3 py-1 rounded ${l.active ? 'bg-blue-600 text-white' : 'bg-white'}`}
                              dangerouslySetInnerHTML={{ __html: l.label }} />
                    ) : (
                        <span key={i} className="px-3 py-1 text-gray-400"
                              dangerouslySetInnerHTML={{ __html: l.label }} />
                    )
                ))}
            </div>
        </AdminLayout>
    );
}