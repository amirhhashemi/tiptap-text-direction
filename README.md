> [!IMPORTANT]  
> TipTap now includes [built-in support for RTL content](https://tiptap.dev/docs/examples/basics/text-direction). This library will no longer be maintained, and I encourage everyone to use the built-in feature.


This extension automatically detects the direction of a configurable list of nodes and adds `dir="ltr"` or `dir="rtl"` to them.

**Why not `dir="auto"`?**

`dir="auto"` changes the text direction based on the element's content too, so why not use that?

1. It doesn't give you granular control over the direction. For example, if you want to have different styles based on the direction you can't do that with `dir="auto"`. There is `:dir()` pseudo-class that can help you in this situation but it's only supported in Firefox.

2. You can't override it. `dir="auto"` uses the first character of the element to determine the direction and you can't change it unless you explicitly set the direction with `dir="ltr|rtl"`.

## Installation

```bash
# npm
npm install tiptap-text-direction

# yarn
yarn add tiptap-text-direction

# pnpm
pnpm install tiptap-text-direction
```

## Usage

In this example I used React but it works with any framework that Tiptap supports.

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

You might also want to change the text alignment based on the `dir` attribute:

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

### Demo

https://user-images.githubusercontent.com/87268103/178113964-db7e21e4-05d9-4339-9efc-84421c0b3b3f.mp4

### HTML Output

In this example the `defaultDirection` is set to `rtl` (also a parent element has `dir="rtl"`, in this case the `<html>` tag) so the extension didn't add `dir="rtl"` to RTL nodes.

```html
<p dir="ltr">Hello</p>
<p dir="ltr">سلام hello</p>
<!-- This was `rtl` by default but we forced it be `ltr` -->
<ul>
  <li>
    <p dir="ltr">hello</p>
  </li>
  <li>
    <p>سلام</p>
  </li>
  <li>
    <p dir="ltr">sghl</p>
  </li>
</ul>
<h2>سلام</h2>
<h2 dir="ltr">hello</h2>
```

## Options

### types

A list of nodes where the `dir` attribute should be added to.

Default: `[]`

```javascript
TextDirection.configure({
  types: ["heading", "paragraph"],
});
```

### defaultDirection

In case you have set the text direction in a parent element of the editor (most likely the `<html>` element), you can set `defaultDirection` to avoid adding the `dir` attribute to elements that have the same direction as the `defaultDirection` because it's not needed. It can reduce the HTML output's size.

Default: `null`

```javascript
TextDirection.configure({
  defaultDirection: "rtl",
});
```

## Commands

### setTextDirection()

Set the text direction of the selected nodes to the specified value.

```javascript
editor.commands.setTextDirection("rtl");
```

### unsetTextDirection()

Unset the text direction back to the `defaultDirection`.

```javascript
editor.commands.unsetTextDirection();
```

## Keyboard shortcuts

| Command                 | Windows/Linux        | macOS               |
| ----------------------- | -------------------- | ------------------- |
| setTextDirection("ltr") | `Ctrl` + `Alt` + `l` | `Cmd` + `Alt` + `l` |
| setTextDirection("rtl") | `Ctrl` + `Alt` + `r` | `Cmd` + `Alt` + `r` |
