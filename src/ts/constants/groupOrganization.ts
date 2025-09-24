import type { GroupV1WithRole } from "../helpers/requests/services/groups";

export type ExpandedGroupItem = {
	type: "Group";
	dndId: string;
	parent: string | number;
} & GroupV1WithRole;

export type ExpandedFolderItem = {
	id: string;
	dndId: string;

	parent: 0;
	type: "Folder";
	open?: boolean;
	name?: string;
	color?: string;
};

export type AnyExpandedItem = ExpandedGroupItem | ExpandedFolderItem;

export const GROUP_ORGANIZATION_STORAGE_KEY = "groupOrganization";

export type StoredFolderItem = {
	groups: number[];
	id: string;
	open?: boolean;
	name?: string;
	color?: string;
};

export type GroupOrganizationStorageValue = Record<number, (StoredFolderItem | number)[]>;

export const DEFAULT_FOLDER_COLOR = "#919191";

export const FOLDER_NAME_MAX_LENGTH = 25;
