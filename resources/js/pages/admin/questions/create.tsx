import AdminLayout from '@/layouts/admin-layout';
import QuestionForm from './question-form';

export default function Create({ sections, types }: { sections: { id: number; title: string }[]; types: { id: number; name: string; key: 'single' | 'multiple' | 'ordering' | 'gap_fill' }[] }) {
    return (
        <AdminLayout title="Новый вопрос">
            <h1 className="text-xl font-bold mb-4">Новый вопрос</h1>
            <QuestionForm action={route('admin.questions.store')} method="post" sections={sections} types={types} />
        </AdminLayout>
    );
}