import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  Save,
  X,
  Plus,
  ArrowLeft,
  Package,
  Sparkles,
  Tag,
  DollarSign,
  Warehouse,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Breadcrumbs, Button, Input, Select, Textarea, Badge } from '@/components/ui'
import { StatusIndicator } from '@/components/shared/StatusIndicator'
import { productService } from '@/services/productService'
import { formatCurrency, calcDiscountPercent } from '@/utils/format'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

export default function AdminProductForm({ mode = 'add' }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = mode === 'edit'

  const [categories, setCategories] = useState([])
  const [fetchingProduct, setFetchingProduct] = useState(isEdit)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    brand: '',
    categoryId: '',
    price: '',
    discount: '',
    stockQuantity: '',
    description: '',
    imageUrl: '',
    emoji: '📦',
    accent: '#6366f1',
  })

  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Load categories and initial product data
  useEffect(() => {
    async function initData() {
      try {
        const cats = await productService.getCategories()
        setCategories(cats)

        if (isEdit && id) {
          setFetchingProduct(true)
          const product = await productService.getProductById(id)
          if (product) {
            setForm({
              name: product.name || '',
              brand: product.brand || '',
              categoryId: product.categoryId ? product.categoryId.toString() : (cats[0]?.id?.toString() || ''),
              price: product.price ? product.price.toString() : '',
              discount: product.discount ? product.discount.toString() : '',
              stockQuantity: (product.stockQuantity ?? product.stock ?? 0).toString(),
              description: product.description || '',
              imageUrl: product.imageUrl || product.image || '',
              emoji: product.emoji || '📦',
              accent: product.accent || '#6366f1',
            })
          }
        } else if (cats.length > 0 && !form.categoryId) {
          setForm((f) => ({ ...f, categoryId: cats[0].id.toString() }))
        }
      } catch (err) {
        toast.error('Failed to load initial form data.')
      } finally {
        setFetchingProduct(false)
      }
    }
    initData()
  }, [id, isEdit])

  const validateField = (fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value || !value.trim()) return 'Product name is required.'
        if (value.trim().length < 2) return 'Name must be at least 2 characters.'
        if (value.trim().length > 200) return 'Name cannot exceed 200 characters.'
        return ''
      case 'brand':
        if (!value || !value.trim()) return 'Brand is required.'
        if (value.trim().length > 100) return 'Brand cannot exceed 100 characters.'
        return ''
      case 'categoryId':
        if (!value) return 'Please select a product category.'
        return ''
      case 'price':
        if (!value || isNaN(Number(value))) return 'Price is required and must be a number.'
        if (Number(value) <= 0) return 'Price must be greater than 0.'
        return ''
      case 'discount':
        if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) >= 100)) {
          return 'Discount must be between 0% and 99%.'
        }
        return ''
      case 'stockQuantity':
        if (value === '' || isNaN(Number(value))) return 'Stock quantity is required.'
        if (Number(value) < 0) return 'Stock quantity cannot be negative.'
        if (!Number.isInteger(Number(value))) return 'Stock must be an integer.'
        return ''
      case 'description':
        if (!value || !value.trim()) return 'Description is required.'
        if (value.trim().length < 10) return 'Please provide at least 10 characters of description.'
        return ''
      case 'imageUrl':
        if (value && value.trim() && !/^https?:\/\/.+/i.test(value.trim())) {
          return 'Image URL must begin with http:// or https://'
        }
        return ''
      default:
        return ''
    }
  }

  const handleChange = (field) => (e) => {
    const val = e.target.value
    setForm((f) => ({ ...f, [field]: val }))
    if (touched[field]) {
      const err = validateField(field, val)
      setErrors((prev) => ({ ...prev, [field]: err }))
    }
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const err = validateField(field, form[field])
    setErrors((prev) => ({ ...prev, [field]: err }))
  }

  const validateAll = () => {
    const newErrors = {}
    Object.keys(form).forEach((key) => {
      const err = validateField(key, form[key])
      if (err) newErrors[key] = err
    })
    setErrors(newErrors)
    setTouched({
      name: true,
      brand: true,
      categoryId: true,
      price: true,
      discount: true,
      stockQuantity: true,
      description: true,
      imageUrl: true,
    })
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validateAll()) {
      toast.error('Please fix the validation errors before saving.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        categoryId: Number(form.categoryId),
        price: parseFloat(form.price),
        discount: form.discount ? parseInt(form.discount, 10) : 0,
        stockQuantity: parseInt(form.stockQuantity, 10),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
        emoji: form.emoji,
        accent: form.accent,
      }

      if (isEdit) {
        await productService.updateProduct(id, payload)
        toast.success(`"${form.name}" updated successfully!`)
      } else {
        await productService.createProduct(payload)
        toast.success(`"${form.name}" added to catalog successfully!`)
      }

      navigate('/admin/products')
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Operation failed'
      toast.error(serverMsg)
    } finally {
      setSaving(false)
    }
  }

  // Derived preview data
  const numPrice = Number(form.price) || 0
  const numDiscount = Number(form.discount) || 0
  const numStock = Number(form.stockQuantity) || 0
  const selectedCat = categories.find((c) => c.id.toString() === form.categoryId)

  return (
    <AdminLayout
      pageTitle={isEdit ? 'Edit Product' : 'Add New Product'}
      breadcrumbs={
        <Breadcrumbs
          items={[
            { label: 'Admin', href: '/admin' },
            { label: 'Products', href: '/admin/products' },
            { label: isEdit ? 'Edit' : 'Add Product' },
          ]}
        />
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* ── Action Bar ──────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Back to products"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isEdit ? 'Edit Product' : 'Create New Product'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {isEdit
                  ? `Update details and inventory for product ID #${id}`
                  : 'Add a new product with pricing, media, and stock levels'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/products')}
              className="text-xs bg-white"
            >
              <X size={14} /> Cancel
            </Button>
            <Button type="submit" loading={saving} className="text-xs shadow-xs">
              <Save size={14} /> {isEdit ? 'Save Changes' : 'Publish Product'}
            </Button>
          </div>
        </div>

        {fetchingProduct ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-brand-600 border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-slate-500 font-medium">Loading product details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Left 2 Columns: Form Fields ───────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Package size={17} className="text-brand-600" />
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    General Information
                  </h2>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Premium Noise-Cancelling Headphones"
                    value={form.name}
                    onChange={handleChange('name')}
                    onBlur={handleBlur('name')}
                    className={cn(
                      'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all',
                      errors.name && touched.name
                        ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    )}
                  />
                  {errors.name && touched.name && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Brand & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Brand / Manufacturer <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SoundCraft"
                      value={form.brand}
                      onChange={handleChange('brand')}
                      onBlur={handleBlur('brand')}
                      className={cn(
                        'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all',
                        errors.brand && touched.brand
                          ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                          : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                      )}
                    />
                    {errors.brand && touched.brand && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={13} /> {errors.brand}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.categoryId}
                      onChange={handleChange('categoryId')}
                      onBlur={handleBlur('categoryId')}
                      className={cn(
                        'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all',
                        errors.categoryId && touched.categoryId
                          ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                          : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                      )}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && touched.categoryId && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={13} /> {errors.categoryId}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detailed Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe technical specifications, materials, warranty, and key selling propositions..."
                    value={form.description}
                    onChange={handleChange('description')}
                    onBlur={handleBlur('description')}
                    className={cn(
                      'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all resize-y',
                      errors.description && touched.description
                        ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    )}
                  />
                  {errors.description && touched.description && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Section 2: Pricing & Stock */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <DollarSign size={17} className="text-emerald-600" />
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Pricing & Inventory
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Price (INR ₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="e.g. 4999.00"
                      value={form.price}
                      onChange={handleChange('price')}
                      onBlur={handleBlur('price')}
                      className={cn(
                        'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all font-semibold',
                        errors.price && touched.price
                          ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                          : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                      )}
                    />
                    {errors.price && touched.price && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={13} /> {errors.price}
                      </p>
                    )}
                  </div>

                  {/* Discount */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Discount (%) <span className="text-slate-400 font-normal">Optional</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      placeholder="e.g. 15"
                      value={form.discount}
                      onChange={handleChange('discount')}
                      onBlur={handleBlur('discount')}
                      className={cn(
                        'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all',
                        errors.discount && touched.discount
                          ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                          : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                      )}
                    />
                    {errors.discount && touched.discount && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={13} /> {errors.discount}
                      </p>
                    )}
                  </div>

                  {/* Stock Quantity */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Inventory Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 25"
                      value={form.stockQuantity}
                      onChange={handleChange('stockQuantity')}
                      onBlur={handleBlur('stockQuantity')}
                      className={cn(
                        'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all font-semibold',
                        errors.stockQuantity && touched.stockQuantity
                          ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                          : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                      )}
                    />
                    {errors.stockQuantity && touched.stockQuantity && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle size={13} /> {errors.stockQuantity}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Media & Imagery */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <ImageIcon size={17} className="text-purple-600" />
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                    Media & Visual Assets
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Image URL <span className="text-slate-400 font-normal">Direct link to product photo</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={form.imageUrl}
                    onChange={handleChange('imageUrl')}
                    onBlur={handleBlur('imageUrl')}
                    className={cn(
                      'w-full px-3.5 py-2 text-sm border rounded-lg outline-none transition-all',
                      errors.imageUrl && touched.imageUrl
                        ? 'border-red-400 bg-red-50/30 focus:ring-2 focus:ring-red-400/20'
                        : 'border-slate-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'
                    )}
                  />
                  {errors.imageUrl && touched.imageUrl && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={13} /> {errors.imageUrl}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tip: Use Unsplash or web-hosted HTTPS images for crisp catalog display.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Right Column: Live Product Card Preview ───────────── */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Eye size={15} className="text-brand-600" />
                    <span>Storefront Card Preview</span>
                  </div>
                  <Badge variant="neutral" size="sm">Live</Badge>
                </div>

                {/* Simulated Product Card */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                  <div className="h-44 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    {form.imageUrl ? (
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="text-4xl">{form.emoji || '📦'}</div>
                    )}

                    {numDiscount > 0 && (
                      <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {numDiscount}% OFF
                      </span>
                    )}

                    <div className="absolute top-2 right-2">
                      <StatusIndicator
                        status={numStock === 0 ? 'OUT_OF_STOCK' : numStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'}
                        variant="pill"
                      />
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
                      {form.brand || 'Brand'} · {selectedCat?.name || 'Category'}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {form.name || 'Your Product Title'}
                    </h4>

                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-base font-bold text-slate-900">
                        {formatCurrency(numPrice || 0)}
                      </span>
                      {numDiscount > 0 && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(numPrice / (1 - numDiscount / 100))}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 pt-1 border-t border-slate-100">
                      {form.description || 'Product description excerpt will be presented here.'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <p className="font-semibold text-slate-800">Publishing Details:</p>
                  <p>• Immediate synchronization with search indices</p>
                  <p>• Category: {selectedCat?.name || 'Unassigned'}</p>
                  <p>• Starting Inventory: {numStock} units</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </AdminLayout>
  )
}
