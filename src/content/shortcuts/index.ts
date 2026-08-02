import type { Binding, BindingOverrides } from './binding'
import copyShareLinkShortcut from './copy-share-link'
import type { Shortcut } from './shortcut'

export type { Shortcut } from './shortcut'

// Every keyboard shortcut this extension adds. Each lives in its own module and
// declares the page it applies to plus the action it performs.
export const shortcuts: Shortcut[] = [copyShareLinkShortcut]

/**
 * The binding in effect for a shortcut: the user's override if set, otherwise
 * the shortcut's default.
 * @returns The active binding for the shortcut
 */
export function effectiveBinding(
  /** shortcut - The shortcut to resolve a binding for. */
  shortcut: Shortcut,
  /** overrides - The user's persisted binding overrides. */
  overrides: BindingOverrides,
): Binding {
  return overrides[shortcut.id] ?? shortcut.defaultBinding
}
