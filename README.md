This extension adds the `dir` attribute to a configurable list of nodes. The direction (`ltr` or `rtl`) is automatically detected based on the node's content.

## Installation

```bash
# npm
npm install tiptap-text-direction

# yarn
npm add tiptap-text-direction

# pnpm
pnpm install tiptap-text-direction
```

## Usage

In this example, I used React but it works with any framework that Tiptap supports.

```tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextDirection from "tiptap-text-direction";

const Tiptap = () => {
  const editor = useEditor({
    extensions: [StarterKit, TextDirection],
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

In this example the `defaultDirection` is set to `rtl` so the extension didn't add `dir="rtl"` to `RTL` nodes. If you want to always have the `dir` attribute, set `defaultDirection` to `""`.

```html
<p dir="ltr">Hello</p>
<p>سلام hello</p>
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

## Settings

### types

A list of nodes where the `dir` attribute should be added to.

Default: `[]`

```javascript
TextDirection.configure({
  types: ["heading", "paragraph"],
});
```

### directions

A list of available options for the 'dir' attribute.

Default: `["ltr", "rtl", "auto"]`

```javascript
TextDirection.configure({
  directions: ["ltr", "rtl"],
});
```

### defaultDirection

The default direction. The `dir` attribute won't be added to the nodes that have the same direction as the `defaultDirection`

Default: `ltr`

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

Set the text direction of the selected nodes to the `defaultDirection`.

```javascript
editor.commands.unsetTextDirection();
```
