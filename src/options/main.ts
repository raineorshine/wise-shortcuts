import { loadDebugEnabled, saveDebugEnabled } from '../content/debug'
import { effectiveBinding, shortcuts } from '../content/shortcuts'
import {
  type BindingOverrides,
  bindingsEqual,
  loadBindingOverrides,
  saveBindingOverrides,
} from '../content/shortcuts/binding'
import { type ShortcutRow, createShortcutRow } from './shortcut-row'

const shortcutsContainer = document.getElementById('shortcuts')!
const resetAllButton = document.getElementById('reset-all-btn') as HTMLButtonElement
const statusElement = document.getElementById('status')!
const debugToggle = document.getElementById('debug-toggle') as HTMLInputElement

// The row currently capturing key presses, if any. Only one records at a time.
let recordingRow: ShortcutRow | null = null

// Every shortcut row, kept module-wide so changes can be autosaved without
// threading the list through each callback.
let rows: ShortcutRow[] = []

/**
 * Shows a transient status message that clears itself after a few seconds.
 * @returns Nothing
 */
function setStatus(
  /** message - The text to display, or empty to clear. */
  message: string,
): void {
  statusElement.textContent = message
  if (message) {
    setTimeout(() => {
      statusElement.textContent = ''
    }, 3000)
  }
}

/**
 * Persists the current bindings immediately whenever a row changes, storing an
 * override only when it differs from the shortcut's default so defaults stay
 * implicit.
 * @returns Nothing
 */
function autosave(): void {
  const overrides: BindingOverrides = {}
  for (const row of rows) {
    if (!bindingsEqual(row.binding, row.shortcut.defaultBinding)) {
      overrides[row.shortcut.id] = row.binding
    }
  }
  saveBindingOverrides(overrides).then(() => setStatus('Saved!'))
}

/**
 * Begins recording on a row, cancelling any other row that was recording.
 * @returns Nothing
 */
function beginRecording(
  /** row - The row that should capture the next key combination. */
  row: ShortcutRow,
): void {
  if (recordingRow && recordingRow !== row) recordingRow.stopRecording()
  recordingRow = row
  setStatus('')
}

/**
 * Builds and inserts a row for every shortcut, grouped under a heading for
 * each distinct page, in registry order.
 * @returns The created rows
 */
function buildRows(
  /** overrides - The user's persisted binding overrides. */
  overrides: BindingOverrides,
): ShortcutRow[] {
  const rows = shortcuts.map(shortcut =>
    createShortcutRow(shortcut, effectiveBinding(shortcut, overrides), beginRecording, autosave),
  )

  // Collect rows by page, preserving the order each page is first encountered,
  // so every page forms a single contiguous group regardless of registry order.
  const pages: string[] = []
  const rowsByPage = new Map<string, ShortcutRow[]>()
  for (const row of rows) {
    const page = row.shortcut.page
    if (!rowsByPage.has(page)) {
      pages.push(page)
      rowsByPage.set(page, [])
    }
    rowsByPage.get(page)!.push(row)
  }

  const children = pages.map(page => {
    const group = document.createElement('section')
    group.className = 'group'

    const heading = document.createElement('h2')
    heading.className = 'group-heading'
    heading.textContent = page
    group.append(heading, ...rowsByPage.get(page)!.map(row => row.element))
    return group
  })

  shortcutsContainer.replaceChildren(...children)
  return rows
}

/**
 * Resets every option to its default: clears all binding overrides and turns
 * off debug logging. Guarded by a confirmation since it is irreversible.
 * @returns Nothing
 */
async function resetAll(): Promise<void> {
  const confirmed = window.confirm(
    'Reset all options to their defaults? This clears every custom keybinding and cannot be undone.',
  )
  if (!confirmed) return

  for (const row of rows) row.setBinding(row.shortcut.defaultBinding)
  await saveBindingOverrides({})

  debugToggle.checked = false
  await saveDebugEnabled(false)

  setStatus('Reset to defaults.')
}

/**
 * Captures a key combination into the recording row, ignoring lone modifiers.
 * @returns Nothing
 */
function handleRecordingKeydown(
  /** event - The keyboard event to capture. */
  event: KeyboardEvent,
): void {
  if (!recordingRow) return
  if (['Control', 'Meta', 'Alt', 'Shift'].includes(event.key)) return

  // Escape cancels recording, leaving the existing binding untouched.
  if (event.key === 'Escape' && !event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
    event.preventDefault()
    recordingRow.stopRecording()
    recordingRow = null
    return
  }

  event.preventDefault()
  recordingRow.setBinding({
    key: event.key.toLowerCase(),
    ctrlKey: event.ctrlKey,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
  })
  recordingRow = null
  autosave()
  setStatus('')
}

loadBindingOverrides().then(overrides => {
  rows = buildRows(overrides)
  resetAllButton.addEventListener('click', resetAll)
  document.addEventListener('keydown', handleRecordingKeydown)
})

// The debug toggle persists immediately on change, independent of the bindings.
loadDebugEnabled().then(enabled => {
  debugToggle.checked = enabled
})
debugToggle.addEventListener('change', () => {
  saveDebugEnabled(debugToggle.checked)
})
