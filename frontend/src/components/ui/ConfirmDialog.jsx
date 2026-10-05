import { AlertTriangle, Trash2, Info } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { cn } from '@/utils/cn'

const config = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    confirmVariant: 'danger',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    confirmVariant: 'primary',
  },
  info: {
    icon: Info,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-500',
    confirmVariant: 'primary',
  },
}

/**
 * ConfirmDialog — a confirmation modal built on top of Modal.
 *
 * @param {boolean} isOpen
 * @param {function} onClose
 * @param {function} onConfirm
 * @param {string} title
 * @param {string} description
 * @param {'danger'|'warning'|'info'} variant
 * @param {string} confirmLabel
 * @param {string} cancelLabel
 * @param {boolean} loading
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  variant = 'danger',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
}) {
  const { icon: Icon, iconBg, iconColor, confirmVariant } = config[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={title}
      size="sm"
      showClose={false}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {description && (
            <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
