import type { Binding } from './binding'

/**
 * A Wise page shortcut: a configurable key binding together with the page it
 * applies to and the action it performs.
 */
export interface Shortcut {
  /** A stable identifier used to persist this shortcut's binding override. */
  id: string
  /** The binding used when the user has not chosen a custom one. */
  defaultBinding: Binding
  /** The human-readable description shown in the options UI. */
  label: string
  /**
   * Optional extra note shown beneath the label in the options UI, e.g. a
   * caveat about when the shortcut defers to the browser.
   */
  description?: string
  /**
   * The human-readable page the shortcut applies to (e.g. "Transaction
   * details"), used to group shortcuts in the options UI.
   */
  page: string
  /**
   * When true, the shortcut still fires while the user is typing in an input,
   * textarea, or contenteditable element. Use only for shortcuts whose target
   * UI takes focus into an editor.
   */
  runsWhileEditing?: boolean
  /**
   * Whether the shortcut is relevant to the current page.
   * @returns True when the shortcut should be active
   */
  appliesTo(): boolean
  /**
   * Performs the shortcut's action for a matching keydown.
   * @returns True when the event was handled and its default and propagation
   * should be suppressed; false to let the event continue to other handlers
   */
  run(event: KeyboardEvent): boolean
}
