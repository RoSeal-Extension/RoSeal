import { allowedItemsData, blockedItemsData } from "src/ts/constants/misc";
import { invokeMessage } from "src/ts/helpers/communication/dom";
import { listUserFavoritedExperiences } from "src/ts/helpers/requests/services/favorites";
import { getSearchLandingPage } from "src/ts/helpers/requests/services/misc";
import type {
	DevelopUniverse,
	OmniItem,
	OmniSort,
} from "src/ts/helpers/requests/services/universes";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { lazyLoadSignal } from "src/ts/utils/lazyLoad";
import { crossSort, shuffleArray } from "src/ts/utils/objects";
import type {
	CustomHomePlaylist,
	Layout,
	SortLayoutOverride,
	SortWithOverrides,
} from "./constants";
import { isExperienceBlocked } from "src/ts/utils/blockedItems";

export const CONTINUE_SORT_TOPIC_ID = 100000003;
export const FAVORITED_SORT_TOPIC_ID = 100000001;
export const FRIENDS_SORT_TOPIC_ID = 600000000;

export const PLACE_UNSORTED_AFTER_TOPIC_IDS = [
	CONTINUE_SORT_TOPIC_ID,
	FAVORITED_SORT_TOPIC_ID,
	FRIENDS_SORT_TOPIC_ID,
] as (string | number)[];

export const ACCURATE_TOPIC_HANDLING = {
	[CONTINUE_SORT_TOPIC_ID]: lazyLoadSignal(() =>
		getSearchLandingPage({
			sessionId: crypto.randomUUID(),
		}).then(async (data) => {
			let hasContinueSort = false;
			const allData: OmniItem[] = [];
			for (const sort of data.sorts) {
				if (sort.sortId === "RecentlyVisited") {
					hasContinueSort = true;
					const checkUniverseData =
						blockedItemsData.value?.experiences.descriptions.length ||
						blockedItemsData.value?.creators.length ||
						allowedItemsData.value?.creators
							? await invokeMessage("checkBlockedUniverses", {
									ids: sort.games.map((item) => item.universeId),
								})
							: undefined;

					for (const item of sort.games) {
						if (
							isExperienceBlocked(
								item.universeId,
								undefined,
								undefined,
								item.name,
								undefined,
								checkUniverseData,
							)
						) {
							continue;
						}

						allData.push({
							contentType: "Game",
							contentId: item.universeId,
							contentMetadata: {},
						});
					}
				}
			}

			if (!hasContinueSort) {
				return undefined;
			}

			return allData;
		}),
	),
	[FAVORITED_SORT_TOPIC_ID]: lazyLoadSignal<Promise<OmniItem[] | undefined>>((update) =>
		getAuthenticatedUser().then(async (user) => {
			if (!user) {
				return;
			}

			const allData: OmniItem[] = [];
			let cursor: string | undefined;
			while (true) {
				const data = await listUserFavoritedExperiences({
					userId: user.userId,
					limit: 100,
					sortOrder: "Desc",
					cursor,
				});

				const checkUniverseData = blockedItemsData.value?.experiences.descriptions.length
					? await invokeMessage("checkBlockedUniverses", {
							ids: data.data.map((item) => item.id),
						})
					: undefined;

				for (const item of data.data) {
					if (
						isExperienceBlocked(
							item.id,
							undefined,
							undefined,
							item.name,
							undefined,
							checkUniverseData,
						)
					) {
						continue;
					}

					allData.push({
						contentType: "Game",
						contentId: item.id,
						contentMetadata: {},
					});
				}
				update(allData);

				if (!data.nextPageCursor) {
					break;
				}
				cursor = data.nextPageCursor;
			}

			return allData;
		}),
	),
} as const;

export function transformSort(
	sort: OmniSort,
	index: number,
	arr: OmniSort[],
	layout: Layout,
): OmniSort | undefined {
	const all: OmniSort[] = [];
	let topicName: string | null = null;
	for (const sort2 of arr) {
		if (sort.topicId === sort2.topicId) {
			all.push(sort2);
			if (sort2.topic) {
				topicName = sort2.topic;
			}
		}
	}

	let sortOverride: SortWithOverrides | undefined;
	let shouldCollapseSort = false;
	let shouldHideSort = false;
	let shouldShowTopicName = true;
	let hasPassedTopic = false;
	const sortIndex = all.indexOf(sort);

	for (let i = 0; i <= layout.sorts.length; i++) {
		const override = layout.sorts[i];
		if (!override) continue;

		if (override.topicId === sort.topicId) {
			if (override.override.collapse) {
				shouldCollapseSort = true;
			}

			if (override.typeIndex === sortIndex) {
				sortOverride = override;

				shouldHideSort =
					override.override.hide === true && (sortIndex !== 0 || all.length === 1);
				hasPassedTopic = true;
			} else if (sortIndex > override.typeIndex) {
				shouldShowTopicName = override.override.hide === true;
			}
		} else if (!hasPassedTopic) {
			shouldShowTopicName = true;
		}
	}

	let recommendationList = [...(sort.recommendationList ?? [])];
	let totalRows = 0;
	if (shouldCollapseSort) {
		if (sortIndex !== 0) {
			return;
		}
		for (const sort2 of all.slice(1)) {
			if (sort2.recommendationList?.length) {
				for (const item of sort2.recommendationList) {
					if (item) {
						recommendationList.push(item);
					}
				}
			}
		}
	} else {
		for (const sort2 of arr.slice(index)) {
			if (sort.topicId !== sort2.topicId) {
				continue;
			}
			totalRows++;
		}
	}

	if (sortOverride?.override.shuffle) {
		recommendationList = shuffleArray(recommendationList);
	}

	let treatmentType = sort.treatmentType;
	if (
		sortOverride?.override.treatmentType &&
		sortOverride?.override.treatmentType !== "_setByRoblox"
	) {
		treatmentType = sortOverride.override.treatmentType;
	}

	const topicLayoutData = {
		...(sort.topicLayoutData ?? {}),
	};

	if (sortOverride?.layoutOverride) {
		for (const key in sortOverride.layoutOverride) {
			if (sortOverride.layoutOverride[key as keyof SortLayoutOverride] !== "_setByRoblox") {
				const value = sortOverride.layoutOverride[key as keyof SortLayoutOverride];
				// @ts-expect-error: Fine
				topicLayoutData[key as keyof SortLayoutOverride] =
					value === "_default" ? undefined : value;
			}
		}
	}

	if (sortOverride?.override.accurate && sort.topicId in ACCURATE_TOPIC_HANDLING) {
		const newList =
			ACCURATE_TOPIC_HANDLING[sort.topicId as keyof typeof ACCURATE_TOPIC_HANDLING];

		if (newList.state.value.value !== undefined) {
			recommendationList = newList.state.value.value || [];
		}
	}

	return {
		...sort,
		treatmentType,
		recommendationList: shouldHideSort ? [] : recommendationList,
		numberOfRows: sortOverride?.override.hide
			? 0
			: (treatmentType === "SortlessGrid" &&
						sort.treatmentType !== "SortlessGrid" &&
						totalRows === 1) ||
					sortOverride?.override.collapse
				? undefined
				: sort.numberOfRows || -1,
		topic: shouldShowTopicName ? topicName : undefined,
		topicLayoutData,
	};
}

export function transformState(
	_state: OmniSort[],
	layout?: Layout,
	playlists?: CustomHomePlaylist[],
): OmniSort[] {
	const state = [...(_state ?? [])];

	if (_state) {
		if (playlists) {
			for (const customSort of playlists) {
				state.push({
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
		}
	}
	if (!_state || !layout?.sorts.length) {
		return state ?? [];
	}

	const filteredState: Required<OmniSort>[] = [];
	for (const [index, sort] of state.entries()) {
		const newSort = transformSort(sort, index, state, layout);
		if (newSort) {
			filteredState.push(newSort as Required<OmniSort>);
		}
	}

	const firstSorts: Required<{
		index: number;
		sort: OmniSort;
	}>[] = [];
	const secondSorts: Required<{
		index: number;
		sort: OmniSort;
	}>[] = [];

	for (const sort of filteredState) {
		const index = layout.sorts.findIndex(
			(a2) =>
				a2.topicId === sort.topicId &&
				a2.typeIndex ===
					filteredState.filter((a2) => a2.topicId === sort.topicId).indexOf(sort),
		);
		const item = {
			index,
			sort,
		};
		if (index !== -1) {
			firstSorts.push(item);
		} else {
			secondSorts.push(item);
		}
	}

	const sorted = crossSort(firstSorts, (a, b) => {
		return a.index - b.index;
	});
	const newState: OmniSort[] = [];

	let startingSecondIndex = -1;
	for (const sort of sorted) {
		newState.push(sort.sort);

		if (
			startingSecondIndex === -1 &&
			!PLACE_UNSORTED_AFTER_TOPIC_IDS.includes(sort.sort.topicId)
		) {
			startingSecondIndex = newState.length;
		}
	}
	for (const sort of secondSorts) {
		if (startingSecondIndex === -1 || !String(sort.sort.topicId).startsWith("rosealCustom_")) {
			newState.push(sort.sort);
		} else {
			newState.splice(startingSecondIndex - 1, 0, sort.sort);
			startingSecondIndex++;
		}
	}

	return newState;
}

export type HomeSortingLayoutItemSort = {
	type: "sort";
	sort: OmniSort;
	typeIndex: number;
	parent: OmniSort | undefined;
	totalIndexes: number;
	playlist?: CustomHomePlaylist;
	playlistIndex: number;
};

export type HomeSortingLayoutItemExperience = {
	type: "experience";
	playlistId: string;
	playlistDndId: string;
	experienceId: number;
};

export type HomeSortingTreeLayoutItem = {
	data: HomeSortingLayoutItemSort | HomeSortingLayoutItemExperience;
	id: string;
	parent: number | string;
	text: string;
};

export function getTreeLayout(
	state: OmniSort[] | undefined,
	playlists?: CustomHomePlaylist[],
	playlistUniverseData?: DevelopUniverse[],
) {
	const items: HomeSortingTreeLayoutItem[] = [];

	if (state) {
		for (const sort of state) {
			const all: OmniSort[] = [];
			let parentSort: OmniSort | undefined;
			for (const sort2 of state) {
				if (sort.topicId === sort2.topicId) {
					all.push(sort2);
					if (sort2.topic) {
						parentSort = sort2;
					}
				}
			}

			let playlistIndex = -1;
			let playlist: CustomHomePlaylist | undefined;

			if (
				playlists &&
				typeof sort.topicId === "string" &&
				sort.topicId.startsWith("rosealCustom_")
			) {
				for (let i = 0; i < playlists.length; i++) {
					const item = playlists[i];

					if (sort.topicId === `rosealCustom_${item.id}`) {
						playlist = item;
						playlistIndex = i;

						break;
					}
				}
			}

			const index = all.indexOf(sort);
			const dndId = `${sort.topicId}_${index}`;

			items.push({
				data: {
					type: "sort",
					sort: sort,
					typeIndex: index,
					parent: parentSort,
					totalIndexes: all.length,
					playlist,
					playlistIndex,
				},
				id: dndId,
				parent: 0,
				text: sort.topic ?? parentSort?.topic ?? "",
			});

			if (playlist) {
				for (const experience of playlist.items) {
					let data: DevelopUniverse | undefined;
					if (playlistUniverseData)
						for (const developItem of playlistUniverseData) {
							if (developItem.id === experience.id) {
								data = developItem;
								break;
							}
						}

					items.push({
						data: {
							type: "experience",
							experienceId: experience.id,
							playlistId: playlist.id,
							playlistDndId: dndId,
						},
						id: `${dndId}_${experience.id}`,
						parent: dndId,
						text: data?.name ?? "???",
					});
				}
			}
		}
	}

	return items;
}
