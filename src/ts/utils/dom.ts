export function onDOMReady(fn: () => Promise<void> | void) {
	if (document.readyState !== "loading") {
		fn();
	} else {
		document.addEventListener("DOMContentLoaded", fn, {
			once: true,
		});
	}
}

export function onElementLoad(element: HTMLElement) {
	if (
		!(element.getAttribute("src") || element.hasAttribute("href")) ||
		("complete" in element && element.complete)
	) {
		return Promise.resolve();
	}

	let loaded = false;
	let resolveFn: (() => void) | undefined;

	const onLoad = () => {
		loaded = true;
		resolveFn?.();

		element.removeEventListener("load", onLoad);
	};

	const onError = () => {
		loaded = true;
		resolveFn?.();

		element.removeEventListener("error", onError);
	};

	element.addEventListener("load", onLoad);
	element.addEventListener("error", onError);

	return new Promise<void>((resolve) => {
		if (loaded) {
			return resolve();
		}

		resolveFn = resolve;
	});
}

export type InjectScript = { tagName: "SCRIPT" | "LINK" } & Record<string, string>;

export function injectScripts(scripts: InjectScript[]) {
	const promises = [];

	for (const script of scripts) {
		const newScript = document.createElement(script.tagName.toLowerCase());
		for (const key in script) {
			if (key.toLowerCase() === "tagname") {
				continue;
			}
			newScript.setAttribute(key, script[key]);
		}

		promises.push(onElementLoad(newScript));
		onDOMReady(() => {
			(document.head ?? document.documentElement).append(newScript);
		});
	}

	return Promise.all(promises).then(() => {});
}

export function onWindowRefocus(minTimeout: number, fn: (millisecondsIdle: number) => void) {
	let lastBlur: number | undefined;

	const onFocus = () => {
		const now = Date.now();
		if (lastBlur !== undefined) {
			const idle = now - lastBlur;
			if (idle >= minTimeout) {
				fn(idle);
			}

			lastBlur = undefined;
		}
	};
	globalThis.addEventListener("focus", onFocus);

	const onBlur = () => {
		lastBlur = Date.now();
	};
	globalThis.addEventListener("blur", onBlur);

	return () => {
		globalThis.removeEventListener("focus", onFocus);
		globalThis.removeEventListener("blur", onBlur);
	};
}

export function isFocusedOnInput() {
	const activeElement = document.activeElement;

	return Boolean(
		activeElement &&
			(activeElement instanceof HTMLInputElement ||
				activeElement instanceof HTMLTextAreaElement ||
				activeElement instanceof HTMLSelectElement ||
				activeElement.hasAttribute("contenteditable")),
	);
}
