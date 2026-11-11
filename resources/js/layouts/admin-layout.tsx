import { Head, Link, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

type SharedProps = {
    auth: { user: { name: string } | null };
    flash?: { status?: string; error?: string };
};

export default function AdminLayout({ title, children }: PropsWithChildren<{ title: string }>) {
    const { props } = usePage<SharedProps>();
    const errors = usePage().props.errors as Record<string, string>;

    return (
        <>
            <Head title={title} />
            <div className="min-h-screen bg-gray-50">
                <nav className="bg-white border-b">
                    <div className="mx-auto max-w-6xl px-4 py-3 flex gap-4 items-center">
                        <Link href={route('admin.sections.index')} className="font-semibold">
                            Разделы
                        </Link>
                        <Link href={route('admin.questions.index')}>Вопросы</Link>
                        <Link href={route('admin.settings.edit')}>Настройки теста</Link>
                        <Link href={route('logout')} method="post" as="button" className="ml-auto text-sm text-gray-600">
                            Выйти
                        </Link>
                    </div>
                </nav>

                <main className="mx-auto max-w-6xl px-4 py-6">
                    {props.flash?.status && (
                        <div className="mb-4 p-3 rounded bg-green-100 text-green-800">
                            {props.flash.status}
                        </div>
                    )}
                    {Object.keys(errors).length > 0 && (
                        <div className="mb-4 p-3 rounded bg-red-100 text-red-800">
                            <ul className="list-disc list-inside">
                                {Object.values(errors).map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {children}
                </main>
            </div>
        </>
    );
}