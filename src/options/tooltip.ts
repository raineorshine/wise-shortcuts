// A custom floating tooltip that follows the cursor, replacing the native
// `title` attribute. A single overlay element is shared across all targets: it
// appears on hover, tracks the pointer while shown, and dismisses on scroll or
// touch so it never sticks open on mobile, where `mouseleave` does not fire.

/** The tooltip text, or a function that returns it lazily at hover time. */
export type TooltipLabel = string | (() => string | null)

/** The shared overlay element, created on first use and reused thereafter. */
let overlay: HTMLDivElement | null = null

/**
 * Returns the shared overlay element, creating and appending it on first use.
 * @returns The tooltip overlay element
 */
function ensureOverlay(): HTMLDivElement {
  if (overlay) return overlay
  const element = document.createElement('div')
  element.className = 'tooltip'
  element.setAttribute('role', 'tooltip')
  document.body.append(element)
  overlay = element
  return element
}

/**
 * Positions the overlay just below and to the right of the cursor.
 * @returns Nothing
 */
function positionOverlay(
  /** element - The overlay element to position. */
  element: HTMLDivElement,
  /** x - The cursor's clientX. */
  x: number,
  /** y - The cursor's clientY. */
  y: number,
): void {
  element.style.left = `${x + 12}px`
  element.style.top = `${y - 22}px`
}

/**
 * Attaches a cursor-following tooltip to an element, shown while the pointer is
 * over it. Pass a function as the label to compute the text lazily at hover
 * time when it depends on changing state.
 * @returns Nothing
 */
export function attachTooltip(
  /** element - The element to show a tooltip for on hover. */
  element: HTMLElement,
  /** label - The tooltip text, or a function returning it lazily. */
  label: TooltipLabel,
): void {
  const onPointerMove = (event: MouseEvent) => {
    if (overlay) positionOverlay(overlay, event.clientX, event.clientY)
  }
  const hide = () => {
    if (overlay) overlay.style.display = 'none'
    document.removeEventListener('mousemove', onPointerMove)
    document.removeEventListener('touchstart', hide)
    document.removeEventListener('scroll', hide, true)
  }
  element.addEventListener('mouseenter', event => {
    const resolved = typeof label === 'function' ? label() : label
    if (!resolved) return
    const tooltip = ensureOverlay()
    tooltip.textContent = resolved
    tooltip.style.display = 'block'
    positionOverlay(tooltip, event.clientX, event.clientY)
    document.addEventListener('mousemove', onPointerMove)
    document.addEventListener('touchstart', hide, { passive: true })
    document.addEventListener('scroll', hide, { passive: true, capture: true })
  })
  element.addEventListener('mouseleave', hide)
}
