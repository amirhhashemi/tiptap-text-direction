import { Extension, findChildren } from "@tiptap/core";
import { Plugin, PluginKey, Transaction } from "@tiptap/pm/state";

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
    appendTransaction: (transactions, _oldState, newState) => {
      const tr: Transaction = newState.tr;
      let modified = false;

      if (transactions.some((transaction) => transaction.docChanged)) {
        const nodes = findChildren(newState.doc, (node) => {
          return types.includes(node.type.name);
        });
        nodes.forEach((block) => {
          const { node, pos } = block;
          const { attrs, textContent } = node;
          // don't change the `dir` if it already has one
          if (attrs.dir && textContent.length !== 0) {
            return;
          }
          const dir = getTextDirection(textContent);
          tr.setNodeAttribute(pos, "dir", dir);
          modified = true;
        });
      }

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
      directions: ["ltr", "rtl", "auto"],
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

  addProseMirrorPlugins() {
    return [
      TextDirectionPlugin({
        types: this.options.types,
      }),
    ];
  },
});

export default TextDirection;
