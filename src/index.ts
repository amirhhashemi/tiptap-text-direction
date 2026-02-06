import {
	type Range,
	Extension,
	combineTransactionSteps,
	getChangedRanges,
	findChildrenInRange,
} from "@tiptap/core";
import { type Transaction, Plugin, PluginKey } from "@tiptap/pm/state";

/**
 * Unicode character ranges commonly associated with RTL scripts.
 *
 * Includes Hebrew, Arabic, Syriac, Thaana, and related presentation forms.
 * Used for content-based direction detection.
 */
const RTL_CHAR_RANGE = "\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC";

/**
 * Unicode character ranges commonly associated with LTR scripts.
 *
 * Includes Latin, extended Latin, and a variety of other non-RTL ranges.
 * Used for content-based direction detection.
 */
const LTR_CHAR_RANGE =
	"A-Za-z\u00C0-\u00D6\u00D8-\u00F6" +
	"\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C" +
	"\uFE00-\uFE6F\uFEFD-\uFFFF";

/**
 * Regex that detects whether a string contains an RTL character before any strong LTR character.
 */
const RTL_REGEX = new RegExp(`^[^${LTR_CHAR_RANGE}]*[${RTL_CHAR_RANGE}]`);

/**
 * Regex that detects whether a string contains an LTR character before any strong RTL character.
 */
const LTR_REGEX = new RegExp(`^[^${RTL_CHAR_RANGE}]*[${LTR_CHAR_RANGE}]`);

/**
 * All supported direction values.
 */
const DIRECTIONS = ["ltr", "rtl", "auto"] as const;

/**
 * Allowed text direction values.
 */
type Direction = (typeof DIRECTIONS)[number];

/**
 * Detect the text direction of a string based on its content.
 *
 * @param text - The text to analyze
 * @returns `"rtl"` if the text starts with a RTL character,
 *          `"ltr"` if the text starts with a LTR character,
 *          `null` if direction cannot be determined (e.g. empty string)
 */
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

/**
 * ProseMirror plugin that automatically applies a `dir` attribute to configured node types when their content changes.
 *
 * @param options - Plugin configuration
 * @param options.types - Node type names that should receive direction updates
 */
function TextDirectionPlugin({ types }: { types: Array<string> }) {
	return new Plugin({
		key: new PluginKey("tiptapTextDirection"),
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
				const nodes = findChildrenInRange(newState.doc, newRange, (node) => {
					return types.includes(node.type.name);
				});

				for (const { node, pos } of nodes) {
					if (node.attrs.dir !== null && node.textContent.length > 0) {
						continue;
					}
					const newTextDirection = getTextDirection(node.textContent);
					if (node.attrs.dir === newTextDirection) {
						continue;
					}

					const marks = tr.storedMarks ?? [];
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
			 * Explicitly set the text direction for matching nodes within a range
			 * or the current selection.
			 *
			 * @param direction - The direction to set: `"ltr"`, `"rtl"`, or `"auto"`
			 * @param position - Optional document position or `{ from, to }` range.
			 * If omitted, the current selection is used.
			 *
			 * @example editor.commands.setTextDirection("rtl")
			 * @example editor.commands.setTextDirection("ltr", { from: 0, to: 10 })
			 */
			setTextDirection: (
				direction: Direction,
				position?: number | Range,
			) => ReturnType;

			/**
			 * Remove the explicit text direction attribute from matching nodes.
			 *
			 * @param position - Optional document position or `{ from, to }` range.
			 * If omitted, the current selection is used.
			 *
			 * @example editor.commands.unsetTextDirection()
			 * @example editor.commands.unsetTextDirection({ from: 0, to: 10 })
			 */
			unsetTextDirection: (position?: number | Range) => ReturnType;
		};
	}
}

/**
 * Configuration options for the TextDirection extension.
 */
export interface TextDirectionOptions {
	/**
	 * Node types that should receive a `dir` attribute.
	 *
	 * Example: `["paragraph", "heading"]`
	 */
	types: Array<string>;

	/**
	 * Default direction inherited from a parent element (e.g. `<html dir="rtl">`).
	 *
	 * When set, matching directions will not be rendered as explicit attributes.
	 */
	defaultDirection: Direction | null;
}

/**
 * Tiptap extension that automatically detects and applies explicit text direction (`dir="ltr"` / `dir="rtl"`) to nodes.
 *
 * Unlike Tiptap’s built-in RTL support, this extension:
 * - Uses JavaScript-based language detection
 * - Avoids `dir="auto"`
 */
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
						parseHTML: (element) => {
							const dir = element.getAttribute("dir");
							if (DIRECTIONS.includes(dir as Direction)) {
								return dir;
							}
							return this.options.defaultDirection;
						},
						renderHTML: (attributes) => {
							if (
								!attributes.dir ||
								attributes.dir === this.options.defaultDirection
							) {
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
			setTextDirection: (direction: Direction, position?: number | Range) => {
				return ({ tr, state, dispatch }) => {
					const { selection } = state;
					let from: number;
					let to: number;

					if (typeof position === "number") {
						from = position;
						to = position;
					} else if (position && "from" in position && "to" in position) {
						from = position.from;
						to = position.to;
					} else {
						from = selection.from;
						to = selection.to;
					}

					if (dispatch) {
						const nodes = findChildrenInRange(tr.doc, { from, to }, (node) => {
							return this.options.types.includes(node.type.name);
						});

						for (const { node, pos } of nodes) {
							tr.setNodeMarkup(pos, undefined, {
								...node.attrs,
								dir: direction,
							});
						}
					}

					return true;
				};
			},

			unsetTextDirection: (position?: number | Range) => {
				return ({ tr, state, dispatch }) => {
					const { selection } = state;
					let from: number;
					let to: number;

					if (typeof position === "number") {
						from = position;
						to = position;
					} else if (position && "from" in position && "to" in position) {
						from = position.from;
						to = position.to;
					} else {
						from = selection.from;
						to = selection.to;
					}

					if (dispatch) {
						const nodes = findChildrenInRange(tr.doc, { from, to }, (node) => {
							return this.options.types.includes(node.type.name);
						});

						for (const { node, pos } of nodes) {
							const newAttrs = { ...node.attrs };
							delete newAttrs.dir;
							tr.setNodeMarkup(pos, undefined, newAttrs);
						}
					}

					return true;
				};
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
