import {
  type Binding,
  bindingTokens,
  bindingsEqual,
  disabledBinding,
  isBindingDisabled,
} from '../content/shortcuts/binding'
import type { Shortcut } from '../content/shortcuts/shortcut'
import { attachTooltip } from './tooltip'

/**
 * A single editable shortcut row in the options page: a label, the current
 * binding display, and Reset and Clear controls. Clicking the display starts
 * recording and the next key combination is captured. The row owns its binding
 * and reports recording/change events through callbacks so the page can keep a
 * single active recorder and autosave.
 */
export interface ShortcutRow {
  /** The shortcut this row edits. */
  shortcut: Shortcut
  /** The row's root element to append to the page. */
  element: HTMLElement
  /** The binding currently shown. */
  binding: Binding
  /** Whether this row is currently capturing key presses. */
  recording: boolean
  /** Apply a captured binding, stop recording, and re-render. */
  setBinding(binding: Binding): void
  /** Stop capturing without changing the binding. */
  stopRecording(): void
}

/**
 * Splits a string on backtick-delimited spans, rendering each as a <code>
 * element and the rest as plain text, so descriptions can highlight code.
 * @returns The resulting text and <code> nodes in order
 */
function renderInlineCode(
  /** text - The text to render, with `code` spans delimited by backticks. */
  text: string,
): Node[] {
  return text.split(/`([^`]+)`/).map((part, index) => {
    if (index % 2 === 0) return document.createTextNode(part)
    const code = document.createElement('code')
    code.textContent = part
    return code
  })
}

/**
 * Renders a binding into a container element: empty when the shortcut is
 * disabled, otherwise its keys as <kbd> tokens.
 * @returns Nothing
 */
function renderBinding(
  /** binding - The binding to render. */
  binding: Binding,
  /** container - The element to render the tokens into. */
  container: HTMLElement,
): void {
  if (isBindingDisabled(binding)) {
    container.replaceChildren()
    return
  }
  container.replaceChildren(
    ...bindingTokens(binding).map(token => {
      const kbd = document.createElement('kbd')
      kbd.textContent = token
      return kbd
    }),
  )
}

/**
 * Builds an editable row for a single shortcut.
 * @returns The shortcut row controller
 */
export function createShortcutRow(
  /** shortcut - The shortcut to edit. */
  shortcut: Shortcut,
  /** initialBinding - The binding to display before any edits. */
  initialBinding: Binding,
  /** onRecordStart - Called with this row when it begins recording. */
  onRecordStart: (row: ShortcutRow) => void,
  /** onBindingChange - Called when this row's binding is reset or recorded. */
  onBindingChange: () => void,
): ShortcutRow {
  const element = document.createElement('div')
  element.className = 'shortcut'

  const label = document.createElement('div')
  label.className = 'shortcut-label'
  label.textContent = shortcut.label

  const display = document.createElement('button')
  display.type = 'button'
  display.className = 'shortcut-display'
  display.title = 'Click, then press the new keys'

  const clearButton = document.createElement('button')
  clearButton.className = 'btn btn-secondary'
  clearButton.textContent = 'Clear'
  attachTooltip(clearButton, 'Disable this shortcut')

  const resetButton = document.createElement('button')
  resetButton.className = 'btn btn-danger'
  resetButton.textContent = 'Reset'
  attachTooltip(resetButton, `Reset to default: ${bindingTokens(shortcut.defaultBinding).join(' ')}`)

  const controls = document.createElement('div')
  controls.className = 'shortcut-row'
  controls.append(display, resetButton, clearButton)
  element.append(label)
  if (shortcut.description) {
    const description = document.createElement('div')
    description.className = 'shortcut-description'
    description.append(...renderInlineCode(shortcut.description))
    element.append(description)
  }
  element.append(controls)

  const row: ShortcutRow = {
    shortcut,
    element,
    binding: initialBinding,
    recording: false,
    setBinding(binding: Binding) {
      this.binding = binding
      this.stopRecording()
    },
    stopRecording() {
      this.recording = false
      display.classList.remove('recording')
      renderBinding(this.binding, display)
      clearButton.disabled = isBindingDisabled(this.binding)
      resetButton.disabled = bindingsEqual(this.binding, shortcut.defaultBinding)
    },
  }

  display.addEventListener('click', () => {
    if (row.recording) {
      row.stopRecording()
      return
    }
    row.recording = true
    display.classList.add('recording')
    display.replaceChildren()
    const prompt = document.createElement('span')
    prompt.className = 'shortcut-prompt'
    prompt.textContent = 'Press keys…'
    display.append(prompt)
    onRecordStart(row)
  })

  clearButton.addEventListener('click', () => {
    row.setBinding(disabledBinding())
    onBindingChange()
  })

  resetButton.addEventListener('click', () => {
    row.setBinding(shortcut.defaultBinding)
    onBindingChange()
  })

  renderBinding(initialBinding, display)
  clearButton.disabled = isBindingDisabled(initialBinding)
  resetButton.disabled = bindingsEqual(initialBinding, shortcut.defaultBinding)
  return row
}
