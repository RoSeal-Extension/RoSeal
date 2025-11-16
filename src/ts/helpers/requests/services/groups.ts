import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache, getOrSetCaches } from "../../cache.ts";
import { httpClient } from "../main.ts";
import type { SortOrder } from "./badges.ts";
import type { HTTPRequestCredentials } from "@roseal/http-client/src/classes/HTTPClient.ts";

export type GroupV2Owner = {
	id: number;
	type: string;
	name?: string;
};

export type GroupV2 = {
	id: number;
	name: string;
	description: string;
	owner: GroupV2Owner | null;
	created: string;
	memberCount?: number;
	hasVerifiedBadge: boolean;
};

export type MultigetGroupsByIdsRequest = {
	groupIds: number[];
	overrideCache?: boolean;
};

export type MultigetGroupsByIdsRawResponse = {
	data: GroupV2[];
};

export type GetGroupByIdRequest = {
	groupId: number;
};

export type GetOpenCloudGroupRequest = {
	credentials: HTTPRequestCredentials;
	groupId: number;
};

export type GroupMemberLegacy = {
	id: number;
	name: string;
};

export type GroupRoleLegacy = {
	name: string;
	rank: number;
};

export type GetGroupByIdLegacyResponse = {
	name: string;
	id: number;
	owner: GroupMemberLegacy | null;
	emblemUrl: string | null;
	description: string;
	roles: GroupRoleLegacy[];
};

export type LookupGroupByNameRequest = {
	groupName: string;
};

export type SearchedGroup = {
	id: number;
	name: string;
	memberCount: number;
	hasVerifiedBadge: boolean;
};

export type LookupGroupByNameResponse = {
	data: SearchedGroup[];
};

export type BuildersClubMembershipType = "None" | "BC" | "TBC" | "OBC" | "RobloxPremium";

export type GroupMemberV1 = {
	buildersClubMembershipType: BuildersClubMembershipType;
	hasVerifiedBadge: boolean;
	userId: number;
	username: string;
	displayName: string;
};

export type GroupShoutV1 = {
	body: string;
	poster: GroupMemberV1;
	created: string;
	updated: string;
};

export type GroupV1 = {
	id: number;
	name: string;
	description: string;
	owner: GroupMemberV1 | null;
	shout: GroupShoutV1 | null;
	memberCount: number;
	isBuildersClubOnly: boolean;
	publicEntryAllowed: boolean;
	isLocked: boolean;
	hasVerifiedBadge: boolean;
};

export type ListUserPendingGroupsResponse = {
	data: GroupV1[];
};

export type DeleteUserGroupMembershipRequest = {
	groupId: number;
	userId: number;
};

export type GroupRoleV1 = {
	id: number;
	name: string;
	rank: number;
};

export type GroupV1WithRole = {
	group: GroupV1;
	role: GroupRoleV1;
	isPrimaryGroup?: boolean;
	isNotificationsEnabled: boolean;
};

export type ListUserGroupsRolesRequest = {
	userId: number;
	includeNotificationPreferences?: boolean;
	includeLocked?: boolean;
};

export type MultiGroupV1WithRole = {
	data: GroupV1WithRole[];
};

export type MultigetGroupsPoliciesRequest = {
	groupIds: number[];
};

export type GroupPolicy = {
	canViewGroup: boolean;
	groupId: number;
};

export type MultigetGroupsPoliciesResponse = {
	groups: GroupPolicy[];
};

export type SetGroupNotificationSettingRequest = {
	groupId: number;
	notificationsEnabled: boolean;
};

export type GroupShoutNotificationPreferences = {
	groupName: string;
	localizedGroupName: string;
	groupIcon: string;
	notificationTypePreferences: null;
	localizedGroupDescription: string;
	notificationsEnabledExperiences: null;
	notificationsEnabledGroups: number[];
	restrictedAccess: boolean;
};

export type GetGroupShoutNotificationPreferencesResponse = {
	groupShoutPreferences: GroupShoutNotificationPreferences;
};

export type GetGroupGuildedShoutRequest = {
	groupId: number;
};

export type GroupGuildedShout = {
	id: string;
	communityId: string;
	announcementChannelId: string;
	announcementId: string;
	title: string;
	content: string;
	imageURL: string;
	likeCount: number;
	createdAt: string;
	updatedAt: string;
	createdBy: number;
	userHasReactedToShout: boolean;
};

export type GroupsMetadata = {
	groupLimit: number;
	currentGroupCount: number;
	groupStatusMaxLength: number;
	groupPostMaxLength: number;
	isGroupWallNotificationsEnabled: boolean;
	groupWallNotificationsSubscribeIntervalInMilliseconds: number;
	areProfileGroupsHidden: boolean;
	isGroupDetailsPolicyEnabled: boolean;
	showPreviousGroupNames: boolean;
	areGroupBansEnabled: boolean;
};

export type GroupDetails = {
	id: number;
	name: string;
	description: string;
	owner: GroupMemberV1 | null;
	shout: GroupShoutV1 | null;
	memberCount: number;
	isBuildersClubOnly: boolean;
	publicEntryAllowed: boolean;
	hasVerifiedBadge: boolean;
};

export type GroupRoleDetails = {
	id: number;
	name: string;
	description: string;
	rank: number;
	memberCount: number;
};

export type MultigetGroupRolesByIdsRequest = {
	ids: number[];
};

export type MultigetGroupRolesByIdsResponse = {
	data: GroupRoleDetails[];
};

export type ListGroupRolesRequest = {
	groupId: number;
};

export type ListGroupRolesResponse = {
	groupId: number;
	roles: GroupRoleDetails[];
};

export type ListGroupMembersRequest = {
	groupId: number;
	limit?: number;
	cursor?: string;
	sortOrder: SortOrder;
};

export type ListGroupRoleMembersRequest = ListGroupMembersRequest & {
	roleId: number;
};

export type GroupMemberV1WithRole = {
	user: GroupMemberV1;
	role: GroupRoleV1;
};

export type ListGroupMembersResponse = {
	data: GroupMemberV1WithRole[];
	nextPageCursor: string | null;
	previousPageCursor: string | null;
};
export type ListGroupRoleMembersResponse = {
	data: GroupMemberV1[];
	nextPageCursor: string | null;
	previousPageCursor: string | null;
};

export type ListGroupMembersV2Request = {
	credentials: HTTPRequestCredentials;
	groupId: number;
	maxPageSize?: number;
	pageToken?: string;
	filter?: string;
};

export type GroupMembershipV2 = {
	path: string;
	createTime: string;
	updateTime: string;
	user: string;
	role: string;
};

export type ListGroupMembersV2Response = {
	groupMemberships: GroupMembershipV2[];
	nextPageToken: string;
};

export type OpenCloudGroupDetails = {
	path: string;
	createTime: string;
	updateTime: string;
	id: string;
	displayName: string;
	description: string | null;
	owner: string | null;
	memberCount: number;
	publicEntryAllowed: boolean;
	locked: boolean;
	verified: boolean;
};

export async function getGroupShoutNotificationPreferences() {
	return (
		await httpClient.httpRequest<GetGroupShoutNotificationPreferencesResponse>({
			url: getRobloxUrl("notifications", "/v2/notifications/group-shout-preferences"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getGroupGuildedShout({ groupId }: GetGroupGuildedShoutRequest) {
	return (
		await httpClient.httpRequest<GroupGuildedShout | undefined>({
			url: `${getRobloxUrl("apis")}/community-links/v1/groups/${groupId}/shout`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export function getOpenCloudGroup({ credentials, groupId }: GetOpenCloudGroupRequest) {
	return getOrSetCache({
		key: ["groups", groupId, "openCloudDetails"],
		fn: () =>
			httpClient
				.httpRequest<OpenCloudGroupDetails>({
					url: `${getRobloxUrl("apis")}/cloud/v2/groups/${groupId}`,
					credentials,
					errorHandling: "BEDEV2",
				})
				.then((res) => res.body),
	});
}

export function multigetGroupsByIds({ groupIds, overrideCache }: MultigetGroupsByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["groups", "details"],
		keys: groupIds.map((id) => ({
			id,
		})),
		fn: (groups) =>
			httpClient
				.httpRequest<MultigetGroupsByIdsRawResponse>({
					url: getRobloxUrl("groups", "/v2/groups"),
					search: {
						groupIds: groups.map((group) => group.id),
					},
				})
				.then((data) => {
					const items: Record<number, GroupV2> = {};

					for (const group of data.body.data) {
						items[group.id] = group;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 50,
	});
}

export async function setGroupNotificationSetting({
	groupId,
	...request
}: SetGroupNotificationSettingRequest) {
	await httpClient.httpRequest({
		url: `${getRobloxUrl("groups")}/v1/groups/${groupId}/notification-preference`,
		method: "PATCH",
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function getGroupByIdLegacy({ groupId }: GetGroupByIdRequest) {
	return getOrSetCache({
		key: ["groups", groupId, "legacyDetails"],
		fn: () =>
			httpClient
				.httpRequest<GetGroupByIdLegacyResponse>({
					url: `${getRobloxUrl("groups")}/v0/groups/${groupId}`,
					camelizeResponse: true,
				})
				.then((res) => res.body),
	});
}

export async function getGroupById({ groupId }: GetGroupByIdRequest) {
	return getOrSetCache({
		key: ["groups", groupId, "details"],
		fn: () =>
			httpClient
				.httpRequest<GroupDetails>({
					url: `${getRobloxUrl("groups")}/v1/groups/${groupId}`,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => res.body),
	});
}

export async function lookupGroupByName(request: LookupGroupByNameRequest) {
	return (
		await httpClient.httpRequest<LookupGroupByNameResponse>({
			url: getRobloxUrl("groups", "/v1/groups/search/lookup"),
			search: request,
		})
	).body;
}

export async function listUserPendingGroups() {
	return (
		await httpClient.httpRequest<ListUserPendingGroupsResponse>({
			url: getRobloxUrl("groups", "/v1/user/groups/pending"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function deleteUserGroupMembership(
	request: DeleteUserGroupMembershipRequest,
): Promise<void> {
	await httpClient.httpRequest<void>({
		url: `${getRobloxUrl("groups")}/v1/groups/${request.groupId}/join-requests/users/${
			request.userId
		}`,
		method: "DELETE",
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function listUserGroupsRoles({
	userId,
	...request
}: ListUserGroupsRolesRequest): Promise<MultiGroupV1WithRole> {
	return (
		await httpClient.httpRequest<MultiGroupV1WithRole>({
			url: `${getRobloxUrl("groups")}/v1/users/${userId}/groups/roles`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function multigetGroupsPolicies(request: MultigetGroupsPoliciesRequest) {
	return (
		await httpClient.httpRequest<MultigetGroupsPoliciesResponse>({
			url: getRobloxUrl("groups", "/v1/groups/policies"),
			method: "POST",
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getGroupsMetadata() {
	return (
		await httpClient.httpRequest<GroupsMetadata>({
			url: getRobloxUrl("groups", "/v1/groups/metadata"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function multigetGroupRolesByIds(request: MultigetGroupRolesByIdsRequest) {
	return (
		await httpClient.httpRequest<MultigetGroupRolesByIdsResponse>({
			url: getRobloxUrl("groups", "/v1/roles"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listGroupMembers({
	groupId,
	...request
}: ListGroupMembersRequest): Promise<ListGroupMembersResponse> {
	return (
		await httpClient.httpRequest<ListGroupMembersResponse>({
			url: `${getRobloxUrl("groups")}/v1/groups/${groupId}/users`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listGroupRoles({ groupId }: ListGroupRolesRequest) {
	return (
		await httpClient.httpRequest<ListGroupRolesResponse>({
			url: `${getRobloxUrl("groups")}/v1/groups/${groupId}/roles`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listGroupRoleMembers({
	groupId,
	roleId,
	...request
}: ListGroupRoleMembersRequest) {
	return (
		await httpClient.httpRequest<ListGroupRoleMembersResponse>({
			url: `${getRobloxUrl("groups")}/v1/groups/${groupId}/roles/${roleId}/users`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listGroupMembersV2({
	groupId,
	credentials,
	...request
}: ListGroupMembersV2Request) {
	return (
		await httpClient.httpRequest<ListGroupMembersV2Response>({
			url: `${getRobloxUrl("apis")}/cloud/v2/groups/${groupId}/memberships`,
			search: request,
			credentials,
			errorHandling: "BEDEV2",
		})
	).body;
}
