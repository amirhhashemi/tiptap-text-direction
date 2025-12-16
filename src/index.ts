import {
	Extension,
	combineTransactionSteps,
	getChangedRanges,
	findChildrenInRange,
} from "@tiptap/core";
import { type Transaction, Plugin, PluginKey } from "@tiptap/pm/state";

const RTL_CHAR_RANGE = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";
const LTR_CHAR_RANGE =
	"A-Za-z\u00C0-\u00D6\u00D8-\u00F6" +
	"\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C" +
	"\uFE00-\uFE6F\uFEFD-\uFFFF";

const RTL_REGEX = new RegExp(`^[^${LTR_CHAR_RANGE}]*[${RTL_CHAR_RANGE}]`);
const LTR_REGEX = new RegExp(`^[^${RTL_CHAR_RANGE}]*[${LTR_CHAR_RANGE}]`);

const DIRECTIONS = ["ltr", "rtl", "auto"] as const;

type Direction = (typeof DIRECTIONS)[number];

export function getTextDirection(text: string): "ltr" | "rtl" | null {
	if (text.length === 0) {
		return null;
	}
	if (RTL_REGEX.test(text)) {
		return "rtl";
	}
	if (LTR_REGEX.test(text)) {
		return "ltr";
	}
	return null;
}

function TextDirectionPlugin({ types }: { types: Array<string> }) {
	return new Plugin({
		key: new PluginKey("textDirection"),
		appendTransaction: (transactions, oldState, newState) => {
			const docChanges = transactions.some(
				(transaction) => transaction.docChanged,
			);
			if (!docChanges) {
				return;
			}

			let modified = false;
			const { tr } = newState;
			const transform = combineTransactionSteps(
				oldState.doc,
				transactions as Array<Transaction>,
			);
			const changes = getChangedRanges(transform);

			tr.setMeta("addToHistory", false);

			for (const { newRange } of changes) {
				const nodes = findChildrenInRange(newState.doc, newRange, (node) =>
					types.includes(node.type.name),
				);

				for (const { node, pos } of nodes) {
					if (node.attrs.dir !== null && node.textContent.length > 0) {
						return;
					}
					const newTextDirection = getTextDirection(node.textContent);
					if (node.attrs.dir === newTextDirection) {
						return;
					}

					const marks = tr.storedMarks || [];
					tr.setNodeAttribute(pos, "dir", newTextDirection);
					// `tr.setNodeAttribute` resets the stored marks so we'll restore them
					for (const mark of marks) {
						tr.addStoredMark(mark);
					}
					modified = true;
				}
			}

			return modified ? tr : null;
		},
	});
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		textDirection: {
			/**
			 * Set the text direction attribute
			 */
			setTextDirection: (direction: Direction) => ReturnType;
			/**
			 * Unset the text direction attribute
			 */
			unsetTextDirection: () => ReturnType;
		};
	}
}

export interface TextDirectionOptions {
	types: Array<string>;
	defaultDirection: Direction | null;
}

export const TextDirection = Extension.create<TextDirectionOptions>({
	name: "textDirection",

	addOptions() {
		return {
			types: [],
			defaultDirection: null,
		};
	},

	addGlobalAttributes() {
		return [
			{
				types: this.options.types,
				attributes: {
					dir: {
						default: null,
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
				(direction: Direction) =>
				({ commands }) => {
					if (!DIRECTIONS.includes(direction)) {
						return false;
					}

					return this.options.types.every((type) =>
						commands.updateAttributes(type, { dir: direction }),
					);
				},

			unsetTextDirection:
				() =>
				({ commands }) => {
					return this.options.types.every((type) =>
						commands.resetAttributes(type, "dir"),
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
