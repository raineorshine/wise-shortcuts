import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

/**
 * Converts a slug string into a title-cased string.
 * @returns The title-cased string
 */
function toTitleCase(
  /** slug - The hyphen-separated slug to convert */
  slug: string,
): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Removes the "A Chrome extension that" prefix from a description and
 * capitalizes the remaining sentence.
 * @returns The description without the boilerplate prefix
 */
function stripExtensionPrefix(
  /** description - The full package description */
  description: string,
): string {
  const stripped = description.replace(/^A Chrome extension that /i, '')
  return stripped.charAt(0).toUpperCase() + stripped.slice(1)
}

export default defineManifest({
  manifest_version: 3,
  name: toTitleCase(pkg.name),
  description: stripExtensionPrefix(pkg.description),
  version: pkg.version,
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: true,
  },
  permissions: ['storage'],
  content_scripts: [
    {
      js: ['src/content/main.ts'],
      // Match all of Wise, not just the pages shortcuts apply to: Wise is a
      // single-page app that swaps the page contents on navigation without
      // reloading the document, and Chrome does not re-inject content scripts on
      // such navigations. Loading on the first Wise page attaches our
      // document-level listeners once; they then survive navigation into the
      // transaction pages. Behaviour is gated at runtime by each shortcut's
      // appliesTo(), so loading everywhere is harmless.
      matches: ['https://wise.com/*', 'https://*.wise.com/*'],
    },
  ],
})
