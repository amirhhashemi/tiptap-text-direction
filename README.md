This extension automatically detects text direction (LTR / RTL) for configurable Tiptap node types and applies the appropriate `dir="ltr"` or `dir="rtl"` attribute.
It is useful when working with mixed-direction content (e.g. English + Arabic/Persian/Hebrew) and when you need **explicit, overridable direction control** at the node level.
It is compatible with Tiptap v2 and v3.

> [!NOTE]
> 
> **Differences with the built-in feature**
> 
> TipTap has recently added [built-in support](https://tiptap.dev/docs/examples/basics/text-direction) for RTL text.
> However, this feature relies on using `dir="auto"` for automatic direction detection. 
>
> In contrast, this extension detects the language using JavaScript and explicitly sets the direction to either `dir="ltr"` or `dir="rtl"`. 
>
> This approach has two main advantages:
>
> 1. It provides clearer information about the actual direction of the text nodes, especially when saving documents on the server.
>    The `dir="auto"` option can be ambiguous and depends on the browser's interpretation.
> 2. It allows for more granular control when applying styles.
>    For instance, you can target elements based on their text direction, which is not possible with `dir="auto"`.
>
> That said, the built-in feature is a perfectly acceptable option if you don't need these specific functionalities.


## Installation

```bash
# pnpm
pnpm install tiptap-text-direction

# npm
npm install tiptap-text-direction

# bun
bun install tiptap-text-direction

# yarn
yarn add tiptap-text-direction
```

## Usage

Below is a React example, but the extension works with any framework supported by Tiptap.

```tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextDirection from "tiptap-text-direction";

const Tiptap = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextDirection.configure({
        types: ["heading", "paragraph"],
      }),
    ],
  });

  return <EditorContent editor={editor} />;
};
```

## Styling based on direction

Since direction is explicitly set, you can easily style content using attribute selectors:

```css
.ProseMirror p[dir="rtl"],
.ProseMirror h1[dir="rtl"],
.ProseMirror h2[dir="rtl"],
.ProseMirror h3[dir="rtl"],
.ProseMirror h4[dir="rtl"],
.ProseMirror h5[dir="rtl"],
.ProseMirror h6[dir="rtl"] {
text-align: right;
}


.ProseMirror p[dir="ltr"],
.ProseMirror h1[dir="ltr"],
.ProseMirror h2[dir="ltr"],
.ProseMirror h3[dir="ltr"],
.ProseMirror h4[dir="ltr"],
.ProseMirror h5[dir="ltr"],
.ProseMirror h6[dir="ltr"] {
text-align: left;
}
```

## Options

### `types`

A list of node types that should receive the `dir` attribute.

**Default:** `[]`

```ts
TextDirection.configure({
  types: ["heading", "paragraph"],
});
```

### `defaultDirection`

If the editor is inside a parent element with a known direction (commonly `<html dir="rtl">` or `<html dir="ltr">`), you can set `defaultDirection` to avoid adding redundant dir attributes.

This helps keep the generated HTML smaller and cleaner.

**Default:** `null`

```ts
TextDirection.configure({
  defaultDirection: "rtl",
});
```

## Commands

### `setTextDirection(direction)`

Explicitly set the text direction of the currently selected nodes.

```ts
editor.commands.setTextDirection("rtl");
```

### `unsetTextDirection()`

Remove the explicit direction and revert back to `defaultDirection`.

```ts
editor.commands.unsetTextDirection();
```

## Keyboard shortcuts

| Command                 | Windows/Linux        | macOS               |
| ----------------------- | -------------------- | ------------------- |
| setTextDirection("ltr") | `Ctrl` + `Alt` + `l` | `Cmd` + `Alt` + `l` |
| setTextDirection("rtl") | `Ctrl` + `Alt` + `r` | `Cmd` + `Alt` + `r` |

## Notes

- Direction detection is based on content-based, but the resulting `dir` value is explicit and stable.
- Manual overrides always take precedence over auto-detection.
- This extension is safe to use with server-side rendering.
