'use client'

import AdminSidebar from '@/components/AdminSidebar'

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminSidebar>
      {children}
    </AdminSidebar>
  )
}
