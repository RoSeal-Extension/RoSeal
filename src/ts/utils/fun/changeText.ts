import { randomInt } from "../random.ts";
import { watchAttributes, watch, watchTextContent, watchOnce } from "../../helpers/elements.ts";
import { asLocaleLowerCase, asLocaleUpperCase } from "../../helpers/i18n/intlFormats.ts";

export function changeAllTextTo(texts: string[]) {
	const handleNode = (node: Node | null) => {
		if (!node) {
			return;
		}
		let text = texts[randomInt(0, texts.length - 1)];
		if (randomInt(1, 100) <= 5) {
			text = asLocaleUpperCase(text);
		}
		if (node.nodeType === Node.TEXT_NODE) {
			if (
				!node.nodeValue ||
				node.nodeValue.trim() === "" ||
				texts.includes(asLocaleLowerCase(node.nodeValue))
			) {
				return;
			}
			node.nodeValue = text;
		} else if (node.nodeType === Node.ELEMENT_NODE) {
			const el = node as unknown as HTMLElement;
			if (el.closest("#roseal-settings-container")) {
				return;
			}

			if (
				"placeholder" in el &&
				!texts.includes(asLocaleLowerCase(el.placeholder as string))
			) {
				el.placeholder = text;
			}
		}
	};

	const handleNodeAdded = (node: Node) => {
		handleNode(node);

		const killList: (() => void)[] = [];
		killList.push(watchTextContent(node, handleNode));

		if (node.nodeType === Node.ELEMENT_NODE) {
			if ((node as HTMLElement).hasAttribute("placeholder")) {
				killList.push(
					watchAttributes(node as HTMLElement, () => handleNode(node as Element), [
						"placeholder",
					]),
				);
			}
		}

		watchOnce(node, true).then(() => {
			for (const item of killList) {
				try {
					item();
				} catch {}
			}
		});
	};

	watch<HTMLElement>("body *", (node) => {
		if (node.closest("#roseal-settings-container")) {
			return;
		}
		handleNodeAdded(node);

		const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
		let currentNode: Node | null = walker.nextNode();

		while (currentNode) {
			handleNodeAdded(currentNode);

			currentNode = walker.nextNode();
		}
	});
}
