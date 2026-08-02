import { loadDebugEnabled, log, onDebugEnabledChanged, setDebugEnabled } from './debug'
import { effectiveBinding, shortcuts } from './shortcuts'
import {
  type BindingOverrides,
  loadBindingOverrides,
  matchesBinding,
  onBindingOverridesChanged,
} from './shortcuts/binding'

// The user's binding overrides, kept in sync with storage so rebinding from the
// options page takes effect without reloading the page.
let bindingOverrides: BindingOverrides = {}
loadBindingOverrides().then(overrides => {
  bindingOverrides = overrides
})
onBindingOverridesChanged(overrides => {
  bindingOverrides = overrides
})

// Keep the debug logging flag in sync with storage so it can be toggled live.
// Log once it resolves so the page console confirms the content script loaded
// and which URL it loaded on.
loadDebugEnabled().then(enabled => {
  setDebugEnabled(enabled)
  log('content script loaded on', location.href)
})
onDebugEnabledChanged(setDebugEnabled)

/**
 * Whether the user is currently typing in an editable field.
 * @returns True if focus is in an input, textarea, or contenteditable element
 */
function isEditing(): boolean {
  const active = document.activeElement
  return (
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLInputElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  )
}

/**
 * Dispatches a keydown to the first applicable shortcut whose binding matches,
 * suppressing the event when handled.
 * @returns Nothing
 */
function dispatch(
  /** event - The keyboard event to dispatch. */
  event: KeyboardEvent,
): void {
  const editing = isEditing()

  const shortcut = shortcuts.find(
    candidate =>
      (!editing || candidate.runsWhileEditing) &&
      candidate.appliesTo() &&
      matchesBinding(event, effectiveBinding(candidate, bindingOverrides)),
  )
  if (!shortcut) return

  log('running', shortcut.id)
  if (shortcut.run(event)) {
    event.preventDefault()
    event.stopPropagation()
  }
}

// Listen in the capture phase so shortcuts intercept the key before Wise's own
// handlers see it.
document.addEventListener('keydown', dispatch, true)
