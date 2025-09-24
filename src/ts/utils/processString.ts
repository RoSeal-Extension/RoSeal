// From: https://github.com/spinthil/react-process-string-ts/blob/main/src/index.ts
// Modified for allowing options to be passed to the processed string function

import { cloneElement } from "preact";
import type { JSX } from "preact";

export type ProcessStringOption<T> = {
	regex: RegExp;
	fn: (key: number, result: RegExpExecArray, data?: T) => string | JSX.Element;
};

/**
 * This function allows to process strings with regular expressions in React.
 * @param options An array of ProcessStringOptions, each containing a regex and a replacement function fn.
 * @returns A function that takes an input text (string or JSX elements) and returns the text processed according to the given options.
 */
export default function processString<T>(
	options: ProcessStringOption<T>[],
): (
	input: string | JSX.Element | (string | JSX.Element)[],
	data?: T,
) => string | JSX.Element | (string | JSX.Element)[] {
	let key = 0;

	function processInputWithRegex(
		option: ProcessStringOption<T>,
		input: string | JSX.Element | (string | JSX.Element)[],
		data?: T,
	): string | JSX.Element | (string | JSX.Element)[] {
		if (!option.fn || typeof option.fn !== "function") return input;
		if (!option.regex) return input;
		if (Array.isArray(input)) {
			return input.flatMap((chunk: string | JSX.Element) =>
				processInputWithRegex(option, chunk, data),
			);
		}
		if (typeof input === "string") {
			const regex = option.regex;
			let result = null;
			const output: (string | JSX.Element)[] = [];
			// biome-ignore lint/suspicious/noAssignInExpressions: Fine
			while ((result = regex.exec(input)) !== null) {
				const index = result.index;
				const match = result[0];
				output.push(input.substring(0, index));
				output.push(option.fn(++key, result, data));
				// biome-ignore lint/style/noParameterAssign: fine
				input = input.substring(index + match.length, input.length + 1);
				regex.lastIndex = 0;
			}
			output.push(input);

			return output;
		}
		if (typeof input === "object") {
			// In this case, input is a JSX.Element.
			const content = input.props.children;
			// In case the element has children, we process them.
			if (content !== undefined) {
				const processedContent = processInputWithRegex(option, content, data);
				return cloneElement(input, { ...input.props, children: processedContent });
			}
		}

		return input;
	}
	return (
		input: string | JSX.Element | (string | JSX.Element)[],
		data?: T,
	): string | JSX.Element | (string | JSX.Element)[] => {
		if (!options || !Array.isArray(options) || !options.length) return input;

		for (const option of options) {
			// biome-ignore lint/style/noParameterAssign: fine
			input = processInputWithRegex(option, input, data);
		}

		return input;
	};
}

/*
import processString from "react-process-string";
type Formatter = {
    (contents: string, attributes: Record<string, string>): any;
};
const processor = processString([
    {
        regex: /<(\w+)([^>]*)>(.*?)<\/\1>/g,
        fn: (_, [match, tag, attrs, contents], formatters: Record<string, Formatter>) => {
            const formatter = formatters[tag];
            if (formatter) {
                const attributes = attrs.match(/([\w-]+)="([^"]+)"/g)?.reduce(
                    (acc: Record<string, string>, attr: string) => {
                        const [_, key, value] = attr.match(/([\w-]+)="([^"]+)"/)!;
                        acc[key] = value;
                        return acc;
                    },
                    {} as Record<string, string>,
                );
                return formatter(contents, attributes ?? {});
            }
            return match;
        },
    },
]);
export function formatMessage(message: string, formatters: Record<string, Formatter>) {
    return processor(message, formatters);
}
*/

export function processStringArgs() {}
