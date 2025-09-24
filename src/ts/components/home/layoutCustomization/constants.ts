import type {
	OmniLayoutData,
	OmniSort,
	OmniTreatmentType,
} from "src/ts/helpers/requests/services/universes";

export const HOME_SORTS_LAYOUT_STORAGE_KEY = "homeSortsLayout";
export const ALLOWED_CUSTOMIZATION_TREATMENTS = ["SortlessGrid", "Carousel"];
export const MAX_PLAYLIST_NAME_LENGTH = 20;

export type CustomHomeSortItem = {
	id: number;
};

export type CustomHomePlaylist = {
	sortType: "Experiences";
	id: string;
	name: string;
	items: CustomHomeSortItem[];
};

export type HomeSortsLayoutStorageValue = {
	[key: number]: Layout;
	default?: number;
	_custom?: CustomHomePlaylist[];
};

export type TreeLayout = {
	sort: OmniSort;
	parent?: OmniSort;
	totalIndexes: number;
	typeIndex: number;
}[];

export type SortLayoutOverride = {
	[key in keyof OmniLayoutData]: OmniLayoutData[key] | "_setByRoblox" | "_default";
};

export type SortOverride = {
	layoutOverride: SortLayoutOverride;
	override: {
		accurate?: boolean;
		collapse?: boolean;
		hide?: boolean;
		shuffle?: boolean;
		treatmentType?: Exclude<OmniTreatmentType, "FriendCarousel"> | "_setByRoblox";
	};
};

export type SortWithOverrides = {
	topicId: number | string;
	typeIndex: number;
} & SortOverride;

export type Layout = {
	sorts: SortWithOverrides[];
};
