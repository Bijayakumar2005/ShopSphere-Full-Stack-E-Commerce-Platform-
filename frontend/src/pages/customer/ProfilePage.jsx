import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Package,
  Heart,
  Edit2,
  Plus,
  Trash2,
  Check,
  Camera,
  KeyRound,
  AlertTriangle,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Breadcrumbs, Button, Input, Badge, ConfirmDialog } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { MOCK_USER, MOCK_ORDERS } from '@/data/mockData'
import { formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'

const TABS = ['Profile', 'Addresses', 'Security']

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('Profile')
  const [editing, setEditing] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Profile Form state
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [profileErrors, setProfileErrors] = useState({})

  // Password Form state
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  // Address state & confirmation dialog
  const [addresses, setAddresses] = useState(MOCK_USER.addresses)
  const [addressToDelete, setAddressToDelete] = useState(null)

  useEffect(() => {
    if (user) {
      setForm((prev) => {
        if (!prev.email || prev.email !== user.email) {
          return {
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          }
        }
        return prev
      })
    }
  }, [user?.id, user?.email])

  const validateProfileForm = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'

    if (form.phone && !/^\+?[0-9\s-]{10,14}$/.test(form.phone.trim())) {
      errs.phone = 'Please enter a valid phone number'
    }

    setProfileErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    if (!validateProfileForm()) return

    setSavingProfile(true)
    try {
      await updateProfile({
        name: form.name.trim(),
        phone: form.phone.trim(),
      })
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile'
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  const validatePasswordForm = () => {
    const errs = {}
    if (!passwordForm.currentPassword) errs.currentPassword = 'Current password is required'
    if (!passwordForm.newPassword) errs.newPassword = 'New password is required'
    else if (passwordForm.newPassword.length < 8) errs.newPassword = 'New password must be at least 8 characters'

    if (!passwordForm.confirmPassword) errs.confirmPassword = 'Confirmation password is required'
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errs.confirmPassword = 'New passwords do not match'
    }

    setPasswordErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChangePassword = async (e) => {
    if (e) e.preventDefault()
    if (!validatePasswordForm()) return

    setChangingPassword(true)
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      toast.success('Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors({})
      setShowPasswordModal(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password'
      toast.error(msg)
    } finally {
      setChangingPassword(false)
    }
  }

  const handleDeleteAddress = () => {
    if (!addressToDelete) return
    setAddresses((prev) => prev.filter((a) => a.id !== addressToDelete.id))
    toast.success(`Address "${addressToDelete.label}" removed`)
    setAddressToDelete(null)
  }

  const displayName = user?.name || 'Customer'
  const displayEmail = user?.email || ''
  const displayPhone = user?.phone || 'Not provided'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main id="main-content" tabIndex="-1" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Profile' }]} className="mb-5" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left: Avatar + Quick stats */}
          <div className="flex flex-col gap-4">
            {/* Avatar card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col items-center text-center gap-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-brand-600 text-white text-3xl font-bold flex items-center justify-center">
                  {displayName[0]?.toUpperCase()}
                </div>
                <button
                  type="button"
                  onClick={() => toast('Profile photo upload coming soon')}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  aria-label="Change avatar"
                >
                  <Camera size={13} className="text-slate-600" />
                </button>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{displayName}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{displayEmail}</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <Badge variant="success" dot>Active</Badge>
                  {user?.role === 'ADMIN' && <Badge variant="primary">Admin</Badge>}
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {user?.createdAt ? `Member since ${formatDate(user.createdAt, { year: 'numeric', month: 'long' })}` : 'Verified Member'}
              </p>
            </div>

            {/* Quick stats */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Account Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                <button onClick={() => navigate('/orders')} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                    <Package size={15} className="text-brand-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">My Orders</p>
                    <p className="text-sm font-bold text-slate-900">View History</p>
                  </div>
                </button>
                <button onClick={() => navigate('/wishlist')} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <Heart size={15} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Wishlist</p>
                    <p className="text-sm font-bold text-slate-900">Saved Items</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Tab content */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div role="tablist" aria-label="Profile navigation tabs" className="flex gap-1 mb-5 bg-white rounded-xl border border-slate-200 p-1.5 shadow-card">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  role="tab"
                  id={`tab-${tab.toLowerCase()}`}
                  aria-selected={activeTab === tab}
                  aria-controls={`tabpanel-${tab.toLowerCase()}`}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    activeTab === tab
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Profile tab */}
            {activeTab === 'Profile' && (
              <div
                role="tabpanel"
                id="tabpanel-profile"
                aria-labelledby="tab-profile"
                tabIndex={0}
                className="bg-white rounded-xl border border-slate-200 shadow-card p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900">Personal Information</h2>
                  {!editing && (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Edit2 size={13} /> Edit Profile
                    </Button>
                  )}
                </div>

                {editing ? (
                  <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                    <Input
                      label="Full Name"
                      leftIcon={<User size={15} />}
                      value={form.name}
                      disabled={savingProfile}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }))
                        if (profileErrors.name) setProfileErrors((p) => ({ ...p, name: null }))
                      }}
                      error={profileErrors.name}
                      required
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      leftIcon={<Mail size={15} />}
                      value={form.email}
                      disabled
                      helperText="Email address is tied to your login and cannot be altered"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      leftIcon={<Phone size={15} />}
                      value={form.phone}
                      disabled={savingProfile}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, phone: e.target.value }))
                        if (profileErrors.phone) setProfileErrors((p) => ({ ...p, phone: null }))
                      }}
                      error={profileErrors.phone}
                      placeholder="+91 98765 43210"
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={savingProfile}
                        onClick={() => {
                          setEditing(false)
                          setProfileErrors({})
                          setForm({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                          })
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" loading={savingProfile} disabled={savingProfile}>
                        <Check size={15} /> Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4">
                    {[
                      { label: 'Full Name', icon: User, value: displayName },
                      { label: 'Email Address', icon: Mail, value: displayEmail },
                      { label: 'Phone Number', icon: Phone, value: displayPhone },
                      { label: 'Account Role', icon: KeyRound, value: user?.role || 'CUSTOMER' },
                    ].map(({ label, icon: Icon, value }) => (
                      <div key={label} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                        <Icon size={16} className="text-slate-400 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-500">{label}</p>
                          <p className="text-sm font-medium text-slate-900 mt-0.5">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Addresses tab */}
            {activeTab === 'Addresses' && (
              <div
                role="tabpanel"
                id="tabpanel-addresses"
                aria-labelledby="tab-addresses"
                tabIndex={0}
                className="bg-white rounded-xl border border-slate-200 shadow-card p-6"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-semibold text-slate-900">Saved Addresses</h2>
                  <Button size="sm" variant="outline" onClick={() => toast('Address management dialog coming soon')}>
                    <Plus size={13} /> Add New
                  </Button>
                </div>
                <div className="flex flex-col gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={cn(
                        'flex items-start justify-between gap-4 p-4 rounded-xl border-2',
                        addr.isDefault ? 'border-brand-300 bg-brand-50' : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <MapPin
                          size={16}
                          className={cn('mt-0.5 shrink-0', addr.isDefault ? 'text-brand-600' : 'text-slate-400')}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">{addr.label}</span>
                            {addr.isDefault && <Badge variant="primary" size="sm">Default</Badge>}
                          </div>
                          <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">
                            {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                            {addr.city}, {addr.state} – {addr.pincode}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!addr.isDefault && (
                          <button
                            onClick={() => setAddressToDelete(addr)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            aria-label={`Delete ${addr.label} address`}
                            title="Delete address"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security tab */}
            {activeTab === 'Security' && (
              <div
                role="tabpanel"
                id="tabpanel-security"
                aria-labelledby="tab-security"
                tabIndex={0}
                className="bg-white rounded-xl border border-slate-200 shadow-card p-6"
              >
                <h2 className="text-base font-semibold text-slate-900 mb-5">Security Settings</h2>
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Lock size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Password</p>
                        <p className="text-xs text-slate-500">Keep your account secure with regular updates</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setShowPasswordModal((v) => !v)}>
                      {showPasswordModal ? 'Close Form' : 'Change Password'}
                    </Button>
                  </div>

                  {/* Password Change Form */}
                  {showPasswordModal && (
                    <form
                      onSubmit={handleChangePassword}
                      className="p-5 border border-brand-200 bg-brand-50/40 rounded-xl space-y-4 animate-fade-in-up"
                    >
                      <h3 className="text-sm font-semibold text-slate-900">Change Account Password</h3>
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.currentPassword}
                        disabled={changingPassword}
                        onChange={(e) => {
                          setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
                          if (passwordErrors.currentPassword) {
                            setPasswordErrors((p) => ({ ...p, currentPassword: null }))
                          }
                        }}
                        error={passwordErrors.currentPassword}
                        required
                      />
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        helperText="Must be at least 8 characters"
                        value={passwordForm.newPassword}
                        disabled={changingPassword}
                        onChange={(e) => {
                          setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                          if (passwordErrors.newPassword) {
                            setPasswordErrors((p) => ({ ...p, newPassword: null }))
                          }
                        }}
                        error={passwordErrors.newPassword}
                        required
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={passwordForm.confirmPassword}
                        disabled={changingPassword}
                        onChange={(e) => {
                          setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors((p) => ({ ...p, confirmPassword: null }))
                          }
                        }}
                        error={passwordErrors.confirmPassword}
                        required
                      />
                      <div className="flex gap-2 justify-end pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={changingPassword}
                          onClick={() => {
                            setShowPasswordModal(false)
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                            setPasswordErrors({})
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" loading={changingPassword} disabled={changingPassword}>
                          Update Password
                        </Button>
                      </div>
                    </form>
                  )}

                  <div className="flex flex-col gap-3 pt-3 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900">Danger Zone</h3>
                    <div className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-red-800">Delete Account</p>
                        <p className="text-xs text-red-600">Permanently remove your account and all data</p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger-outline"
                        onClick={() => toast.error('Please contact support at support@shopsphere.com to delete your account')}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete address confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(addressToDelete)}
        onClose={() => setAddressToDelete(null)}
        onConfirm={handleDeleteAddress}
        title="Delete Address?"
        description={`Are you sure you want to remove the address "${addressToDelete?.label}"? This action cannot be undone.`}
        confirmLabel="Delete Address"
        variant="danger"
      />

      <Footer />
    </div>
  )
}
