// Small DOM helpers shared across the content script.

// Wise renders its buttons as native <button> elements wrapping nested label
// spans, but some controls are links styled as buttons, so both are matched.
const BUTTON_SELECTOR = 'button, [role="button"]'

/**
 * Whether an element is rendered (not hidden via display/visibility/size).
 * @returns True if the element has a non-zero bounding box
 */
export function isVisible(
  /** element - The element to test for visibility. */
  element: HTMLElement,
): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/**
 * Waits for the first element matching a selector (and optional filter) to
 * appear, observing DOM mutations until it does or the timeout elapses.
 * @returns A promise resolving to the matching element
 */
export function waitForElement<T extends Element>(
  /** selector - The CSS selector to match. */
  selector: string,
  /** options - Timeout, search root, and an optional element filter. */
  options: { timeout?: number; root?: Element | Document; filter?: (element: T) => boolean } = {},
): Promise<T> {
  const { timeout = 5000, root = document, filter } = options

  /**
   * The first matching, accepted element currently in the DOM, if any.
   * @returns The matching element, or null when none is present yet
   */
  const find = (): T | null => {
    for (const element of root.querySelectorAll<T>(selector)) {
      if (!filter || filter(element)) return element
    }
    return null
  }

  return new Promise((resolve, reject) => {
    const existing = find()
    if (existing) return resolve(existing)

    const timer = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Timed out waiting for: ${selector}`))
    }, timeout)

    const observer = new MutationObserver(() => {
      const found = find()
      if (found) {
        clearTimeout(timer)
        observer.disconnect()
        resolve(found)
      }
    })
    observer.observe(root, { childList: true, subtree: true, attributes: true, characterData: true })
  })
}

/**
 * Whether a visible button carries the given label. Wise's class names are
 * content-hashed and change between deploys, so buttons are identified by their
 * rendered text instead. Wise nests each label in several spans, so the text is
 * compared case-insensitively with runs of whitespace collapsed.
 * @returns True when the button is shown and labelled with the given text
 */
function isButtonLabelled(
  /** button - The button element to test. */
  button: HTMLElement,
  /** label - The button text to match. */
  label: string,
): boolean {
  const text = button.textContent?.replace(/\s+/g, ' ').trim().toLowerCase()
  return isVisible(button) && text === label.toLowerCase()
}

/**
 * The first visible button on the page with the given label.
 * @returns The matching button, or null when none is shown
 */
export function findButton(
  /** label - The button text to match. */
  label: string,
): HTMLElement | null {
  return (
    Array.from(document.querySelectorAll<HTMLElement>(BUTTON_SELECTOR)).find(button =>
      isButtonLabelled(button, label),
    ) ?? null
  )
}

/**
 * Waits for a visible button with the given label to appear, e.g. one rendered
 * by a popup that has not opened yet.
 * @returns A promise resolving to the matching button
 */
export function waitForButton(
  /** label - The button text to match. */
  label: string,
  /** options - The timeout in milliseconds. */
  options: { timeout?: number } = {},
): Promise<HTMLElement> {
  return waitForElement<HTMLElement>(BUTTON_SELECTOR, {
    ...options,
    filter: button => isButtonLabelled(button, label),
  })
}

/**
 * Dispatches an Escape keydown from the given element, e.g. to dismiss the
 * popup it belongs to. Dispatching from inside the popup rather than on the
 * document lets the event bubble through the popup's own handlers on its way up
 * to any document-level ones, so it reaches whichever the page listens on. The
 * deprecated keyCode is included for handlers that still check it.
 * @returns Nothing
 */
export function pressEscape(
  /** target - The element to dispatch the key press from. */
  target: Element,
): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true, cancelable: true }),
  )
}
