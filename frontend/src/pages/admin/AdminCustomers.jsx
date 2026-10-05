import { useState } from 'react'
import { Search, Eye, Ban, CheckCircle, User, Mail, Calendar, Package, DollarSign, Shield, Phone } from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Breadcrumbs, Button, Badge, Table, Pagination, Modal, ConfirmDialog } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { EmptyState } from '@/components/shared/EmptyState'
import { ADMIN_CUSTOMERS } from '@/data/mockData'
import { formatCurrency, formatDate } from '@/utils/format'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState(ADMIN_CUSTOMERS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [customerToDeactivate, setCustomerToDeactivate] = useState(null)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const PER_PAGE = 8

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'All' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE)
  const totalPages = Math.ceil(filtered.length / PER_PAGE)

  const handleStatusToggleRequest = (customer) => {
    if (customer.status === 'ACTIVE') {
      setCustomerToDeactivate(customer)
    } else {
      // Re-activate immediately
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, status: 'ACTIVE' } : c))
      )
      toast.success(`Account for ${customer.name} activated successfully`)
    }
  }

  const confirmDeactivation = () => {
    if (!customerToDeactivate) return
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerToDeactivate.id ? { ...c, status: 'INACTIVE' } : c))
    )
    toast.success(`Account for ${customerToDeactivate.name} deactivated`)
    setCustomerToDeactivate(null)
  }

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {v[0]?.toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{v}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (v) => <span className="text-xs text-slate-500">{formatDate(v)}</span>,
    },
    {
      key: 'orders',
      header: 'Orders',
      align: 'center',
      render: (v) => <span className="text-sm font-semibold text-slate-800">{v}</span>,
    },
    {
      key: 'spent',
      header: 'Total Spent',
      align: 'right',
      render: (v) => <span className="text-sm font-semibold">{formatCurrency(v)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (v) => <StatusIndicator status={v} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewingCustomer(row)}
            className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            title="View customer details"
            aria-label={`View details for customer ${row.name}`}
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleStatusToggleRequest(row)}
            className={cn(
              'p-1.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
              row.status === 'ACTIVE'
                ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
            )}
            title={row.status === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}
            aria-label={row.status === 'ACTIVE' ? `Deactivate account for ${row.name}` : `Activate account for ${row.name}`}
          >
            {row.status === 'ACTIVE' ? <Ban size={15} /> : <CheckCircle size={15} />}
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout
      user={{ name: 'Admin' }}
      breadcrumbs={<Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Customers' }]} />}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Search by name or email…"
            aria-label="Search customers by name or email"
            className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div role="group" aria-label="Filter customers by status" className="flex gap-1">
          {['All', 'ACTIVE', 'INACTIVE'].map((f) => (
            <button
              key={f}
              onClick={() => {
                setStatusFilter(f)
                setCurrentPage(1)
              }}
              aria-pressed={statusFilter === f}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                statusFilter === f ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {f === 'All' ? 'All Customers' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total', value: customers.length, color: 'text-slate-900' },
          { label: 'Active', value: customers.filter((c) => c.status === 'ACTIVE').length, color: 'text-emerald-700' },
          { label: 'Inactive', value: customers.filter((c) => c.status === 'INACTIVE').length, color: 'text-red-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-card p-4 text-center">
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label} Customers</p>
          </div>
        ))}
      </div>

      {/* Table / Empty state */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Customer Directory <span className="text-slate-400 font-normal text-xs ml-1">({filtered.length})</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Search size={28} />}
              title="No customers found"
              description="No customer records match your current search query or filter."
              actionLabel="Reset Search"
              onAction={() => {
                setSearch('')
                setStatusFilter('All')
              }}
            />
          </div>
        ) : (
          <>
            <Table data={paginated} columns={columns} hoverable rowKey="id" />
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-200 flex justify-between items-center">
                <p className="text-xs text-slate-500">Page {currentPage} of {totalPages}</p>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <Modal
          isOpen={Boolean(viewingCustomer)}
          onClose={() => setViewingCustomer(null)}
          title="Customer Profile Details"
          size="md"
          footer={
            <Button variant="outline" onClick={() => setViewingCustomer(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-full bg-brand-600 text-white text-xl font-bold flex items-center justify-center">
                {viewingCustomer.name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{viewingCustomer.name}</h3>
                  <StatusIndicator status={viewingCustomer.status} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{viewingCustomer.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">Joined on {formatDate(viewingCustomer.joined)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500">Total Orders</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{viewingCustomer.orders}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                <p className="text-xs text-slate-500">Lifetime Spending</p>
                <p className="text-lg font-bold text-brand-700 mt-0.5">{formatCurrency(viewingCustomer.spent)}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-600 p-2.5 rounded-lg bg-slate-50">
                <Mail size={14} className="text-slate-400" />
                <span className="font-medium text-slate-800">{viewingCustomer.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 p-2.5 rounded-lg bg-slate-50">
                <Shield size={14} className="text-slate-400" />
                <span>Account Status: <strong className="text-slate-800">{viewingCustomer.status}</strong></span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Deactivate confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToDeactivate)}
        onClose={() => setCustomerToDeactivate(null)}
        onConfirm={confirmDeactivation}
        title="Deactivate Customer Account?"
        description={`Are you sure you want to deactivate ${customerToDeactivate?.name}'s account? They will not be able to log in or make purchases while their account is inactive.`}
        confirmLabel="Deactivate Account"
        variant="danger"
      />
    </AdminLayout>
  )
}
