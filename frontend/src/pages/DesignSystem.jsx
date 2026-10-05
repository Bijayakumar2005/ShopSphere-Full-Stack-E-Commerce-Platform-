import { useState } from 'react'
import { toast } from 'react-hot-toast'
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Search,
  Bell,
  Settings,
  Heart,
  Star,
  Filter,
  Plus,
  Download,
  Trash2,
  Edit,
  Eye,
  ChevronRight,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Info,
  BarChart3,
  Warehouse,
  Tag,
} from 'lucide-react'

// UI Components
import {
  Button,
  Badge,
  Spinner,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  CardFooter,
  Input,
  Select,
  Textarea,
  Modal,
  Dropdown,
  ConfirmDialog,
  Table,
  Pagination,
  Breadcrumbs,
  SkeletonLine,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonProductCard,
} from '@/components/ui'

// Shared Components
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { OrderTimeline } from '@/components/shared/OrderTimeline'

// Layout
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

// Product & Admin
import { ProductCard } from '@/components/product/ProductCard'
import { StatCard } from '@/components/admin/StatCard'

// ─────────────────────────────────────────────
// Section wrapper component
// ─────────────────────────────────────────────
function Section({ id, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  )
}

function Divider() {
  return <hr className="border-slate-200" />
}

function Label({ children }) {
  return (
    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────
// Sample data
// ─────────────────────────────────────────────
const sampleProducts = [
  {
    id: 1,
    name: 'Premium Wireless Noise-Cancelling Headphones',
    brand: 'SoundCraft',
    price: 12999,
    originalPrice: 18999,
    rating: 4.5,
    reviewCount: 128,
    stockQuantity: 15,
    imageUrl: null,
  },
  {
    id: 2,
    name: 'Mechanical Gaming Keyboard RGB Backlit',
    brand: 'TechPro',
    price: 8499,
    originalPrice: null,
    rating: 4.2,
    reviewCount: 84,
    stockQuantity: 3,
    imageUrl: null,
  },
  {
    id: 3,
    name: 'Ultra-Slim Portable Laptop Stand',
    brand: 'ErgoDesk',
    price: 2999,
    originalPrice: 3999,
    rating: 4.8,
    reviewCount: 256,
    stockQuantity: 0,
    imageUrl: null,
  },
  {
    id: 4,
    name: 'Smart Watch Fitness Tracker Series 5',
    brand: 'FitTech',
    price: 24999,
    originalPrice: 29999,
    rating: 4.4,
    reviewCount: 302,
    stockQuantity: 22,
    imageUrl: null,
  },
]

const tableColumns = [
  { key: 'id', header: 'Order ID', render: (v) => <span className="font-mono text-xs">#{v}</span> },
  { key: 'customer', header: 'Customer' },
  {
    key: 'status',
    header: 'Status',
    render: (v) => <StatusIndicator status={v} />,
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    render: (v) => <span className="font-semibold">₹{v.toLocaleString('en-IN')}</span>,
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (_, row) => (
      <div className="flex items-center justify-end gap-1">
        <button className="p-1.5 rounded-md text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
          <Eye size={14} />
        </button>
        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
          <Edit size={14} />
        </button>
      </div>
    ),
  },
]

const tableData = [
  { id: 1042, customer: 'Riya Sharma', status: 'DELIVERED', amount: 12999 },
  { id: 1041, customer: 'Arjun Patel', status: 'SHIPPED', amount: 8499 },
  { id: 1040, customer: 'Priya Nair', status: 'CONFIRMED', amount: 24999 },
  { id: 1039, customer: 'Rahul Singh', status: 'PENDING', amount: 2999 },
  { id: 1038, customer: 'Kavya Reddy', status: 'CANCELLED', amount: 5499 },
]

const orderEvents = [
  {
    status: 'ORDER_PLACED',
    timestamp: '2024-01-15T10:30:00',
    description: 'Your order has been placed successfully.',
    completed: true,
  },
  {
    status: 'CONFIRMED',
    timestamp: '2024-01-15T11:45:00',
    description: 'Seller has confirmed your order.',
    completed: true,
  },
  {
    status: 'SHIPPED',
    timestamp: '2024-01-16T14:20:00',
    description: 'Your package is on the way. Tracking: IND9182736.',
    active: true,
  },
  {
    status: 'DELIVERED',
    timestamp: null,
    description: 'Estimated delivery: Jan 18, 2024',
    completed: false,
  },
]

// ─────────────────────────────────────────────
// Main DesignSystem page
// ─────────────────────────────────────────────
export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmWarning, setConfirmWarning] = useState(false)
  const [currentPage, setCurrentPage] = useState(3)
  const [wishlisted, setWishlisted] = useState({ 1: true })

  const showToast = (type) => {
    const types = {
      success: () => toast.success('Product added to cart successfully!'),
      error: () => toast.error('Failed to process your request.'),
      loading: () => toast.loading('Processing your order…'),
      default: () => toast('This is a default notification.'),
    }
    types[type]?.()
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Live Navbar preview */}
      <Navbar cartCount={3} wishlistCount={2} isLoggedIn={true} user={{ name: 'Riya Sharma', role: 'CUSTOMER' }} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Star size={18} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                Design System
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                ShopSphere UI component library & visual identity
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Colors', 'Typography', 'Buttons', 'Forms', 'Cards', 'Badges', 'Overlays', 'Tables', 'Feedback', 'Products', 'Admin'].map(
              (sec) => (
                <a
                  key={sec}
                  href={`#${sec.toLowerCase()}`}
                  className="text-xs px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50 transition-colors duration-150"
                >
                  {sec}
                </a>
              )
            )}
          </div>
        </div>

        <div className="flex flex-col gap-14">

          {/* ── 1. COLORS ───────────────────────────────────── */}
          <Section
            id="colors"
            title="Color Palette"
            description="Brand-consistent semantic colors. All derived from Tailwind's design scale."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { label: 'Brand (Indigo)', shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900], prefix: 'brand' },
                { label: 'Neutral (Slate)', shades: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900], prefix: 'slate' },
              ].map(({ label, shades, prefix }) => (
                <div key={label}>
                  <p className="text-sm font-semibold text-slate-700 mb-3">{label}</p>
                  <div className="flex flex-col gap-1">
                    {shades.map((shade) => (
                      <div key={shade} className="flex items-center gap-3">
                        <div className={`w-10 h-6 rounded-md bg-${prefix}-${shade} border border-slate-200/50`} />
                        <span className="text-xs text-slate-500 font-mono">{prefix}-{shade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Semantic */}
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3">Semantic</p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Success', bg: 'bg-emerald-500', text: 'emerald-500' },
                    { label: 'Warning', bg: 'bg-amber-500', text: 'amber-500' },
                    { label: 'Danger', bg: 'bg-red-500', text: 'red-500' },
                    { label: 'Info', bg: 'bg-sky-500', text: 'sky-500' },
                    { label: 'Purple', bg: 'bg-purple-500', text: 'purple-500' },
                  ].map(({ label, bg, text }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-10 h-6 rounded-md ${bg}`} />
                      <div>
                        <p className="text-xs font-medium text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400 font-mono">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Divider />

          {/* ── 2. TYPOGRAPHY ───────────────────────────────── */}
          <Section
            id="typography"
            title="Typography"
            description="Inter typeface with systematic sizing. Tight tracking for headings."
          >
            <Card padding="lg">
              <div className="space-y-5">
                {[
                  { label: 'Display', cls: 'text-4xl font-bold text-slate-900 tracking-tight', sample: 'ShopSphere' },
                  { label: 'H1 — text-3xl font-bold', cls: 'text-3xl font-bold text-slate-900 tracking-tight', sample: 'Premium Products' },
                  { label: 'H2 — text-2xl font-bold', cls: 'text-2xl font-bold text-slate-900 tracking-tight', sample: 'Featured Collection' },
                  { label: 'H3 — text-xl font-semibold', cls: 'text-xl font-semibold text-slate-900', sample: 'Category Title' },
                  { label: 'H4 — text-base font-semibold', cls: 'text-base font-semibold text-slate-900', sample: 'Product Card Heading' },
                  { label: 'Body — text-sm', cls: 'text-sm text-slate-700', sample: 'Regular body text for descriptions and content.' },
                  { label: 'Small — text-xs', cls: 'text-xs text-slate-500', sample: 'Small text for metadata, timestamps, labels.' },
                  { label: 'Caption — text-xs font-medium uppercase tracking-wide', cls: 'text-xs font-medium uppercase tracking-widest text-slate-400', sample: 'Category Label' },
                ].map(({ label, cls, sample }) => (
                  <div key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <span className="text-xs text-slate-400 font-mono w-48 shrink-0">{label}</span>
                    <span className={cls}>{sample}</span>
                  </div>
                ))}
              </div>
            </Card>
          </Section>

          <Divider />

          {/* ── 3. BUTTONS ──────────────────────────────────── */}
          <Section
            id="buttons"
            title="Buttons"
            description="7 variants, 5 sizes, loading state, icon support, and icon-only sizes."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Variants */}
              <Card padding="lg">
                <Label>Variants</Label>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="danger-outline">Danger Outline</Button>
                  <Button variant="link">Link</Button>
                </div>
              </Card>

              {/* Sizes */}
              <Card padding="lg">
                <Label>Sizes</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </Card>

              {/* States */}
              <Card padding="lg">
                <Label>States</Label>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Loading</Button>
                  <Button disabled>Disabled</Button>
                  <Button variant="outline" loading>Loading Outline</Button>
                </div>
              </Card>

              {/* With icons */}
              <Card padding="lg">
                <Label>With Icons</Label>
                <div className="flex flex-wrap gap-3">
                  <Button>
                    <Plus size={15} />
                    Add Product
                  </Button>
                  <Button variant="outline">
                    <Download size={15} />
                    Export
                  </Button>
                  <Button variant="danger">
                    <Trash2 size={15} />
                    Delete
                  </Button>
                </div>
              </Card>

              {/* Icon-only */}
              <Card padding="lg">
                <Label>Icon Only</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="icon-sm" variant="outline" aria-label="Search"><Search size={15} /></Button>
                  <Button size="icon-md" variant="primary" aria-label="Add"><Plus size={15} /></Button>
                  <Button size="icon-md" variant="secondary" aria-label="Settings"><Settings size={16} /></Button>
                  <Button size="icon-lg" variant="ghost" aria-label="Filter"><Filter size={17} /></Button>
                  <Button size="icon-md" variant="danger" aria-label="Delete"><Trash2 size={15} /></Button>
                </div>
              </Card>

              {/* Full width */}
              <Card padding="lg">
                <Label>Full Width</Label>
                <div className="flex flex-col gap-2">
                  <Button fullWidth>Full Width Primary</Button>
                  <Button fullWidth variant="outline">Full Width Outline</Button>
                </div>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* ── 4. FORMS ────────────────────────────────────── */}
          <Section
            id="forms"
            title="Form Controls"
            description="Input, Select, and Textarea — consistent styling with error states."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card padding="lg">
                <Label>Input</Label>
                <div className="flex flex-col gap-4">
                  <Input label="Email address" placeholder="you@example.com" type="email" />
                  <Input
                    label="Password"
                    placeholder="Enter password"
                    type="password"
                    leftIcon={<Lock size={15} />}
                    required
                  />
                  <Input
                    label="Search"
                    placeholder="Search products…"
                    leftIcon={<Search size={15} />}
                  />
                  <Input
                    label="Error state"
                    placeholder="Invalid value"
                    leftIcon={<Mail size={15} />}
                    error="Please enter a valid email address."
                    defaultValue="notanemail"
                  />
                  <Input
                    label="Disabled input"
                    placeholder="Cannot edit"
                    disabled
                    defaultValue="Disabled value"
                  />
                </div>
              </Card>

              <Card padding="lg">
                <Label>Select & Textarea</Label>
                <div className="flex flex-col gap-4">
                  <Select
                    label="Category"
                    placeholder="Select a category…"
                    options={[
                      { value: 'electronics', label: 'Electronics' },
                      { value: 'clothing', label: 'Clothing' },
                      { value: 'books', label: 'Books' },
                      { value: 'home', label: 'Home & Garden' },
                    ]}
                    required
                  />
                  <Select
                    label="Invalid selection"
                    error="Please select a valid option."
                    options={[{ value: 'a', label: 'Option A' }]}
                  />
                  <Textarea
                    label="Product description"
                    placeholder="Describe your product…"
                    helper="Minimum 20 characters."
                    rows={4}
                  />
                  <Textarea
                    label="Notes (error)"
                    error="This field is required."
                    rows={3}
                  />
                </div>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* ── 5. BADGES ───────────────────────────────────── */}
          <Section
            id="badges"
            title="Badges"
            description="Semantic variants with sizes and optional dot indicator."
          >
            <Card padding="lg">
              <div className="flex flex-col gap-6">
                {['sm', 'md', 'lg'].map((size) => (
                  <div key={size}>
                    <Label>Size: {size}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['default', 'primary', 'success', 'warning', 'danger', 'info', 'purple'].map((v) => (
                        <Badge key={v} variant={v} size={size}>
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                <div>
                  <Label>With dot</Label>
                  <div className="flex flex-wrap gap-2">
                    {['success', 'warning', 'danger', 'info'].map((v) => (
                      <Badge key={v} variant={v} dot>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Section>

          <Divider />

          {/* ── 6. CARDS ────────────────────────────────────── */}
          <Section
            id="cards"
            title="Cards"
            description="Surface containers with header, body, footer, and hover variants."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Standard Card</CardTitle>
                  <Badge variant="primary">New</Badge>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This is the default card with header, body, and footer sections.
                  </p>
                </CardBody>
                <CardFooter>
                  <Button size="sm" variant="outline">Cancel</Button>
                  <Button size="sm">Save</Button>
                </CardFooter>
              </Card>

              <Card padding="md" hover>
                <CardHeader>
                  <CardTitle>Hover Card</CardTitle>
                  <Badge variant="success" dot>Active</Badge>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Hover over this card to see the shadow lift effect.
                  </p>
                </CardBody>
              </Card>

              <Card padding="md" clickable onClick={() => toast('Card clicked!')}>
                <CardHeader>
                  <CardTitle>Clickable Card</CardTitle>
                  <ChevronRight size={16} className="text-slate-400" />
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Click anywhere on this card to trigger an action.
                  </p>
                </CardBody>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* ── 7. OVERLAYS ─────────────────────────────────── */}
          <Section
            id="overlays"
            title="Overlays"
            description="Modal, Dropdown, and ConfirmDialog with keyboard support and animations."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Modal trigger */}
              <Card padding="lg" className="flex flex-col gap-3">
                <CardTitle>Modal</CardTitle>
                <p className="text-sm text-slate-500">Focus trap, ESC close, scroll lock, portal rendering.</p>
                <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
              </Card>

              {/* Dropdown */}
              <Card padding="lg" className="flex flex-col gap-3">
                <CardTitle>Dropdown</CardTitle>
                <p className="text-sm text-slate-500">Click-outside close, portal, keyboard ESC.</p>
                <Dropdown
                  trigger={
                    <Button variant="outline">
                      Actions
                      <ChevronRight size={14} className="rotate-90" />
                    </Button>
                  }
                  items={[
                    { label: 'Edit Product', icon: <Edit size={13} />, onClick: () => toast('Edit clicked') },
                    { label: 'View Details', icon: <Eye size={13} />, onClick: () => toast('View clicked') },
                    { label: 'Download', icon: <Download size={13} />, onClick: () => toast('Download clicked') },
                    { divider: true },
                    { label: 'Delete', icon: <Trash2 size={13} />, onClick: () => toast.error('Delete clicked'), danger: true },
                  ]}
                />
              </Card>

              {/* Confirm dialogs */}
              <Card padding="lg" className="flex flex-col gap-3">
                <CardTitle>Confirm Dialog</CardTitle>
                <p className="text-sm text-slate-500">Danger, warning, and info variants.</p>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="danger-outline"
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 size={13} />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmWarning(true)}
                  >
                    <AlertCircle size={13} />
                    Warning
                  </Button>
                </div>
              </Card>
            </div>

            {/* Modal */}
            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Edit Product Details"
              size="md"
              footer={
                <>
                  <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setModalOpen(false)
                      toast.success('Product saved!')
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              }
            >
              <div className="flex flex-col gap-4">
                <Input label="Product Name" defaultValue="Premium Wireless Headphones" required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Price" defaultValue="12999" type="number" />
                  <Input label="Stock" defaultValue="15" type="number" />
                </div>
                <Select
                  label="Category"
                  options={[
                    { value: 'electronics', label: 'Electronics' },
                    { value: 'clothing', label: 'Clothing' },
                  ]}
                  defaultValue="electronics"
                />
                <Textarea label="Description" rows={3} defaultValue="Premium noise-cancelling headphones." />
              </div>
            </Modal>

            {/* Danger Confirm */}
            <ConfirmDialog
              isOpen={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={() => {
                setConfirmOpen(false)
                toast.success('Item deleted.')
              }}
              title="Delete this product?"
              description="This action cannot be undone. The product will be permanently removed from your catalog."
              variant="danger"
              confirmLabel="Delete"
            />

            {/* Warning Confirm */}
            <ConfirmDialog
              isOpen={confirmWarning}
              onClose={() => setConfirmWarning(false)}
              onConfirm={() => {
                setConfirmWarning(false)
                toast('Action confirmed.')
              }}
              title="Proceed with changes?"
              description="This will update all linked records. Please review before continuing."
              variant="warning"
              confirmLabel="Proceed"
            />
          </Section>

          <Divider />

          {/* ── 8. TABLES ───────────────────────────────────── */}
          <Section
            id="tables"
            title="Tables & Pagination"
            description="Data table with column config, hover rows, and smart ellipsis pagination."
          >
            <div className="flex flex-col gap-6">
              <div>
                <Label>Order Table</Label>
                <Table
                  data={tableData}
                  columns={tableColumns}
                  hoverable
                  rowKey="id"
                />
              </div>

              <div>
                <Label>Pagination</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={12}
                    onPageChange={setCurrentPage}
                    showInfo
                  />
                </div>
              </div>

              <div>
                <Label>Table with loading</Label>
                <Table
                  data={[]}
                  columns={tableColumns}
                  loading
                />
              </div>

              <div>
                <Label>Table empty state</Label>
                <Table
                  data={[]}
                  columns={tableColumns}
                  emptyState={
                    <div className="flex flex-col items-center gap-2">
                      <Package size={28} className="text-slate-300" />
                      <p className="text-sm text-slate-400">No orders found</p>
                    </div>
                  }
                />
              </div>
            </div>
          </Section>

          <Divider />

          {/* ── 9. FEEDBACK ─────────────────────────────────── */}
          <Section
            id="feedback"
            title="Feedback Components"
            description="Empty states, error states, loading indicators, toasts, status, timeline, breadcrumbs, skeletons."
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Breadcrumbs */}
              <Card padding="lg">
                <Label>Breadcrumbs</Label>
                <Breadcrumbs
                  items={[
                    { label: 'Home', href: '/' },
                    { label: 'Products', href: '/products' },
                    { label: 'Electronics', href: '/products?category=electronics' },
                    { label: 'Headphones' },
                  ]}
                />
              </Card>

              {/* Status Indicators */}
              <Card padding="lg">
                <Label>Status Indicators</Label>
                <div className="flex flex-wrap gap-2">
                  {['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAID', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'].map(
                    (s) => (
                      <StatusIndicator key={s} status={s} />
                    )
                  )}
                </div>
              </Card>

              {/* Empty States */}
              <Card padding="none">
                <EmptyState
                  icon={<ShoppingCart size={28} />}
                  title="Your cart is empty"
                  description="Add products to your cart to proceed with checkout."
                  actionLabel="Browse Products"
                  onAction={() => toast('Navigating to products')}
                />
              </Card>

              <Card padding="none">
                <ErrorState
                  title="Failed to load products"
                  description="We couldn't connect to the server. Check your internet connection."
                  type="network"
                  onRetry={() => toast('Retrying…')}
                />
              </Card>

              {/* Spinners */}
              <Card padding="lg">
                <Label>Spinners</Label>
                <div className="flex items-center gap-5">
                  <Spinner size="xs" />
                  <Spinner size="sm" />
                  <Spinner size="md" />
                  <Spinner size="lg" />
                  <Spinner size="xl" />
                </div>
              </Card>

              {/* Toast demos */}
              <Card padding="lg">
                <Label>Toast Notifications</Label>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => showToast('success')}>
                    <CheckCircle size={13} className="text-emerald-500" />
                    Success
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => showToast('error')}>
                    <AlertCircle size={13} className="text-red-500" />
                    Error
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => showToast('loading')}>
                    <Spinner size="xs" color="slate" />
                    Loading
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => showToast('default')}>
                    <Info size={13} className="text-slate-400" />
                    Default
                  </Button>
                </div>
              </Card>

              {/* Skeletons */}
              <Card padding="lg">
                <Label>Skeleton Loaders</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <SkeletonAvatar size="md" />
                    <div className="flex-1 flex flex-col gap-2">
                      <SkeletonLine variant="heading" width="w-1/2" />
                      <SkeletonLine variant="text" width="w-3/4" />
                    </div>
                  </div>
                  <SkeletonLine width="w-full" />
                  <SkeletonLine width="w-5/6" />
                  <SkeletonLine variant="text" width="w-2/3" />
                </div>
              </Card>

              {/* Order timeline */}
              <Card padding="lg">
                <Label>Order Timeline</Label>
                <OrderTimeline events={orderEvents} />
              </Card>

              {/* Loading state variants */}
              <Card padding="lg">
                <Label>Loading State — Section</Label>
                <LoadingState variant="section" message="Loading products…" />
              </Card>

              <Card padding="lg" className="col-span-full">
                <Label>Skeleton Product Cards</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <SkeletonProductCard key={i} />
                  ))}
                </div>
              </Card>
            </div>
          </Section>

          <Divider />

          {/* ── 10. PRODUCT CARDS ───────────────────────────── */}
          <Section
            id="products"
            title="Product Cards"
            description="With discount badge, low stock, out-of-stock, wishlist, and hover add-to-cart."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {sampleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isWishlisted={!!wishlisted[product.id]}
                  onWishlist={(p) => {
                    setWishlisted((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                    toast(wishlisted[product.id] ? 'Removed from wishlist' : 'Added to wishlist')
                  }}
                  onAddToCart={(p) => toast.success(`${p.name} added to cart`)}
                />
              ))}
            </div>
          </Section>

          <Divider />

          {/* ── 11. ADMIN COMPONENTS ────────────────────────── */}
          <Section
            id="admin"
            title="Admin Dashboard Components"
            description="Stat cards for key metrics with trend indicators."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Total Revenue"
                value="₹4,28,510"
                icon={<DollarSign size={20} />}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                change={12.5}
                changeLabel="vs last month"
              />
              <StatCard
                title="Total Orders"
                value="1,842"
                icon={<ShoppingCart size={20} />}
                iconBg="bg-brand-50"
                iconColor="text-brand-600"
                change={8.2}
                changeLabel="vs last month"
              />
              <StatCard
                title="Active Customers"
                value="9,641"
                icon={<Users size={20} />}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                change={-2.4}
                changeLabel="vs last month"
              />
              <StatCard
                title="Total Products"
                value="324"
                icon={<Package size={20} />}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                change={0}
                changeLabel="no change"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-5">
              <StatCard
                title="Pending Orders"
                value="42"
                icon={<BarChart3 size={20} />}
                iconBg="bg-sky-50"
                iconColor="text-sky-600"
                change={5.1}
              />
              <StatCard
                title="Low Stock Items"
                value="18"
                icon={<Warehouse size={20} />}
                iconBg="bg-red-50"
                iconColor="text-red-500"
                change={-3.2}
              />
              <StatCard
                title="Categories"
                value="24"
                icon={<Tag size={20} />}
                iconBg="bg-slate-100"
                iconColor="text-slate-600"
                change={undefined}
              />
            </div>

            {/* Loading state */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mt-5">
              {[1, 2, 3, 4].map((i) => (
                <StatCard
                  key={i}
                  title="Loading metric"
                  value="—"
                  icon={<BarChart3 size={20} />}
                  iconBg="bg-slate-100"
                  iconColor="text-slate-400"
                  loading
                />
              ))}
            </div>
          </Section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
