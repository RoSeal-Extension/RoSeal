import { onDOMReady } from "../utils/dom";
import { sendMessage } from "./communication/dom";

type Watch = [
	selector: string | Node,
	onlyOnce: boolean,
	isDeep: boolean,
	fn: (element: Node, kill?: () => void) => Promise<void> | void,
	includeRemoved: boolean,
];

const watches = new Set<Watch>();

function makeKillFn(watch: Watch) {
	return () => {
		watches.delete(watch);
	};
}

if (import.meta.env.ENV !== "background") {
	const observer = new MutationObserver((records) => {
		const collectedNodes = new Map<Watch, Set<Node>>();
		const removedNodes = new Map<Watch, Set<Node>>();
		for (const record of records) {
			for (const node of record.removedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) continue;

				for (const watch of watches) {
					let watchRemoved = removedNodes.get(watch);
					if (!watchRemoved) {
						watchRemoved = new Set<Node>();
						collectedNodes.set(watch, watchRemoved);
					}
					if (watchRemoved.has(node)) {
						continue;
					}

					const [selector, isOnce, isDeep, callback, removed] = watch;
					if (!removed) continue;

					const killFn = makeKillFn(watch);
					const matchesSelector =
						typeof selector === "string"
							? (node as Element).matches(selector)
							: node === selector;

					if (matchesSelector) {
						watchRemoved.add(node);
						callback(node, isOnce ? undefined : killFn);

						if (isOnce) {
							killFn();
							continue;
						}
					}

					if (isDeep) {
						if (typeof selector === "string") {
							for (const newElement of (node as Element).querySelectorAll(selector)) {
								if (watchRemoved.has(newElement)) continue;
								watchRemoved.add(newElement);

								callback(newElement, killFn);

								if (isOnce) {
									killFn();
									break;
								}
							}
						} else {
							if (node.contains(selector)) {
								watchRemoved.add(selector);
								callback(selector, killFn);

								if (isOnce) {
									killFn();
									break;
								}
							}
						}
					}
				}
			}

			for (const node of record.addedNodes) {
				if (node.nodeType !== Node.ELEMENT_NODE) continue;

				for (const watch of watches) {
					let watchCollected = collectedNodes.get(watch);
					if (!watchCollected) {
						watchCollected = new Set<Node>();
						collectedNodes.set(watch, watchCollected);
					}
					if (watchCollected.has(node)) {
						continue;
					}
					const [selector, isOnce, isDeep, callback, removed] = watch;
					if (removed || typeof selector !== "string") continue;

					const matchesSelector = selector === "*" || (node as Element).matches(selector);
					const killFn = makeKillFn(watch);

					if (matchesSelector) {
						watchCollected.add(node);

						callback(node, isOnce ? undefined : killFn);

						if (isOnce) {
							killFn();
							continue;
						}
					}

					if (isDeep) {
						for (const newElement of (node as Element).querySelectorAll(selector)) {
							if (watchCollected.has(newElement)) continue;
							watchCollected.add(newElement);

							callback(newElement, killFn);

							if (isOnce) {
								killFn();
								break;
							}
						}
					}
				}
			}
		}
	});

	observer.observe(document, {
		subtree: true,
		childList: true,
	});
}

export function watch<T extends HTMLElement = HTMLElement, U = unknown>(
	selector: string | Node,
	callback: (element: T, kill?: () => void) => MaybePromise<U>,
	removed = false,
	isDeep = true,
	precheck = true,
	signal?: AbortSignal,
) {
	const watch = [selector, false, isDeep, callback, removed] as unknown as Watch;
	const killFn = makeKillFn(watch);
	watches.add(watch);

	if (precheck && !removed && typeof selector === "string") {
		const matches = document.querySelectorAll(selector);
		for (const match of matches) {
			callback(match as T, killFn);
		}
	}

	if (signal) {
		const onAbort = () => {
			killFn();
			signal.removeEventListener("abort", onAbort);
		};

		signal.addEventListener("abort", onAbort);
	}

	return killFn;
}

export function watchOnce<T extends HTMLElement = HTMLElement>(
	selector: string | Node,
	removed = false,
	signal?: AbortSignal,
): Promise<T> {
	return new Promise((resolve, reject) => {
		if (!removed && typeof selector === "string") {
			const match = document.querySelector(selector);
			if (match) {
				return resolve(match as T);
			}
		}

		const watch = [selector, true, true, resolve, removed] as Watch;
		watches.add(watch);

		if (signal) {
			const onAbort = () => {
				makeKillFn(watch)();
				signal.removeEventListener("abort", onAbort);
				reject();
			};

			signal.addEventListener("abort", onAbort);
		}
	});
}

export function watchBeforeLoad<T extends HTMLElement = HTMLElement>(
	selector: string,
): Promise<T | void> {
	return new Promise((resolve) => {
		const match = document.querySelector(selector);
		if (match) {
			return resolve(match as T);
		}

		if (document.readyState !== "loading") {
			return resolve();
		}
		const watch = [selector, true, true, resolve, false] as Watch;
		watches.add(watch);

		onDOMReady(() => {
			watches.delete(watch);
			resolve();
		});
	});
}

export function watchAttributes<T extends HTMLElement = HTMLElement>(
	element: T,
	callback: (
		name: string,
		element: T,
		newValue: string | null,
		oldValue: string | null,
		kill?: () => void,
	) => Promise<void> | void,
	attributeNames?: string[],
	once?: boolean,
	subtree?: boolean,
): () => void {
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			if (once) observer.disconnect();

			callback(
				record.attributeName!,
				record.target as T,
				(record.target as T).getAttribute(record.attributeName!),
				record.oldValue,
				once ? undefined : () => observer.disconnect(),
			);
		}
	});

	observer.observe(element, {
		attributes: true,
		attributeOldValue: true,
		attributeFilter: attributeNames,
		subtree,
	});

	return observer.disconnect;
}

export function watchTextContent<T extends Node = Node>(
	element: T,
	callback: (node: T, kill?: () => void) => Promise<void> | void,
	once?: boolean,
): () => void {
	const observer = new MutationObserver((records) => {
		for (const record of records) {
			const nodes = [...record.addedNodes, ...record.removedNodes];
			if (record.oldValue && record.target.nodeValue !== record.oldValue) {
				callback(record.target as T, once ? undefined : () => observer.disconnect());
				if (once) {
					observer.disconnect();
					break;
				}
			}

			for (const node of nodes) {
				if (node.nodeType !== Node.TEXT_NODE) continue;

				if (once) {
					callback(node as T);
					observer.disconnect();
					break;
				}

				callback(node as T, once ? undefined : () => observer.disconnect());
			}
		}
	});

	observer.observe(element, {
		characterData: true,
		characterDataOldValue: true,
		subtree: true,
		childList: true,
	});

	return () => observer.disconnect();
}

let currentTitle: string | undefined;
let currentNotifications: string | undefined;

let currentlyChecking = false;
if (import.meta.env.ENV === "main") {
	const titleObserver = new MutationObserver(() => {
		if (currentlyChecking) return;
		if (currentTitle && !document.title.endsWith(currentTitle)) {
			const currentNotificationCount = document.title.match(/^\((.+?)\) /)?.[1];

			currentlyChecking = true;
			document.title = currentTitle;
			currentTitle = document.title;
			currentlyChecking = false;

			if (currentNotificationCount) {
				currentNotifications = currentNotificationCount;

				document.title = `(${currentNotifications}) ${currentTitle}`;
			}
		}
	});

	watchOnce("title").then((element) => {
		if (currentlyChecking && currentTitle) {
			document.title = currentTitle;
			currentTitle = document.title;
			currentlyChecking = false;
		}
		titleObserver.observe(element, {
			childList: true,
		});
	});
}

export function modifyTitle(title: string): void {
	const setTitle = `${title} - Roblox`;
	document.title = setTitle;

	sendMessage("updateDocumentTitle", setTitle);

	/*
	currentTitle = `${title.trim().replaceAll(/ {2,}/g, " ")} - Roblox`;

	if (!currentNotifications) {
		const currentNotificationCount = document.title.match(/^\((.+?)\) /)?.[1];

		if (currentNotificationCount) {
			currentNotifications = currentNotificationCount;
		}
	}

	currentlyChecking = true;
	if (document.title) {
		document.title = currentTitle;
		currentTitle = document.title;
		currentlyChecking = false;
	}

	if (currentNotifications) {
		document.title = `(${currentNotifications}) ${currentTitle}`;
	}*/
}

export function showEl(el: HTMLElement, className = "data-display-none") {
	el.style.removeProperty("display");
	el.removeAttribute(className);
}

export function hideEl(el: HTMLElement, nextToo?: boolean, className = "data-display-none") {
	el.style.setProperty("display", "none");
	el.setAttribute(className, "");

	if (nextToo) {
		const killWatch = watchAttributes(
			el,
			() => {
				el.setAttribute(className, "");
				el.style.setProperty("display", "none");
			},
			[className],
			true,
		);
		return () => {
			killWatch();
			el.removeAttribute(className);
			el.style.removeProperty("display");
		};
	}
}
