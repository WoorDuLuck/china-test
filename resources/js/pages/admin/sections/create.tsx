import AdminLayout from '@/layouts/admin-layout';
import SectionForm from './section-form';

export default function Create() {
    return (
        <AdminLayout title="Новый раздел">
            <h1 className="text-xl font-bold mb-4">Новый раздел</h1>
            <SectionForm action={route('admin.sections.store')} method="post" />
        </AdminLayout>
    );
}