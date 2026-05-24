import { Suspense } from 'react'
import CustomerHome from '@/components/customer/CustomerHome'

export default function DashboardPage() {
  // useSearchParams in CustomerHome opts the page out of static rendering;
  // wrapping it in Suspense satisfies Next's CSR bailout warning.
  return (
    <Suspense fallback={null}>
      <CustomerHome />
    </Suspense>
  )
}
