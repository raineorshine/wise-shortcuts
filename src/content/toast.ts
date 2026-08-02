// A small transient toast notification used to report the outcome of an action.

const TOAST_ID = 'wise-shortcuts-toast'

/** The visual style of a toast. */
type ToastType = 'success' | 'error'

/**
 * Shows a transient toast pinned to the top of the page, replacing any existing
 * one. The toast fades out and removes itself after a few seconds.
 * @returns Nothing
 */
export function showToast(
  /** message - The text to display. */
  message: string,
  /** type - Whether the toast reports success or an error. Defaults to error. */
  type: ToastType = 'error',
): void {
  document.getElementById(TOAST_ID)?.remove()

  const toast = document.createElement('div')
  toast.id = TOAST_ID
  toast.textContent = message
  Object.assign(toast.style, {
    position: 'fixed',
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '99999',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    lineHeight: '1.5',
    maxWidth: '400px',
    boxShadow: '0 8px 24px rgba(14, 15, 12, 0.2)',
    color: 'var(--color-content-primary-inverse, #ffffff)',
    backgroundColor:
      type === 'error' ? 'var(--color-background-negative, #a8200d)' : 'var(--color-background-accent, #163300)',
    transition: 'opacity 0.3s',
  })

  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => toast.remove(), 300)
  }, 4000)
}
