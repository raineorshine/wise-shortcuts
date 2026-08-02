# wise-shortcuts

A Chrome extension that adds keyboard shortcuts to Wise.

## What it does

This extension adds keyboard shortcuts across the Wise money transfer flow so you can keep your hands off the mouse.

### Transaction details

| Shortcut                  | Action                                                                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| <kbd>⌘</kbd>+<kbd>c</kbd> | Copy the transfer's share link for the recipient: clicks **Share with recipient**, waits for the popup, then clicks **Copy Link**. |

Off macOS the default binding is <kbd>Ctrl</kbd>+<kbd>c</kbd>.

The shortcut is ignored while typing in an input, textarea, or other editable field, and defers to the browser's normal copy when text is selected. It does nothing on pages without a **Share with recipient** button. A toast reports the outcome.

## Customizing shortcuts

Every shortcut is rebindable. Open the extension's **Options** page (right-click the extension icon → Options, or via `chrome://extensions`), click the current binding, then press the key combination you want; it saves immediately. Use **Reset** to restore a shortcut's default and **Clear** to disable it. Custom bindings sync across your signed-in Chrome profiles.

## Local Development

```sh
npm run dev
```

Load the `dist/` folder as an unpacked extension in `chrome://extensions`. Do not run `npm run build` or it will overwrite the dev manifest.

## Build & Release

This _will_ overwrite the `dist/` manifest, so you'll need to restart the dev server after building.

```sh
npm run build
```
