import AdminCustomerDetail from '@/components/admin/AdminCustomerDetail'

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  return <AdminCustomerDetail id={params.id} />
}
