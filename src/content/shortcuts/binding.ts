// A key binding: the physical key plus the modifier state that triggers a
// shortcut. Bindings are configurable and persisted per shortcut id in
// chrome.storage.sync, so the active binding may differ from a shortcut's
// default.

/** A keyboard binding: a produced key character together with its required modifier state. */
export interface Binding {
  /**
   * The KeyboardEvent.key that activates the binding, stored lowercased (e.g.
   * "c", "escape"). Matching on the produced character rather than the physical
   * KeyboardEvent.code keeps shortcuts correct under non-QWERTY layouts such as
   * Colemak, where the key that types "c" sits at a different physical position.
   */
  key: string
  /** Whether the Control key must be held. */
  ctrlKey: boolean
  /** Whether the Meta (⌘) key must be held. */
  metaKey: boolean
  /** Whether the Shift key must be held. */
  shiftKey: boolean
  /** Whether the Alt key must be held. */
  altKey: boolean
}

/** The storage key under which binding overrides are persisted. */
const STORAGE_KEY = 'bindings'

/** A map of shortcut id to the binding the user has chosen for it. */
export type BindingOverrides = Record<string, Binding>

/**
 * Whether the platform is macOS, used to choose modifier symbols and defaults.
 * @returns True when running on a Mac
 */
export function isMac(): boolean {
  return navigator.platform.includes('Mac') || navigator.userAgent.includes('Mac')
}

/**
 * Builds a binding that can never match a keyboard event, used to disable a
 * shortcut. Its key is the empty string, which no KeyboardEvent.key produces.
 * @returns A binding that matches nothing
 */
export function disabledBinding(): Binding {
  return { key: '', ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }
}

/**
 * Whether a binding is the disabled placeholder, i.e. one that can never match.
 * @returns True when the binding has no key and so matches nothing
 */
export function isBindingDisabled(
  /** binding - The binding to test. */
  binding: Binding,
): boolean {
  return binding.key === ''
}

/**
 * Builds a binding using the platform's primary modifier (⌘ on Mac, Ctrl
 * elsewhere), optionally combined with Shift.
 * @returns The binding for the key with the platform modifier held
 */
export function primaryModifier(
  /** key - The KeyboardEvent.key character, e.g. "c". */
  key: string,
  /** options - Whether Shift is also required. */
  options: { shiftKey?: boolean } = {},
): Binding {
  const mac = isMac()
  return { key, ctrlKey: !mac, metaKey: mac, shiftKey: options.shiftKey ?? false, altKey: false }
}

/**
 * The layout-independent KeyboardEvent.code for a bound key character, when one
 * exists. Used as a fallback for matching because holding Option/Alt on macOS
 * transforms the produced character (e.g. Option+Shift+M yields "Â"), so
 * event.key can no longer be compared against the bound key directly.
 * @returns The physical code (e.g. "KeyM", "Digit5"), or null when there is none
 */
function physicalCodeForKey(
  /** key - The bound key character, e.g. "m" or "5". */
  key: string,
): string | null {
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  return null
}

/**
 * Whether an event produces a binding's key, comparing the produced character
 * case-insensitively. When Option/Alt is held — which on macOS transforms the
 * produced character — it also accepts a match on the layout-independent
 * physical code, so e.g. Option+Shift+M ("Â") still matches a binding for "m".
 * @returns True when the event's key corresponds to the binding's key
 */
function keyMatches(
  /** event - The keyboard event to test. */
  event: KeyboardEvent,
  /** key - The binding's key character. */
  key: string,
): boolean {
  if (event.key.toLowerCase() === key.toLowerCase()) return true
  if (!event.altKey) return false
  const code = physicalCodeForKey(key)
  return code !== null && event.code === code
}

/**
 * Whether a keyboard event matches a binding exactly, comparing the produced
 * key character (case-insensitively) and the full modifier state.
 * @returns True when the event's key and modifier state equal the binding
 */
export function matchesBinding(
  /** event - The keyboard event to test. */
  event: KeyboardEvent,
  /** binding - The binding to match against. */
  binding: Binding,
): boolean {
  return (
    keyMatches(event, binding.key) &&
    event.ctrlKey === binding.ctrlKey &&
    event.metaKey === binding.metaKey &&
    event.shiftKey === binding.shiftKey &&
    event.altKey === binding.altKey
  )
}

/**
 * Whether two bindings are identical in key and all modifiers.
 * @returns True when the bindings match exactly
 */
export function bindingsEqual(
  /** a - The first binding. */
  a: Binding,
  /** b - The second binding. */
  b: Binding,
): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    a.ctrlKey === b.ctrlKey &&
    a.metaKey === b.metaKey &&
    a.shiftKey === b.shiftKey &&
    a.altKey === b.altKey
  )
}

/**
 * Loads the user's binding overrides from sync storage.
 * @returns The stored overrides, or an empty map when none are saved
 */
export async function loadBindingOverrides(): Promise<BindingOverrides> {
  return new Promise(resolve => {
    chrome.storage.sync.get(STORAGE_KEY, result => {
      resolve((result[STORAGE_KEY] as BindingOverrides) ?? {})
    })
  })
}

/**
 * Persists the user's binding overrides to sync storage.
 * @returns Nothing
 */
export async function saveBindingOverrides(
  /** overrides - The full map of shortcut id to chosen binding. */
  overrides: BindingOverrides,
): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.sync.set({ [STORAGE_KEY]: overrides }, resolve)
  })
}

/**
 * Subscribes to changes in the stored binding overrides.
 * @returns Nothing
 */
export function onBindingOverridesChanged(
  /** callback - Invoked with the new overrides whenever they change. */
  callback: (overrides: BindingOverrides) => void,
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[STORAGE_KEY]) {
      callback((changes[STORAGE_KEY].newValue as BindingOverrides) ?? {})
    }
  })
}

/**
 * The human-readable label for a single key character, e.g. "C" or "Esc".
 * @returns The display label for the key
 */
function keyLabel(
  /** key - The KeyboardEvent.key character to label, lowercased. */
  key: string,
): string {
  const map: Record<string, string> = {
    ' ': 'Space',
    enter: '↵',
    backspace: '⌫',
    tab: '⇥',
    arrowup: '↑',
    arrowdown: '↓',
    arrowleft: '←',
    arrowright: '→',
    escape: 'Esc',
    delete: 'Del',
    home: 'Home',
    end: 'End',
    pageup: 'PgUp',
    pagedown: 'PgDn',
  }
  if (map[key]) return map[key]
  return key.length === 1 ? key.toUpperCase() : key
}

/**
 * The ordered display tokens of a binding, e.g. ["⌘", "⇧", "C"] on Mac or
 * ["Ctrl", "Shift", "C"] elsewhere. Modifiers come first, then the key.
 * @returns The list of tokens to render, one per key
 */
export function bindingTokens(
  /** binding - The binding to tokenize. */
  binding: Binding,
): string[] {
  const tokens: string[] = []
  if (isMac()) {
    if (binding.ctrlKey) tokens.push('⌃')
    if (binding.altKey) tokens.push('⌥')
    if (binding.shiftKey) tokens.push('⇧')
    if (binding.metaKey) tokens.push('⌘')
  } else {
    if (binding.ctrlKey) tokens.push('Ctrl')
    if (binding.altKey) tokens.push('Alt')
    if (binding.shiftKey) tokens.push('Shift')
    if (binding.metaKey) tokens.push('Meta')
  }
  tokens.push(keyLabel(binding.key))
  return tokens
}
