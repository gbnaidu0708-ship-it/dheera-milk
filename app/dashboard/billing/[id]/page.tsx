import BillingDetail from '@/components/customer/BillingDetail'

export default function BillingDetailPage({ params }: { params: { id: string } }) {
  return <BillingDetail invoiceId={params.id} />
}
