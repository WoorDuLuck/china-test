import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Props = {
    action: string;
    method: 'post' | 'put';
    section?: { id: number; title: string; description: string | null };
};

export default function SectionForm({ action, method, section }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        title: section?.title ?? '',
        description: section?.description ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        method === 'post' ? post(action) : put(action);
    };

    return (
        <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
            <div>
                <label className="block text-sm mb-1">Название</label>
                <input
                    value={data.title}
                    onChange={(e) => setData('title', e.target.value)}
                    maxLength={256}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.title && <p className="text-red-600 text-sm">{errors.title}</p>}
            </div>

            <div>
                <label className="block text-sm mb-1">Описание</label>
                <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                />
                {errors.description && <p className="text-red-600 text-sm">{errors.description}</p>}
            </div>

            <button disabled={processing}
                    className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50">
                Сохранить
            </button>
        </form>
    );
}