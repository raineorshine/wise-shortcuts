// A debug logging flag, persisted in chrome.storage.sync and toggleable from
// the options page. When disabled (the default), log() is a no-op so the
// extension stays silent in the page console.

/** The storage key under which the debug flag is persisted. */
const STORAGE_KEY = 'debug'

/** The prefix prepended to every debug log line. */
const LOG_PREFIX = '[wise-shortcuts]'

// The in-memory flag, kept in sync with storage so log() can stay synchronous.
let debugEnabled = false

/**
 * Sets the in-memory debug flag.
 * @returns Nothing
 */
export function setDebugEnabled(
  /** enabled - Whether debug logging is on. */
  enabled: boolean,
): void {
  debugEnabled = enabled
}

/**
 * Logs to the console when debug logging is enabled; otherwise does nothing.
 * @returns Nothing
 */
export function log(
  /** args - The values to log. */
  ...args: unknown[]
): void {
  if (debugEnabled) console.log(LOG_PREFIX, ...args)
}

/**
 * Loads the persisted debug flag from sync storage.
 * @returns Whether debug logging is enabled
 */
export async function loadDebugEnabled(): Promise<boolean> {
  return new Promise(resolve => {
    chrome.storage.sync.get(STORAGE_KEY, result => {
      resolve((result[STORAGE_KEY] as boolean) ?? false)
    })
  })
}

/**
 * Persists the debug flag to sync storage.
 * @returns Nothing
 */
export async function saveDebugEnabled(
  /** enabled - Whether debug logging should be on. */
  enabled: boolean,
): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.sync.set({ [STORAGE_KEY]: enabled }, resolve)
  })
}

/**
 * Subscribes to changes in the persisted debug flag.
 * @returns Nothing
 */
export function onDebugEnabledChanged(
  /** callback - Invoked with the new flag value whenever it changes. */
  callback: (enabled: boolean) => void,
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[STORAGE_KEY]) {
      callback((changes[STORAGE_KEY].newValue as boolean) ?? false)
    }
  })
}
