import { signal } from "@preact/signals";
import type { VNode } from "preact";
import { crossSort } from "../utils/objects";
import { renderAfter, renderIn } from "../utils/render";
import { watch } from "./elements";

type AllElementsItem = [VNode | VNode[], number];
const allElements = signal<AllElementsItem[]>([]);
let currentWatcher: (() => void) | undefined;

export async function modifyItemStats<T extends VNode | (() => VNode)>(
	type: "Group" | "User" | "Item" | "Experience" | "Look" | "ExperienceEvent",
	_elements: T | T[],
	order = 0,
) {
	const elements = (Array.isArray(_elements) ? _elements : ([_elements] as T[])).map(
		(Element) => {
			// @ts-expect-error: Fine, quiet
			return typeof Element === "function" ? <Element /> : Element;
		},
	) as VNode[];

	allElements.value = crossSort(
		[...allElements.value, [elements, order]],
		(a, b) => (a[1] as number) - (b[1] as number),
	) as AllElementsItem[];
	if (allElements.value.length >= 2) {
		return clearModifyItemStats;
	}

	const alreadyHandled = new Set<HTMLElement>();
	if (type === "Group") {
		currentWatcher = watch(".profile-header-details-community-name", (title) => {
			if (title.closest(".MuiSkeleton-root") || !title.isConnected) return;

			if (alreadyHandled.has(title)) {
				return;
			}

			alreadyHandled.add(title);
			let groupStatsContainer =
				title.parentElement?.querySelector<HTMLDivElement>(".roseal-group-stats");
			if (!groupStatsContainer) {
				groupStatsContainer = document.createElement("div");
				groupStatsContainer.classList.add("roseal-group-stats");
				title.parentElement?.append(groupStatsContainer);
			}

			renderIn(() => allElements.value.map((item) => item[0]), groupStatsContainer);
		});
	} else if (type === "User") {
		currentWatcher = watch("#profile-statistics-container .profile-stats", (container) => {
			if (alreadyHandled.has(container)) {
				return;
			}

			alreadyHandled.add(container);
			renderIn(() => allElements.value.map((item) => item[0]), container);
		});
	} else if (type === "Item") {
		currentWatcher = watch("#item-details", (container) => {
			if (
				alreadyHandled.has(container) ||
				container.style.getPropertyValue("display") === "none"
			) {
				return;
			}
			alreadyHandled.add(container);

			const last = Array.from(
				container.querySelectorAll<HTMLDivElement>(".clearfix:not(.toggle-target)"),
			).at(-1);
			if (!last) {
				return;
			}
			renderAfter(() => allElements.value.map((item) => item[0]), last);
		});
	} else if (type === "Experience") {
		currentWatcher = watch(".game-stat-container", (container) => {
			if (alreadyHandled.has(container)) {
				return;
			}
			alreadyHandled.add(container);

			renderIn(() => allElements.value.map((item) => item[0]), container);
		});
	} else if (type === "Look") {
		currentWatcher = watch(".look-details-section", (container) => {
			if (alreadyHandled.has(container)) {
				return;
			}
			alreadyHandled.add(container);

			const price = container
				.querySelector<HTMLDivElement>(".total-value")
				?.closest<HTMLElement>(".look-info-row-container");

			if (!price) {
				return;
			}

			renderAfter(() => allElements.value.map((item) => item[0]), price);
		});
	} else if (type === "ExperienceEvent") {
		currentWatcher = watch(".event-hosted-by-container", (container) => {
			if (alreadyHandled.has(container)) {
				return;
			}
			alreadyHandled.add(container);

			renderAfter(() => allElements.value.map((item) => item[0]), container);
		});
	}

	return clearModifyItemStats;
}

export function clearModifyItemStats() {
	if (currentWatcher) {
		currentWatcher();
		currentWatcher = undefined;
	}

	allElements.value = [];
}
