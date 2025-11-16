import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";
import { getOrSetCache, getOrSetCaches } from "../../cache.ts";
import type { GroupMemberV1, GroupRoleV1 } from "./groups.ts";
import type { MarketplaceItemType } from "./marketplace.ts";

export type AssetPermissionAction =
	| "Invalid"
	| "Edit"
	| "Use"
	| "CreateAssetVersion"
	| "GrantAssetPermissions"
	| "CreateAssetFromAsset"
	| "CopyFromRcc"
	| "UpdateFromRcc";

export type AssetPermissionSubjectType =
	| "User"
	| "Universe"
	| "Group"
	| "GroupRoleset"
	| "All"
	| "Invalid";

export type AssetPermissionSubject = {
	subjectType: AssetPermissionSubjectType;
	subjectId: number | string;
};

export type AssetPermissionRequest = {
	assetId: number;
	action: AssetPermissionAction;
	subject: AssetPermissionSubject;
};

export type CheckAssetPermissionsRequest = {
	requests: AssetPermissionRequest[];
};

export type AssetPermissionError = {
	code: string;
	message: string;
};

export type AssetPermissionStatus =
	| "HasPermission"
	| "NoPermission"
	| "UnknownError"
	| "AssetNotFound";

export type AssetPermissionValue = {
	status: AssetPermissionStatus;
};

export type AssetPermissionResult = {
	error?: AssetPermissionError;
	value?: AssetPermissionValue;
};

export type CheckAssetPermissionsResponse = {
	results: AssetPermissionResult[];
};

export type GetCreatorBundleDetailsRequest = {
	bundleId: number;
};

export type CreatorBundleDetailsInfo = {
	id: number;
	name: string;
	moderationStatus: number;
	saleStatus: number;
	price: null | number;
	createdTime: string;
	bundleType: string;
};

export type CreatorBundleDetailsItem = {
	id: number;
	type: number;
};

export type CreatorBundleDetails = {
	bundleInfo: CreatorBundleDetailsInfo;
	description: string;
	hasBeenOnSale: false;
	items: CreatorBundleDetailsItem[];
};

export type UserManagedGroup = {
	id: number;
	name: string;
};

export type ListUserManagedGroupsResponse = {
	data: UserManagedGroup[];
};

export type UniversePermissionData = {
	universeId: number;
	canManage: boolean;
	canCloudEdit: boolean;
};

export type MultigetUniversePermissionsRequest = {
	universeIds: number[];
};

export type MultigetUniversePermissionsResponse = {
	data: UniversePermissionData[];
};

export type GetGroupMembershipRequest = {
	groupId: number;
	includeNotificationPreferences?: boolean;
};

export type GroupMembershipUserRole = {
	user: GroupMemberV1;
	role: GroupRoleV1;
};

export type GroupMembershipPermissions = {
	groupPostsPermissions: {
		viewWall: boolean;
		postToWall: boolean;
		deleteFromWall: boolean;
		viewStatus: boolean;
		postToStatus: boolean;
	};
	groupForumsPermissions: {
		manageCategories: boolean;
		createPosts: boolean;
		removePosts: boolean;
		lockPosts: boolean;
		pinPosts: boolean;
		createComments: boolean;
		removeComments: boolean;
	};
	groupMembershipPermissions: {
		changeRank: boolean;
		inviteMembers: boolean;
		removeMembers: boolean;
	};
	groupManagementPermissions: {
		manageRelationships: boolean;
		manageClan: boolean;
		viewAuditLogs: boolean;
		banMembers: boolean;
	};
	groupEconomyPermissions: {
		spendGroupFunds: boolean;
		advertiseGroup: boolean;
		createItems: boolean;
		manageItems: boolean;
		addGroupPlaces: boolean;
		manageGroupGames: boolean;
		viewGroupPayouts: boolean;
		viewAnalytics: boolean;
	};
	groupOpenCloudPermissions: {
		useCloudAuthentication: boolean;
		administerCloudAuthentication: boolean;
	};
};

export type GroupMembership = {
	groupId: number;
	isPrimary: boolean;
	isPendingJoin: boolean;
	userRole: GroupMembershipUserRole;
	permissions: GroupMembershipPermissions;
	areGroupGamesVisible: boolean;
	areGroupFundsVisible: boolean;
	areEnemiesAllowed: boolean;
	canConfigure: boolean;
	isNotificationsEnabled?: boolean;
	isBannedFromGroup?: boolean;
	IsBanEvading?: boolean;
};

export type CanConfigureCollectibleItemRequest = {
	targetType: MarketplaceItemType;
	targetId: number;
};

export type CanConfigureCollectibleItemResponse = {
	isAllowed: boolean;
	denialReason: number;
};

export type MultigetCanSponsorItemRequest = {
	campaignTargetType: "Universe" | "Asset";
	campaignTargetIds: number[];
};

export async function checkAssetPermissions(request: CheckAssetPermissionsRequest) {
	return (
		await httpClient.httpRequest<CheckAssetPermissionsResponse>({
			url: getRobloxUrl("apis", "/asset-permissions-api/v1/assets/check-permissions"),
			method: "POST",
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getCreatorBundleDetails({ bundleId }: GetCreatorBundleDetailsRequest) {
	return (
		await httpClient.httpRequest<CreatorBundleDetails>({
			url: `${getRobloxUrl("itemconfiguration")}/v1/bundles/${bundleId}`,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function listUserManagedGroups() {
	return (
		await httpClient.httpRequest<ListUserManagedGroupsResponse>({
			url: `${getRobloxUrl("develop")}/v1/user/groups/canmanage`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserManagedItemsGroups() {
	return (
		await httpClient.httpRequest<ListUserManagedGroupsResponse>({
			url: `${getRobloxUrl("develop")}/v1/user/groups/canmanagegamesoritems`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function multigetUniversePermissions({
	universeIds,
}: MultigetUniversePermissionsRequest) {
	return getOrSetCaches({
		baseKey: ["universes", "permissions"],
		keys: universeIds.map((id) => ({
			id,
		})),
		fn: (request) =>
			httpClient
				.httpRequest<MultigetUniversePermissionsResponse>({
					url: getRobloxUrl("develop", "/v1/universes/multiget/permissions"),
					search: {
						ids: request.map((id) => id.id),
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => {
					const items: Record<number, UniversePermissionData> = {};
					for (const item of data.body.data) {
						items[item.universeId] = item;
					}

					return items;
				}),
	});
}

export async function getGroupMembership({ groupId, ...request }: GetGroupMembershipRequest) {
	return getOrSetCache({
		key: ["groups", groupId, "membership", request.includeNotificationPreferences],
		fn: () =>
			httpClient
				.httpRequest<GroupMembership>({
					url: `${getRobloxUrl("groups")}/v1/groups/${groupId}/membership`,
					search: request,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => data.body),
	});
}

export async function canConfigureCollectibleItem(request: CanConfigureCollectibleItemRequest) {
	return getOrSetCache({
		key: ["items", request.targetType, request.targetId, "canConfigure"],
		fn: () =>
			httpClient
				.httpRequest<CanConfigureCollectibleItemResponse>({
					url: getRobloxUrl(
						"itemconfiguration",
						"/v1/collectibles/check-item-configuration-access",
					),
					search: request,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => data.body),
	});
}

export async function multigetCanSponsorItems(request: MultigetCanSponsorItemRequest) {
	return getOrSetCaches({
		baseKey: ["canSponsorItems"],
		keys: request.campaignTargetIds.map((id) => ({
			id: `${request.campaignTargetType}/${id}`,
		})),
		fn: (items) =>
			httpClient
				.httpRequest<Record<number, boolean>>({
					url: getRobloxUrl(
						"adconfiguration",
						"/v2/sponsored-campaigns/multi-get-can-user-sponsor",
					),
					search: {
						campaignTargetType: request.campaignTargetType,
						campaignTargetIds: items,
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => {
					const items: Record<string, boolean> = {};
					for (const key in data.body) {
						items[`${request.campaignTargetType}/${key}`] = data.body[key];
					}

					return items;
				}),
	});
}
