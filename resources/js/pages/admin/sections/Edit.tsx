import AdminLayout from '@/layouts/admin-layout';
import SectionForm from './section-form';

type Section = { id: number; title: string; description: string | null };

export default function Edit({ section }: { section: Section }) {
    return (
        <AdminLayout title="Редактирование раздела">
            <h1 className="text-xl font-bold mb-4">Редактирование раздела</h1>
            <SectionForm
                action={route('admin.sections.update', section.id)}
                method="put"
                section={section}
            />
        </AdminLayout>
    );
}