import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar clinicName={session.user.clinicName} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
