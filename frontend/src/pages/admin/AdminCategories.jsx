import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FolderTree,
  Package,
  Layers,
  AlertTriangle,
  ExternalLink,
  LayoutGrid,
  List,
  RefreshCw,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import {
  Breadcrumbs,
  Button,
  Input,
  Textarea,
  Modal,
  ConfirmDialog,
  Badge,
  Spinner,
} from '@/components/ui'
import { categoryService } from '@/services/categoryService'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

const PRESET_ICONS = ['🎧', '💻', '📱', '👕', '👟', '🏠', '⚡', '🎮', '⌚', '📚', '🎒', '🧴']

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  // Modal states
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    icon: '📁',
    description: '',
  })
  const [errors, setErrors] = useState({})
  const [autoSlug, setAutoSlug] = useState(true)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Fetch categories from real API
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await categoryService.getCategories()
      setCategories(data || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto-generate slug from name helper
  const slugify = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleNameChange = (val) => {
    setForm(prev => ({
      ...prev,
      name: val,
      slug: autoSlug ? slugify(val) : prev.slug,
    }))
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: null }))
    }
  }

  const handleSlugChange = (val) => {
    setAutoSlug(false)
    setForm(prev => ({ ...prev, slug: slugify(val) }))
  }

  const openAddModal = () => {
    setEditingCategory(null)
    setForm({
      name: '',
      slug: '',
      icon: '📁',
      description: '',
    })
    setErrors({})
    setAutoSlug(true)
    setModalOpen(true)
  }

  const openEditModal = (cat) => {
    setEditingCategory(cat)
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      icon: cat.icon || '📁',
      description: cat.description || '',
    })
    setErrors({})
    setAutoSlug(false)
    setModalOpen(true)
  }

  const validateForm = () => {
    const errs = {}
    if (!form.name.trim()) {
      errs.name = 'Category name is required'
    } else if (form.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters'
    } else if (form.name.trim().length > 100) {
      errs.name = 'Name cannot exceed 100 characters'
    }

    if (form.slug && form.slug.length > 120) {
      errs.slug = 'Slug cannot exceed 120 characters'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async (e) => {
    e?.preventDefault()
    if (!validateForm()) return

    try {
      setSaving(true)
      if (editingCategory) {
        const updated = await categoryService.updateCategory(editingCategory.id, form)
        setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)))
        toast.success(`Category "${updated.name}" updated successfully`)
      } else {
        const created = await categoryService.createCategory(form)
        setCategories(prev => [...prev, created])
        toast.success(`Category "${created.name}" created successfully`)
      }
      setModalOpen(false)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save category'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    if (deleteTarget.productCount > 0) {
      toast.error(`Cannot delete category with ${deleteTarget.productCount} assigned product(s)`)
      setDeleteTarget(null)
      return
    }

    try {
      setDeleting(true)
      await categoryService.deleteCategory(deleteTarget.id)
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast.success(`Category "${deleteTarget.name}" deleted successfully`)
      setDeleteTarget(null)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete category'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories
    const q = search.toLowerCase().trim()
    return categories.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.slug && c.slug.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    )
  }, [categories, search])

  // Statistics
  const totalCategories = categories.length
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0)
  const emptyCategories = categories.filter(c => !c.productCount || c.productCount === 0).length
  const maxProducts = Math.max(...categories.map(c => c.productCount || 0), 1)

  return (
    <AdminLayout
      user={{ name: 'Admin' }}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Category Management' },
          ]}
        />
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Category Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Organize products, manage taxonomy, and configure catalog categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCategories}
              disabled={loading}
              title="Refresh categories"
            >
              <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button size="sm" onClick={openAddModal}>
              <Plus size={15} /> Add Category
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
              <FolderTree size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Categories</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalCategories}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <Package size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Categorized Products</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{totalProducts}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Empty Categories</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{emptyCategories}</p>
            </div>
          </div>
        </div>

        {/* Search & View Controls */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, slug, description..."
              aria-label="Search by name, slug, description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-3 text-xs text-slate-500">
            <span>
              Showing <span className="font-semibold text-slate-800">{filteredCategories.length}</span> of{' '}
              {totalCategories} categories
            </span>
            <div role="group" aria-label="Category view layout" className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  viewMode === 'grid' ? 'bg-white shadow-xs text-brand-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
                )}
                title="Grid view"
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  viewMode === 'table' ? 'bg-white shadow-xs text-brand-600 font-semibold' : 'text-slate-400 hover:text-slate-600'
                )}
                title="Table view"
                aria-label="Table view"
                aria-pressed={viewMode === 'table'}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <Spinner size="lg" />
            <p className="text-xs text-slate-400 mt-3 font-medium">Loading catalog categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <FolderTree size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {search ? 'Try adjusting your search query or clear the filter.' : 'Create your first category to start organizing products.'}
            </p>
            {search ? (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearch('')}>
                Clear Search
              </Button>
            ) : (
              <Button size="sm" className="mt-4" onClick={openAddModal}>
                <Plus size={14} /> Add First Category
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCategories.map((cat) => {
              const count = cat.productCount || 0
              const percent = Math.min(Math.round((count / maxProducts) * 100), 100)
              const hasProducts = count > 0

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between gap-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                          {cat.icon || '📁'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 leading-snug">{cat.name}</h3>
                          <span className="inline-block text-[11px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 mt-0.5">
                            /{cat.slug}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          title="Edit category"
                          aria-label={`Edit ${cat.name} category`}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                            hasProducts
                              ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          )}
                          title={hasProducts ? 'Cannot delete category with products' : 'Delete category'}
                          aria-label={hasProducts ? `Cannot delete category ${cat.name} with products` : `Delete ${cat.name} category`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
                      {cat.description || <span className="text-slate-400 italic">No description provided</span>}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Assigned Products</span>
                      <Badge variant={hasProducts ? 'neutral' : 'warning'} size="sm">
                        {count} {count === 1 ? 'item' : 'items'}
                      </Badge>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          hasProducts ? 'bg-brand-500' : 'bg-slate-300'
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
              <table className="w-full min-w-[640px] text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-medium">
                  <tr>
                    <th scope="col" className="py-3 px-4">Category</th>
                    <th scope="col" className="py-3 px-4">Slug</th>
                    <th scope="col" className="py-3 px-4">Description</th>
                    <th scope="col" className="py-3 px-4 text-center">Products</th>
                    <th scope="col" className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCategories.map((cat) => {
                    const count = cat.productCount || 0
                    const hasProducts = count > 0

                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl w-7 h-7 rounded bg-slate-100 flex items-center justify-center shrink-0">
                              {cat.icon || '📁'}
                            </span>
                            <span className="font-semibold text-slate-800">{cat.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-slate-500">
                          /{cat.slug}
                        </td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                          {cat.description || <span className="text-slate-400 italic">None</span>}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={hasProducts ? 'neutral' : 'warning'} size="sm">
                            {count} {count === 1 ? 'item' : 'items'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                              title="Edit"
                              aria-label={`Edit ${cat.name} category`}
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(cat)}
                              className={cn(
                                'p-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                                hasProducts
                                  ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              )}
                              title={hasProducts ? 'Cannot delete category with products' : 'Delete'}
                              aria-label={hasProducts ? `Cannot delete category ${cat.name} with products` : `Delete ${cat.name} category`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 py-1">
          {/* Live Preview Header */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                {form.icon || '📁'}
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Preview</p>
                <h4 className="text-sm font-bold text-slate-900">
                  {form.name.trim() || 'Category Name'}
                </h4>
                <p className="text-[11px] font-mono text-slate-400">
                  /{form.slug || 'category-slug'}
                </p>
              </div>
            </div>
            <Badge variant="neutral" size="sm">
              {editingCategory?.productCount || 0} products
            </Badge>
          </div>

          {/* Name */}
          <Input
            label="Category Name"
            placeholder="e.g. Audio & Headphones"
            required
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            error={errors.name}
            helper="Between 2 and 100 characters"
          />

          {/* Slug */}
          <div>
            <Input
              label="URL Slug"
              placeholder="e.g. audio-headphones"
              value={form.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              error={errors.slug}
              helper="Unique URL identifier. Auto-generated from name."
            />
          </div>

          {/* Icon Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Icon (Emoji or Symbol)</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.icon}
                onChange={(e) => setForm(f => ({ ...f, icon: e.target.value }))}
                placeholder="📁"
                className="w-16 text-center text-xl py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                maxLength={4}
              />
              <div className="flex items-center gap-1 flex-wrap flex-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                    className={cn(
                      'w-7 h-7 rounded hover:bg-white text-base transition-colors flex items-center justify-center',
                      form.icon === emoji && 'bg-white shadow-xs ring-1 ring-brand-500'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <Textarea
            label="Description (Optional)"
            placeholder="Brief summary of what types of products belong to this category..."
            rows={3}
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            helper="Maximum 500 characters"
          />
        </form>
      </Modal>

      {/* Delete Confirmation or Safety Alert */}
      {deleteTarget && deleteTarget.productCount > 0 ? (
        /* Blocked Deletion Notice */
        <Modal
          isOpen={true}
          onClose={() => setDeleteTarget(null)}
          title="Deletion Prohibited"
          size="sm"
          showClose={true}
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                Close
              </Button>
              <Link to="/admin/products">
                <Button size="sm">
                  Manage Products <ExternalLink size={14} />
                </Button>
              </Link>
            </div>
          }
        >
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                Cannot Delete "{deleteTarget.name}"
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This category currently has{' '}
                <span className="font-semibold text-slate-900">
                  {deleteTarget.productCount} active {deleteTarget.productCount === 1 ? 'product' : 'products'}
                </span>{' '}
                assigned to it. To maintain data integrity and prevent catalog corruption, you cannot delete a category with existing products.
              </p>
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-lg p-2.5 text-left text-xs text-amber-900">
                💡 <span className="font-semibold">What to do:</span> Reassign these products to another category or delete them in Product Management first. Once the count reaches 0, this category can safely be deleted.
              </div>
            </div>
          </div>
        </Modal>
      ) : (
        /* Safe Deletion Confirmation */
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          title={`Delete Category "${deleteTarget?.name}"?`}
          description="Are you sure you want to permanently delete this category? This action cannot be undone."
          variant="danger"
          confirmLabel="Delete Category"
          loading={deleting}
        />
      )}
    </AdminLayout>
  )
}

