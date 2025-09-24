import { signal } from "@preact/signals";
import useImprovedFilters from "src/ts/components/charts/hooks/useImprovedFilters";
import Filter from "src/ts/components/core/filters/Filter";
import FiltersContainer from "src/ts/components/core/filters/FiltersContainer";
import {
	HOME_SORTS_LAYOUT_STORAGE_KEY,
	type HomeSortsLayoutStorageValue,
} from "src/ts/components/home/layoutCustomization/constants";
import { type ChartFiltersState, defaultChartFiltersState } from "src/ts/constants/chartFilters";
import { sendMessage } from "src/ts/helpers/communication/dom";
import { watch, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleLowerCase } from "src/ts/helpers/i18n/intlFormats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { storage } from "src/ts/helpers/storage";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { CHARTS_REGEX } from "src/ts/utils/regex";
import { renderAfter, renderBefore, renderIn } from "src/ts/utils/render";

export default {
	id: "charts",
	regex: [CHARTS_REGEX],
	hotSwappable: true,
	fn: () => {
		const checks: MaybeNestedPromise<(() => void | undefined) | undefined | void>[] = [];
		let isCurrentlyV2Sort: boolean | undefined;

		const runChecks = () => {
			const isNextV2Sort = location.hash.includes("v2");
			if (isCurrentlyV2Sort === isNextV2Sort) {
				return;
			}
			isCurrentlyV2Sort = isNextV2Sort;
			if (checks.length > 0) {
				Promise.all(checks).then((checks) => {
					for (const check of checks) if (check) check();
				});
			}
			const params = new URLSearchParams(location.search);

			let keyword: string | undefined;
			for (const [key, value] of params) {
				if (key.toLowerCase() === "keyword") {
					keyword = value;
					break;
				}
			}

			if (keyword && !keyword?.match(/^".*"$/)) {
				featureValueIs("chartsTryExactMatch", true, () => {
					const selector = ".game-grid > .game-card-container";
					watchOnce(selector).then((el) => {
						const lowerKeyword = asLocaleLowerCase(keyword);
						const containers = el.querySelectorAll(`${selector} .game-name-title`);

						if (
							!Array.from(containers)
								.slice(0, 9)
								.some((item) =>
									item.textContent?.toLowerCase()?.includes(lowerKeyword),
								)
						) {
							const newKeyword = `"${keyword}"`;
							const newLink = new URL(location.href);
							newLink.searchParams.set("Keyword", newKeyword);

							renderBefore(
								<span className="games-list-header text try-exact-search-text">
									{getMessage("charts.tryExactSearch", {
										boldText: (contents: string) => <b>{contents}</b>,
										newKeyword: (
											<a
												href={newLink.toString().replaceAll("+", "%20")}
												className="text-link"
											>
												{newKeyword}
											</a>
										),
									})}
								</span>,
								el.parentElement!,
							);
						}
					});
				});
			}

			if (isCurrentlyV2Sort) {
				featureValueIs("customizeHomeSortsLayout", true, async () => {
					const playlistsEnabledPromise = getFeatureValue(
						"customizeHomeSortsLayout.playlists",
					);
					const allLayout = (await storage.get(HOME_SORTS_LAYOUT_STORAGE_KEY))[
						HOME_SORTS_LAYOUT_STORAGE_KEY
					] as HomeSortsLayoutStorageValue | undefined;
					if (!allLayout) {
						return;
					}
					const authenticatedUser = await getAuthenticatedUser();
					if (!authenticatedUser) {
						return;
					}
					const layout =
						allLayout[authenticatedUser.userId] ||
						(allLayout.default !== undefined && allLayout[allLayout.default]);
					if (!layout) {
						return;
					}

					sendMessage("charts.updateSortV2Layout", {
						layout,
						playlists: (await playlistsEnabledPromise) ? allLayout._custom : undefined,
					});
				});
			} else {
				checks.push(
					featureValueIs("chartsClientFilters", true, () => {
						const filters = signal<ChartFiltersState>(defaultChartFiltersState);

						let handledFiltersContainer: HTMLElement | undefined;
						const handleFiltersContainer = (existingFilters: HTMLElement) => {
							if (existingFilters !== handledFiltersContainer) {
								handledFiltersContainer = existingFilters;
								const header = document.querySelector(".filters-header");
								if (header) {
									header.textContent = getMessage("charts.filters.label");
								}

								const list =
									existingFilters.querySelector<HTMLElement>(
										".filter-items-container",
									);
								if (list) {
									renderIn(() => {
										const improvedFilters = useImprovedFilters(filters.value);

										return improvedFilters.map((filter) => (
											<Filter
												key={filter.id}
												filter={filter}
												applyFilterValue={(id, value) => {
													filters.value = {
														...filters.value,
														[id]: value,
													};

													sendMessage("charts.setFilters", filters.value);
												}}
											/>
										));
									}, list);
								}
							}
						};

						checks.push(
							watch(
								".games-page-container > .section .filters-container",
								handleFiltersContainer,
							),
						);

						return watch(
							".games-page-container > .section .grid-item-container, .game-sort-detail-container > .game-grid, #games-search-page .game-grid",
							async (el) => {
								if (document.querySelector(".roseal-filters-container")) {
									return;
								}
								const grid = el.closest(".section, .game-grid")!;

								const isChartsPage = !!grid.closest(".games-page-container");

								if (isChartsPage) {
									await watchOnce(
										".grid-item-container:not(.invisible), .games-list-container:not(.invisible)",
									);
								}

								const existingFilters =
									grid.querySelector<HTMLDivElement>(".filters-container");

								if (existingFilters) {
									return;
								}

								(keyword ? renderBefore : renderAfter)(
									() => {
										const improvedFilters = useImprovedFilters(filters.value);

										return (
											<FiltersContainer
												title={getMessage("charts.filters.label")}
												filters={improvedFilters}
												applyFilterValue={(id, value) => {
													filters.value = {
														...filters.value,
														[id]: value,
													};

													sendMessage("charts.setFilters", filters.value);
												}}
											/>
										);
									},
									(isChartsPage
										? grid.querySelector(".games-list-header")!
										: grid.parentElement!.querySelector("h1")!) ?? grid,
								);
							},
						);
					}),
				);
			}
		};

		window.addEventListener("hashchange", runChecks);
		runChecks();

		return () => {
			window.removeEventListener("hashchange", runChecks);
			Promise.all(checks).then((checks) => {
				for (const check of checks) if (check) check();
			});
		};
	},
} satisfies Page;
