import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const RTL = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
const LTR =
  "A-Za-z\u00C0-\u00D6\u00D8-\u00F6" +
  "\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C" +
  "\uFE00-\uFE6F\uFEFD-\uFFFF";

export const RTL_REGEX = new RegExp("^[^" + LTR + "]*[" + RTL + "]");
export const LTR_REGEX = new RegExp("^[^" + RTL + "]*[" + LTR + "]");

type Direction = "ltr" | "rtl";

// Source: https://github.com/facebook/lexical/blob/429e3eb5b5a244026fa4776650aabe3c8e17536b/packages/lexical/src/LexicalUtils.ts#L163
export function getTextDirection(text: string): Direction | null {
  if (RTL_REGEX.test(text)) {
    return "rtl";
  }
  if (LTR_REGEX.test(text)) {
    return "ltr";
  }
  return null;
}

function TextDirectionPlugin({ types }: { types: string[] }) {
  return new Plugin({
    key: new PluginKey("textDirection"),
    appendTransaction: (transactions, oldState, newState) => {
      const docChanges =
        transactions.some((transaction) => transaction.docChanged) &&
        !oldState.doc.eq(newState.doc);

      if (!docChanges) {
        return;
      }

      let modified = false;
      const tr = newState.tr;
      const isPaste = transactions[0]?.getMeta("uiEvent");

      newState.doc.descendants((node, pos) => {
        if (types.includes(node.type.name)) {
          if (
            node.attrs.dir !== null &&
            node.textContent.length > 0 &&
            !isPaste
          ) {
            return;
          }
          tr.setNodeAttribute(pos, "dir", getTextDirection(node.textContent));
          modified = true;
        }
      });

      return modified ? tr : null;
    },
  });
}

export interface TextDirectionOptions {
  types: string[];
  directions: string[];
  defaultDirection: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textDirection: {
      /**
       * Set the text direction attribute
       */
      setTextDirection: (direction: string) => ReturnType;
      /**
       * Unset the text direction attribute
       */
      unsetTextDirection: () => ReturnType;
    };
  }
}

export const TextDirection = Extension.create<TextDirectionOptions>({
  name: "textDirection",

  addOptions() {
    return {
      types: [],
      directions: ["ltr", "rtl"],
      defaultDirection: "ltr",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dir: {
            default: this.options.defaultDirection,
            parseHTML: (element) =>
              element.dir || this.options.defaultDirection,
            renderHTML: (attributes) => {
              if (attributes.dir === this.options.defaultDirection) {
                return {};
              }
              return { dir: attributes.dir };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setTextDirection:
        (direction) =>
        ({ commands }) => {
          if (!this.options.directions.includes(direction)) {
            return false;
          }

          return this.options.types.every((type) =>
            commands.updateAttributes(type, { dir: direction })
          );
        },

      unsetTextDirection:
        () =>
        ({ commands }) => {
          return this.options.types.every((type) =>
            commands.resetAttributes(type, "dir")
          );
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-l": () => this.editor.commands.setTextDirection("ltr"),
      "Mod-Alt-r": () => this.editor.commands.setTextDirection("rtl"),
    };
  },

  addProseMirrorPlugins() {
    return [
      TextDirectionPlugin({
        types: this.options.types,
      }),
    ];
  },
});

export default TextDirection;
