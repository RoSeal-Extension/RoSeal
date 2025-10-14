import type {
	CustomHomePlaylist,
	Layout,
} from "src/ts/components/home/layoutCustomization/constants";
import {
	ACCURATE_TOPIC_HANDLING,
	transformSort,
} from "src/ts/components/home/layoutCustomization/utils";
import { addMessageListener } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackState } from "src/ts/helpers/hijack/react";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type {
	GetOmniRecommendationsResponse,
	OmniContentMetadata,
	OmniSort,
} from "src/ts/helpers/requests/services/universes";
import { handleChartFilters } from "src/ts/specials/handleChartFilters";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { CHARTS_REGEX } from "src/ts/utils/regex";

const emptyList = new Proxy([], {
	get: (list, p) => {
		if (typeof p === "string" && !Number.isNaN(Number.parseInt(p, 10))) {
			return { contentMetadata: {} };
		}
		return Reflect.get(list, p);
	},
});

function ensureNoBrickSort(sort: OmniSort) {
	return {
		...sort,
		recommendationList:
			sort.recommendationList?.length === 0
				? emptyList
				: sort.recommendationList &&
					new Proxy(sort.recommendationList, {
						get: (list, p) => {
							if (typeof p === "string") {
								const number = Number.parseInt(p, 10);
								if (!Number.isNaN(number)) {
									if (list[number]) {
										return list[number];
									}
									return { contentMetadata: {} };
								}
							}
							return Reflect.get(list, p);
						},
					}),
	};
}

export type V2SortStateValue = {
	sorts: [OmniSort];
	contentMetadata: OmniContentMetadata;
};

export default {
	id: "charts",
	regex: [CHARTS_REGEX],
	hotSwappable: true,
	fn: () => {
		const checks: MaybeNestedPromise<(() => void | undefined | boolean) | undefined | void>[] =
			[];
		let isCurrentlyV2Sort: boolean | undefined;

		const runChecks = () => {
			const isNextV2Sort = location.pathname.includes("v2") || location.hash.includes("v2");
			if (isCurrentlyV2Sort === isNextV2Sort) {
				return;
			}

			isCurrentlyV2Sort = isNextV2Sort;
			if (checks.length > 0) {
				Promise.all(checks).then((checks) => {
					for (const check of checks) if (check) check();
				});
			}

			checks.splice(0, checks.length);
			if (isCurrentlyV2Sort) {
				checks.push(
					featureValueIsInject("customizeHomeSortsLayout", true, async () => {
						let internalState: V2SortStateValue | undefined;
						let updateState: ((state: V2SortStateValue) => void) | undefined;
						let currentLayout: Layout | undefined;
						let currentPlaylists: CustomHomePlaylist[] | undefined;

						let omniRecommendations: GetOmniRecommendationsResponse | undefined;

						checks.push(
							hijackResponse(async (req, res) => {
								const url = new URL(req.url);
								if (
									url.hostname === getRobloxUrl("apis") &&
									url.pathname === "/discovery-api/omni-recommendation"
								) {
									const data = (await res
										?.clone()
										.json()) as GetOmniRecommendationsResponse;

									omniRecommendations = data;
									if (data.contentMetadata.Game) {
										for (const key in data.contentMetadata.Game) {
											const item = data.contentMetadata.Game[key];
											// @ts-expect-error: Sometimes this just WORKS. It shouldn't be valid, but it is. What the heck?
											item.placeId = item.rootPlaceId;
										}
									}

									if (!currentPlaylists) return;

									for (const customSort of currentPlaylists) {
										data.sorts.push({
											nextPageTokenForTopic: null,
											numberOfRows: 1,
											recommendationList: customSort.items.map((item) => ({
												contentId: item.id,
												contentType: "Game",
												contentMetadata: {},
											})),
											subtitle: "",
											topic: customSort.name,
											topicId: `rosealCustom_${customSort.id}`,
											treatmentType: "Carousel",
											topicLayoutData: {},
										});
									}

									return new Response(JSON.stringify(data), res);
								}
							}),
						);

						const handleUpdateLayout = (
							newLayout?: Layout,
							newPlaylists?: CustomHomePlaylist[],
						) => {
							if (newLayout) {
								currentLayout = newLayout;
							}

							if (newPlaylists) {
								currentPlaylists = newPlaylists;
							}

							if (!currentLayout?.sorts) {
								return;
							}

							for (const sort of currentLayout.sorts) {
								if (
									sort.override.accurate &&
									sort.topicId in ACCURATE_TOPIC_HANDLING
								) {
									ACCURATE_TOPIC_HANDLING[
										sort.topicId as keyof typeof ACCURATE_TOPIC_HANDLING
									].load();
								}
							}

							if (!updateState || !internalState || !omniRecommendations) {
								return;
							}

							const sort = transformSort(
								internalState.sorts[0],
								0,
								omniRecommendations.sorts,
								currentLayout!,
							);

							if (sort) {
								const newSort = ensureNoBrickSort(sort);

								updateState({
									sorts: [newSort],
									contentMetadata: internalState.contentMetadata,
								});
								updateState({
									sorts: [newSort],
									contentMetadata: internalState.contentMetadata,
								});
							}
						};

						checks.push(
							addMessageListener("charts.updateSortV2Layout", (data) =>
								handleUpdateLayout(data.layout, data.playlists),
							),
						);

						return hijackState<{
							sorts: OmniSort[];
							contentMetadata: OmniContentMetadata;
						}>({
							matches: (state) =>
								state !== null &&
								typeof state === "object" &&
								"sorts" in state &&
								Array.isArray(state.sorts) &&
								state.sorts.length === 1 &&
								"contentMetadata" in state,
							setState: ({ value, publicSetState }) => {
								updateState = publicSetState;

								if (!omniRecommendations) {
									return value.current;
								}

								const sort = value.current.sorts[0];
								const prevSort = internalState?.sorts[0];
								if (prevSort?.topicId !== sort.topicId) {
									const thisSort = omniRecommendations.sorts.find(
										(sort2) => sort.topicId === sort2.topicId,
									);

									if (thisSort) {
										internalState = {
											sorts: [thisSort],
											contentMetadata: omniRecommendations.contentMetadata,
										};

										if (
											thisSort &&
											thisSort.topicId in ACCURATE_TOPIC_HANDLING &&
											!ACCURATE_TOPIC_HANDLING[
												thisSort.topicId as unknown as keyof typeof ACCURATE_TOPIC_HANDLING
											].state.value.value
										) {
											ACCURATE_TOPIC_HANDLING[
												thisSort.topicId as unknown as keyof typeof ACCURATE_TOPIC_HANDLING
											].state.subscribe(() => {
												handleUpdateLayout();
											});
										}
									} else {
										internalState = undefined;
									}
								}

								return currentLayout && internalState
									? {
											sorts: [
												ensureNoBrickSort(
													transformSort(
														internalState.sorts[0],
														0,
														omniRecommendations.sorts,
														currentLayout,
													)!,
												),
											],
											contentMetadata: value.current.contentMetadata,
										}
									: value.current;
							},
							onlyFromSiteUpdate: true,
						});
					}),
				);
			} else {
				featureValueIsInject("chartsClientFilters", true, () => {
					checks.push(...handleChartFilters());
				});
			}
		};

		window.addEventListener("hashchange", runChecks);
		runChecks();

		return () => {
			window.removeEventListener("hashchange", runChecks);
			if (checks) {
				Promise.all(checks).then((checks) => {
					for (const check of checks) if (check) check();
				});
			}
		};
	},
} satisfies Page;
