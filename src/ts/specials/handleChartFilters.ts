import { defaultChartFiltersState, type ChartFiltersState } from "../constants/chartFilters.ts";
import {
	type ListExperienceSortsResponse,
	type ExperienceSort,
	multigetUniversesAgeRecommendations,
	multigetUniversesByIds,
	type UniverseDetail,
	type ListedExperience,
} from "../helpers/requests/services/universes.ts";
import { addMessageListener } from "../helpers/communication/dom.ts";
import { hijackState } from "../helpers/hijack/react.ts";
import { compareArrays } from "../utils/objects.ts";
import type { SearchedExperience } from "../helpers/requests/services/misc.ts";

export type ExperienceList = (
	| ListExperienceSortsResponse
	| ExperienceSort
	| SearchedExperience[]
) & {
	__FROM_FILTER?: boolean;
};

export function handleChartFilters() {
	const universeCache: Record<number, UniverseDetail | null> = {};
	const universeAgeRatingCache: Record<number, number> = {};
	const rows: Record<string, [(value: ExperienceList) => void, ExperienceList]> = {};
	const newSorts: Record<string, (ListedExperience | SearchedExperience)[]> = {};

	let hasSetFilters = false;
	let filters: ChartFiltersState = defaultChartFiltersState;

	const checkValue = (value: number, min: number, max: number) => {
		return (!min || value >= min) && (!max || value <= max);
	};
	const filterItem = (item: ListedExperience | SearchedExperience) => {
		const {
			likeRatio: [minLikeRatio, maxLikeRatio],
			playerCount: [minPlayerCount, maxPlayerCount],
			favoriteCount: [minFavoriteCount, maxFavoriteCount],
			visitCount: [minVisitCount, maxVisitCount],
			maxPlayerCount: [minMaxPlayerCount, maxMaxPlayerCount],
			playerAvatarType,
			createdYear,
			age: minimumAge,
		} = filters;

		if (!item.universeId || !hasSetFilters) return true;
		const moreDetails = universeCache[item.universeId];
		if (!moreDetails) return false;

		let age = universeAgeRatingCache[item.universeId];

		// Unrated is -1, same as 13+
		if (age === -1) {
			age = 13;
		}
		const isAllAges = compareArrays(minimumAge, defaultChartFiltersState.age);
		if (!isAllAges && age === undefined) return false;

		const likeRatio =
			(item.totalUpVotes / (item.totalDownVotes + item.totalUpVotes)) * 100 || 0;

		const experienceCreatedYear = createdYear
			? new Date(moreDetails.created).getUTCFullYear()
			: undefined;

		return (
			checkValue(likeRatio, minLikeRatio, maxLikeRatio) &&
			checkValue(item.playerCount, minPlayerCount, maxPlayerCount) &&
			checkValue(moreDetails.favoritedCount, minFavoriteCount, maxFavoriteCount) &&
			checkValue(moreDetails.visits, minVisitCount, maxVisitCount) &&
			checkValue(moreDetails.maxPlayers, minMaxPlayerCount, maxMaxPlayerCount) &&
			(playerAvatarType === "All" || playerAvatarType === moreDetails.universeAvatarType) &&
			(!experienceCreatedYear ||
				!createdYear ||
				createdYear.includes(experienceCreatedYear)) &&
			(isAllAges || minimumAge.includes(age as 5))
		);
	};

	const modifyState = (value: ExperienceList) => {
		if ("sorts" in value) {
			return {
				...value,
				__FROM_FILTER: true,
				sorts: value.sorts.map((sort) => {
					if (!("games" in sort)) {
						return sort;
					}

					newSorts[sort.sortId] ??= [];

					for (const game of sort.games) {
						if (
							game &&
							!newSorts[sort.sortId].find(
								(item) => item.universeId === game.universeId,
							)
						) {
							newSorts[sort.sortId].push(game);
						}
					}

					const games = newSorts[sort.sortId].filter(filterItem);
					if (!games.length) {
						games.length = 1;
					}

					return {
						...sort,
						games,
					};
				}),
			};
		}

		if ("games" in value) {
			newSorts[value.sortId] ??= [];
			for (const game of value.games) {
				if (
					game &&
					!newSorts[value.sortId].find((item) => item.universeId === game.universeId)
				) {
					newSorts[value.sortId].push(game);
				}
			}
			const games = newSorts[value.sortId].filter(filterItem);
			if (!games.length) {
				games.length = 1;
			}

			return {
				...value,
				__FROM_FILTER: true,
				games,
			};
		}

		newSorts.search ??= [];
		for (const item of value) {
			if (item && !newSorts.search.find((item2) => item.universeId === item2.universeId)) {
				newSorts.search.push(item);
			}
		}

		const games = newSorts.search.filter(filterItem) as ExperienceList;
		games.__FROM_FILTER = true;

		return games;
	};

	const refresh = (clearFirst = false, universeIds?: number[]) => {
		for (const [setState, state] of Object.values(rows)) {
			const value = modifyState(state);

			let check = false;
			if (universeIds) {
				if ("sorts" in value) {
					for (const sort of value.sorts) {
						if (sort.contentType === "Games") {
							for (const item of sort.games) {
								if (item && universeIds.includes(item.universeId)) {
									check = true;
									break;
								}
							}
						}
					}
				} else {
					if ("games" in value) {
						for (const item of value.games) {
							if (universeIds.includes(item.universeId)) {
								check = true;
								break;
							}
						}
					}

					if (Array.isArray(value)) {
						for (const item of value) {
							if (item && universeIds.includes(item.universeId)) {
								check = true;
								break;
							}
						}
					}
				}
			}

			if (!universeIds || check) {
				if (clearFirst) {
					if ("sorts" in value) {
						setState({
							sorts: [],
							__FROM_FILTER: true,
						});
					} else if ("games" in value) {
						setState({
							...value,
							games: [],
							__FROM_FILTER: true,
						});
					} else if (Array.isArray(value)) {
						const value = [] as ExperienceList;
						value.__FROM_FILTER = true;

						setState(value);
					}
				}
				setState(value as ExperienceList);
			}
		}
	};

	return [
		hijackState<ExperienceList>({
			matches: (value: unknown) =>
				value !== null &&
				typeof value === "object" &&
				("__FROM_FILTER" in value ||
					("sorts" in value && Array.isArray(value.sorts)) ||
					("games" in value && Array.isArray(value.games)) ||
					(Array.isArray(value) &&
						typeof value[0] === "object" &&
						"contentType" in value[0] &&
						"contentId" in value[0])),
			onStateRemoved: (id) => {
				delete rows[id];
			},
			onlyFromSiteUpdate: true,
			setState: ({ value, publicSetState, id }) => {
				(async () => {
					const universeIds: number[] = [];

					if ("sorts" in value.current) {
						for (const sort of value.current.sorts) {
							if (sort.contentType === "Games") {
								for (const item of sort.games) {
									if (
										item?.universeId &&
										universeCache[item.universeId] === undefined
									) {
										universeIds.push(item.universeId);
										universeCache[item.universeId] = null;
									}
								}
							}
						}
					} else if ("games" in value.current) {
						for (const item of value.current.games) {
							if (item.universeId && universeCache[item.universeId] === undefined) {
								universeIds.push(item.universeId);
								universeCache[item.universeId] = null;
							}
						}
					} else {
						for (const item of value.current) {
							if (item?.universeId && universeCache[item.universeId] === undefined) {
								universeIds.push(item.universeId);
								universeCache[item.universeId] = null;
							}
						}
					}

					if (!universeIds.length) return;

					const universeDataPromise = multigetUniversesByIds({
						universeIds,
					}).then((data) => {
						for (const item of data) {
							universeCache[item.id] = item;
						}
					});

					const ageRecommendationsPromise = multigetUniversesAgeRecommendations({
						universeIds,
					}).then((data) => {
						for (const item of data.ageRecommendationDetailsByUniverse) {
							universeAgeRatingCache[item.universeId] =
								item.ageRecommendationDetails.ageRecommendationSummary
									.ageRecommendation?.minimumAge ?? 13;
						}
					});

					Promise.all([universeDataPromise, ageRecommendationsPromise]).then(() => {
						if (hasSetFilters) {
							refresh(false, universeIds);
						}
					});
				})();

				rows[id] = [(value) => publicSetState(value), value.current];
				return modifyState(value.current);
			},
		}),
		addMessageListener("charts.setFilters", (args) => {
			filters = args;
			hasSetFilters = true;

			refresh(true);
		}),
	];
}
