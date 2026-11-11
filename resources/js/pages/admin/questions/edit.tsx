import AdminLayout from '@/layouts/admin-layout';
import QuestionForm from './question-form';

type Props = {
    question: {
        id: number; section_id: number; type_id: number; text: string; image: string | null;
        options: { id: number; text: string | null; image: string | null; order_position: number | null; is_correct: boolean }[];
    };
    sections: { id: number; title: string }[];
    types: { id: number; name: string; key: 'single' | 'multiple' | 'ordering' | 'gap_fill' }[];
};

export default function Edit({ question, sections, types }: Props) {
    return (
        <AdminLayout title="Редактирование вопроса">
            <h1 className="text-xl font-bold mb-4">Редактирование вопроса #{question.id}</h1>
            <QuestionForm
                action={route('admin.questions.update', question.id)}
                method="put"
                sections={sections}
                types={types}
                question={question}
            />
        </AdminLayout>
    );
}