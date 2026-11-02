import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Dialog({
  title,
  children,
  onClose,
  action,
  actionLabel = 'Confirmar',
  destructive = false,
}: {
  title: string
  children: ReactNode
  onClose(): void
  action(): void
  actionLabel?: string
  destructive?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    return () => {
      dialog.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-heading">
        <h2 id="dialog-title">{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Cerrar ventana"
          title="Cerrar"
        >
          <X size={18} />
        </button>
      </div>
      <div className="dialog-body">{children}</div>
      <div className="dialog-actions">
        <button className="button secondary" onClick={onClose} autoFocus>
          Cancelar
        </button>
        <button className={`button ${destructive ? 'danger' : 'primary'}`} onClick={action}>
          {actionLabel}
        </button>
      </div>
    </dialog>
  )
}
