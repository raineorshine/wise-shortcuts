import { findButton, waitForButton } from '../dom'
import { showToast } from '../toast'
import { primaryModifier } from './binding'
import type { Shortcut } from './shortcut'

// `⌘+C` (`Ctrl+C` off macOS) — Copy the recipient share link of the transfer
// shown on a transaction details page. Wise puts the link behind a two step
// flow: "Share with recipient" opens a popup containing a "Copy link" button
// that writes the URL to the clipboard. The shortcut performs both steps, so
// the popup is left open exactly as if the buttons had been clicked by hand.

const SHARE_LABEL = 'Share with recipient'
const COPY_LINK_LABEL = 'Copy link'

/**
 * Whether the user currently has a non-empty text selection on the page.
 * @returns True when some text is selected
 */
function hasSelection(): boolean {
  const selection = window.getSelection()
  return selection !== null && !selection.isCollapsed && selection.toString() !== ''
}

/**
 * Opens the share popup and clicks its "Copy link" button once it renders,
 * reporting the outcome in a toast.
 * @returns Nothing
 */
async function copyShareLink(
  /** shareButton - The "Share with recipient" button that opens the popup. */
  shareButton: HTMLElement,
): Promise<void> {
  shareButton.click()
  const copyLinkButton = await waitForButton(COPY_LINK_LABEL).catch(() => null)
  if (!copyLinkButton) {
    showToast(`No “${COPY_LINK_LABEL}” button appeared`)
    return
  }
  copyLinkButton.click()
  showToast('Copied share link', 'success')
}

/** The `⌘+C` shortcut: copy the transfer's share link for the recipient. */
const copyShareLinkShortcut: Shortcut = {
  id: 'copy-share-link',
  defaultBinding: primaryModifier('c'),
  label: 'Copy the share link for the recipient',
  description: 'Only when nothing is selected; otherwise the normal copy applies.',
  page: 'Transaction details',
  appliesTo: () => findButton(SHARE_LABEL) !== null,
  run: () => {
    const shareButton = findButton(SHARE_LABEL)
    if (!shareButton) return false
    // Defer to the browser's native copy when text is selected, so a normal copy
    // is never clobbered. Editable fields are already excluded upstream by the
    // dispatcher's isEditing() check.
    if (hasSelection()) return false
    void copyShareLink(shareButton)
    return true
  },
}

export default copyShareLinkShortcut
