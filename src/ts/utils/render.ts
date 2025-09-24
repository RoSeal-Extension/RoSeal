import { type ContainerNode, createElement, render, type VNode } from "preact";
import { createPortal } from "preact/compat";
import { watchOnce } from "../helpers/elements";
import { error } from "./console";

export function createRootFragment(
	parent: Element & {
		__k?: unknown;
	},
	replaceNode: HTMLElement,
	preservePlace?: boolean,
) {
	const nextSibling = replaceNode.nextSibling;

	let unmounted = false;
	const insert = (c: Node, r?: Node) => {
		if (!parent.isConnected) {
			if (!unmounted) render(null, parent.__k as ContainerNode);

			unmounted = true;
			return;
		}

		if (!r && !nextSibling?.isConnected) {
			return parent.appendChild(c);
		}

		try {
			parent.insertBefore(c, r || nextSibling);
		} catch {
			error("nextSibling or element moved, likely due to another extension");
		}
	};

	parent.__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: null,
		childNodes: [],
		insertBefore: insert,
		appendChild: insert,
		contains: (c: Node) => parent.contains(c),
		removeChild: (c: HTMLElement) => {
			if (!parent.isConnected) {
				if (!unmounted) render(null, parent.__k as ContainerNode);

				unmounted = true;
			}

			parent.removeChild(c);
		},
	};

	if (!preservePlace) {
		replaceNode.remove();
	}
	return parent.__k as ContainerNode;
}

export type RenderArg = Parameters<typeof render>[0];

export function renderAsContainer(
	_reactComponent: RenderArg,
	element: HTMLElement,
	preservePlace?: boolean,
) {
	const reactComponent =
		typeof _reactComponent === "function"
			? createElement(_reactComponent as () => VNode, {})
			: _reactComponent;
	if (!element?.parentElement) return;
	if (preservePlace) element.style.setProperty("display", "none", "important");

	const fragment = createRootFragment(element.parentElement, element, preservePlace);
	render(reactComponent, fragment);

	return fragment;
}

export function renderAfter(
	reactComponent: RenderArg,
	element: HTMLElement,
	preservePlace?: boolean,
) {
	if (!element?.parentElement) return;

	const div = document.createElement("div");
	element.after(div);

	return renderAsContainer(reactComponent, div, preservePlace);
}

export function renderBefore(
	reactComponent: RenderArg,
	element: HTMLElement,
	preservePlace?: boolean,
) {
	if (!element?.parentElement) return;

	const div = document.createElement("div");
	element.before(div);

	return renderAsContainer(reactComponent, div, preservePlace);
}

export function renderPrepend(
	reactComponent: RenderArg,
	element: HTMLElement,
	preservePlace?: boolean,
) {
	if (!element?.parentElement) return;

	const div = document.createElement("div");
	element.prepend(div);

	return renderAsContainer(reactComponent, div, preservePlace);
}

export function renderAppend(
	reactComponent: RenderArg,
	element: HTMLElement,
	preservePlace?: boolean,
) {
	if (!element?.parentElement) return;

	const div = document.createElement("div");
	element.append(div);

	return renderAsContainer(reactComponent, div, preservePlace);
}

export function renderIn(_reactComponent: RenderArg, element: HTMLElement) {
	const reactComponent =
		typeof _reactComponent === "function"
			? createElement(_reactComponent as () => VNode, {})
			: _reactComponent;

	const div = document.createElement("div");
	render(createPortal(reactComponent, element), div);

	return div;
}

export function renderAppendBody(reactComponent: RenderArg) {
	return watchOnce("body").then((body) => renderAppend(reactComponent, body));
}
