export const BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY = "bypassR6RestrictionModal";

export const THUMBNAIL_CUSTOMIZATION_LIMITS = {
	Avatar: {
		lowerBounds: {
			fieldOfViewDeg: 15,
			yRotDeg: -60,
			distanceScale: 1,
		},
		upperBounds: {
			fieldOfViewDeg: 45,
			yRotDeg: 60,
			distanceScale: 1,
		},
	},
	AvatarHeadShot: {
		lowerBounds: {
			fieldOfViewDeg: 15,
			yRotDeg: -60,
			distanceScale: 0.5,
		},
		upperBounds: {
			fieldOfViewDeg: 45,
			yRotDeg: 60,
			distanceScale: 4,
		},
	},
};

export const AVATAR_ITEM_LISTS_STORAGE_KEY = "avatarItemLists";

export type AvatarItemListItemType = "Asset" | "UserOutfit";

export type AvatarItemListItem = {
	id: number;
	type: AvatarItemListItemType;
};

export type AvatarItemList = {
	type: "List";
	id: string;
	name: string;
	items: AvatarItemListItem[];
};

export type AvatarItemListGroup = {
	type: "Group";
	id: string;
	name?: string;
	items: AvatarItemList[];
	isDefault?: boolean;
};

export type AvatarItemListsStorageValue = {
	lists: (AvatarItemList | AvatarItemListGroup)[];
};

export type AvatarExpandedListItem = {
	type: "List";
	dndId: string;
	parent: string | number;
} & AvatarItemList;

export type AvatarExpandedGroupItem = {
	id: string;
	dndId: string;

	parent: 0;
	type: "Group";
	name?: string;
	isDefault?: boolean;
};

export type AvatarAnyExpandedItem = AvatarExpandedListItem | AvatarExpandedGroupItem;

export const MAX_ITEM_LIST_NAME_LENGTH = 20;
