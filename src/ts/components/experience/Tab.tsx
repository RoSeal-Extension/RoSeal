import { useCallback, useEffect, useState } from "preact/hooks";
import { useSignal } from "@preact/signals";
import SimpleTabContent from "../core/tab/Content.tsx";
import SimpleTabNav from "../core/tab/SimpleNav.tsx";
import type { ComponentChildren, ComponentChild } from "preact";
import { renderAfter } from "src/ts/utils/render.ts";

export type ExperienceTabProps = {
	id: string;
	tabList: HTMLElement;
	title: ComponentChild;
	subtitle?: ComponentChild;
	content: ComponentChild;
	renderImmediately?: boolean;
	children?: ComponentChildren;
	onRender?: () => void;
};

export default function ExperienceTab({
	id,
	tabList,
	title,
	subtitle,
	content,
	renderImmediately,
	children,
	onRender,
}: ExperienceTabProps) {
	const active = useSignal(false);
	const hasRenderedContent = useSignal(false);
	const [hash, setHash] = useState(`#!/${id}`);

	const renderContent = useCallback(() => {
		if (hasRenderedContent.value) return;

		hasRenderedContent.value = true;
		const aboutTab = tabList.querySelector<HTMLElement>("#about");
		if (!aboutTab) {
			return;
		}

		renderAfter(
			<SimpleTabContent isActive={active} id={id}>
				{content}
			</SimpleTabContent>,
			aboutTab,
		);

		onRender?.();
	}, [onRender]);

	const onHashChange = () => {
		const onHash = location.hash.startsWith(`#!/${id}`);
		active.value = onHash;

		if (onHash) {
			if (!hasRenderedContent.value) {
				renderContent();
			}
			setHash(location.hash);
			onClick();

			for (const el of tabList.querySelectorAll(
				`.rbx-tab.active:not(#tab-${id}), .tab-pane.active:not(#${id})`,
			)) {
				el.classList.remove("active");
			}
		}
	};

	const onClick = (initial?: boolean) => {
		if (active.value) {
			return;
		}

		if (!initial) {
			location.hash = hash;
		} else {
			setHash(location.hash);
		}

		for (const el of tabList.querySelectorAll(
			`.rbx-tab.active:not(#tab-${id}), .tab-pane.active:not(#${id})`,
		)) {
			el.classList.remove("active");
		}

		active.value = true;
		renderContent();
	};

	useEffect(() => {
		if (location.hash.startsWith(`#!/${id}`)) {
			onClick(true);
		} else if (renderImmediately) {
			renderContent();
		}

		globalThis.addEventListener("popstate", onHashChange);
		globalThis.addEventListener("hashchange", onHashChange);
		return () => {
			globalThis.removeEventListener("popstate", onHashChange);
			globalThis.removeEventListener("hashchange", onHashChange);
		};
	}, []);

	return (
		<SimpleTabNav
			id={id}
			title={title}
			subtitle={subtitle}
			link={false}
			active={active.value}
			onClick={() => onClick()}
		>
			{children}
		</SimpleTabNav>
	);
}
