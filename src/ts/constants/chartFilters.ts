import type { UniverseAvatarType } from "../helpers/requests/services/universes";

export const ages = [5, 9, 13, 17, 18] as const;

export type ChartFilterAvatarType = UniverseAvatarType | "All";
export type ChartFiltersState = {
	likeRatio: [number, number];
	playerCount: [number, number];
	favoriteCount: [number, number];
	visitCount: [number, number];
	maxPlayerCount: [number, number];
	playerAvatarType: ChartFilterAvatarType;
	createdYear?: number[];
	age: (typeof ages)[number][];
};

export const defaultChartFiltersState: ChartFiltersState = {
	likeRatio: [0, 0],
	playerCount: [0, 0],
	favoriteCount: [0, 0],
	visitCount: [0, 0],
	maxPlayerCount: [0, 0],
	playerAvatarType: "All",
	age: [5, 9, 13, 17, 18],
};

export const contentRestrictionToAge = {
	AllAges: 0,
	NinePlus: 9,
	ThirteenPlus: 13,
	SeventeenPlus: 17,
	EighteenPlus: 18,
};

export const ageRestrictionsToCheck = [17, 18];
