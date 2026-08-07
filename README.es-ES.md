

Esta extensión detecta automáticamente la dirección del texto (LTR / RTL) para tipos de nodos de Tiptap configurables y aplica el atributo correspondiente `dir="ltr"` o `dir="rtl"`.
Es útil al trabajar con contenido de dirección mixta (p. ej. inglés + árabe/persa/hebreo) y cuando necesitas **control explícito y sobrescribible de la dirección** a nivel de nodo.
Es compatible con Tiptap v2 y v3.

> [!NOTE]
>
> **Diferencias con la función incorporada**
>
> TipTap ha agregado recientemente [soporte incorporado](https://tiptap.dev/docs/examples/basics/text-direction) para texto RTL.
> Sin embargo, esta función se basa en el uso de `dir="auto"` para la detección automática de dirección.
>
> En cambio, esta extensión detecta el idioma mediante JavaScript y establece explícitamente la dirección como `dir="ltr"` o `dir="rtl"`.
>
> Este enfoque tiene dos ventajas principales:
>
> 1. Proporciona información más clara sobre la dirección real de los nodos de texto, especialmente al guardar documentos en el servidor.
>    La opción `dir="auto"` puede ser ambigua y depende de la interpretación del navegador.
> 2. Permite un control más granular al aplicar estilos.
>    Por ejemplo, puedes dirigirte a elementos basándote en su dirección de texto, lo cual no es posible con `dir="auto"`.
>
> Dicho esto, la función incorporada es una opción perfectamente válida si no necesitas estas funcionalidades específicas.

## Instalación

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

## Uso

A continuación se muestra un ejemplo con React, pero la extensión funciona con cualquier framework compatible con Tiptap.

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

## Estilos basados en la dirección

Dado que la dirección se establece explícitamente, puedes aplicar estilos al contenido fácilmente usando selectores de atributo:

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

## Opciones

### `types`

Una lista de tipos de nodos que deben recibir el atributo `dir`.

**Valor predeterminado:** `[]`

```ts
TextDirection.configure({
	types: ["heading", "paragraph"],
});
```

### `defaultDirection`

Si el editor se encuentra dentro de un elemento padre con una dirección conocida (comúnmente `<html dir="rtl">` o `<html dir="ltr">`), puedes configurar `defaultDirection` para evitar agregar atributos dir redundantes.

Esto ayuda a mantener el HTML generado más pequeño y limpio.

**Valor predeterminado:** `null`

```ts
TextDirection.configure({
	defaultDirection: "rtl",
});
```

## Comandos

### `setTextDirection(direction, position?)`

Establece explícitamente la dirección del texto de los nodos coincidentes dentro de un rango o la selección actual.

```ts
// Aplicar a la selección actual
editor.commands.setTextDirection("rtl");

// Aplicar a un rango específico
editor.commands.setTextDirection("ltr", { from: 0, to: 10 });

// Aplicar en una posición específica del documento
editor.commands.setTextDirection("rtl", 42);
```

### `unsetTextDirection(position?)`

Elimina el atributo explícito de dirección de texto de los nodos coincidentes y restaura `defaultDirection`.

```ts
// Eliminar de la selección actual
editor.commands.unsetTextDirection();

// Eliminar de un rango específico
editor.commands.unsetTextDirection({ from: 0, to: 10 });

// Eliminar en una posición específica del documento
editor.commands.unsetTextDirection(42);
```

## Atajos de teclado

| Comando                 | Windows/Linux        | macOS               |
| ----------------------- | -------------------- | ------------------- |
| setTextDirection("ltr") | `Ctrl` + `Alt` + `l` | `Cmd` + `Alt` + `l` |
| setTextDirection("rtl") | `Ctrl` + `Alt` + `r` | `Cmd` + `Alt` + `r` |

## Notas

- La detección de dirección se basa en el contenido, pero el valor `dir` resultante es explícito y estable.
- Las anulaciones manuales siempre tienen prioridad sobre la detección automática.
- Esta extensión es segura para usar con renderizado del lado del servidor (SSR).
