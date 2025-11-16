import type {
	UserPresenceLocationType,
	UserPresenceType,
	UserPresenceTypeId,
} from "src/ts/constants/presence.ts";
import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { getOrSetCache, getOrSetCaches } from "../../../helpers/cache.ts";
import { renderGenericChallenge } from "../../domInvokes.ts";
import { httpClient } from "../main.ts";
import type { SortOrder } from "./badges.ts";
import type { HTTPRequestCredentials } from "@roseal/http-client/src/classes/HTTPClient.ts";

export type GetUserByIdRequest = {
	userId: number;
	overrideCache?: boolean;
};

export type UserDetails = {
	description: string;
	created: string;
	isBanned: boolean;
	externalAppDisplayName: string | null;
	hasVerifiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
};

export type BlockUserRequest = {
	userId: number;
};

export type UnfriendUserRequest = {
	userId: number;
};

export type UnfollowUserRequest = {
	userId: number;
};

// 0 = some type of Alphabetical
// 1 = FriendScore
// 2 = Default, by added
export type UserFriendsSort = 0 | "FriendScore" | "Created";

export type LegacyListUserFriendsRequest = {
	userId: number;
	userSort?: UserFriendsSort;
};

export type UserFriendFollowerDetail = {
	isDeleted?: boolean;

	id: number;
};

export type ListUserFollowersResponse = {
	data: UserFriendFollowerDetail[];
	nextPageCursor: string | null;
	previousPageCursor: string | null;
};

export type MultigetUsersByNamesRequest = {
	overrideCache?: boolean;
	usernames: string[];
	excludeBannedUsers?: boolean;
};

export type RequestedUser = {
	hasVerifiedBadge: boolean;
	id: number;
	name: string;
	displayName: string;
};

export type RequestedUserFromUsername = RequestedUser & {
	requestedUsername: string;
};

export type MultigetUsersByNamesResponse = {
	data: RequestedUserFromUsername[];
};

export type MultigetUsersByIdsRequest = {
	overrideCache?: boolean;
	userIds: number[];
	excludeBannedUsers?: boolean;
};

export type MultigetUsersByIdsResponse = {
	data: RequestedUser[];
};

export type MultigetUsersPresencesRequest = {
	userIds: number[];
};

export type UserPresence = {
	userPresenceType: UserPresenceTypeId;
	lastLocation: string;
	placeId: number | null;
	rootPlaceId: number | null;
	gameId: string | null;
	universeId: number | null;
	userId: number;
	lastOnline?: string;
};

export type MultigetUsersPresencesResponse = {
	userPresences: UserPresence[];
};

export type MultigetFollowingStatusesRequest = {
	userIds: number[];
	overrideCache?: boolean;
};

export type FollowingStatus = {
	isFollowing: boolean;
	isFollowed: boolean;
	userId: number;
};

export type MultigetFollowingStatusesResponse = {
	followings: FollowingStatus[];
};

export type FriendStatus =
	| "Friends"
	| "NotFriends"
	| "RequestSent"
	| "RequestReceived"
	| "Ineligible";

export type TrustedFriendStatus = FriendStatus | "TrustedFriends" | "RequestIgnored";

export type GetUserFriendStatusRequest = {
	userId: number;
};

export type GetUserFriendsStatusRequest = {
	targetUserId: number;
	userIds: number[];
	overrideCache?: boolean;
};

export type UserFriendStatus = {
	id: number;
	status: FriendStatus;
};

export type GetUserFriendsStatusResponse = {
	data: UserFriendStatus[];
};

export type GetUserFriendStatusResponse = {
	status: FriendStatus;
};

export type GetUserTrustedFriendStatusResponse = {
	status: TrustedFriendStatus;
};

export type ProfileFieldName =
	| "displayName"
	| "combinedName"
	| "contactName"
	| "username"
	| "platformName"
	| "alias"
	| "inExperienceCombinedName";

export type ProfileField =
	| "platformProfileId"
	| "isVerified"
	| "isDeleted"
	| "inExperienceIsVerified";

export type MultigetProfileDataRequest<T extends ProfileField, U extends ProfileFieldName> = {
	userIds: number[];
	fields?: T[];
	nameFields?: U[];
};

export type ProfileDetailNames = {
	displayName: string;
	combinedName: string;
	contactName: string | null;
	username: string;
	platformName: string | null;
	alias: string | null;
	inExperienceCombinedName: string | null;
};

export type ProfileDetail<T extends ProfileField, U extends ProfileFieldName> = Omit<
	{
		userId: number;
		names: [U] extends [never] ? undefined : Pick<ProfileDetailNames, U>;
		isVerified: boolean;
		isDeleted: boolean;
		inExperienceIsVerified: boolean;
		platformProfileId?: string;
	},
	Exclude<ProfileField, T>
>;

export type MultigetProfileDataResponse<T extends ProfileField, U extends ProfileFieldName> = {
	profileDetails: ProfileDetail<T, U>[];
};

export type AcceptFriendRequestWithTokenRequest = {
	userId: number;
	friendingToken: string;
};

export type UserBlockedStatus = {
	userId: number;
	isBlocked: boolean;
};

export type CheckUsersBlockedResponse = {
	users: UserBlockedStatus[];
};

export type CheckUsersBlockedRequest = {
	userIds: number[];
	overrideCache?: boolean;
};

export type ProfileInsightsRankingStrategy = "tc_info_boost";

export type MultigetProfileInsightsRequest = {
	count?: number;
	rankingStrategy?: ProfileInsightsRankingStrategy;
	userIds: number[];
};

export type UserProfileInsightUser = {
	username: string;
	displayName: string;
};

export type UserProfileInsightMutualFriends = {
	mutualFriendInsight: {
		mutualFriends: Record<number, UserProfileInsightUser>;
	};
	insightCase: 1;
};

export type UserProfileInsightOfflineFrequents = {
	offlineFrequentsInsight: {
		havePlayedTogether: boolean;
	};
	insightCase: 1;
};

export enum FriendshipOriginSource {
	PLAYER_SEARCH = 1,
	IN_GAME = 2,
	PROFILE = 3,
	QQ_CONTACT_IMPORTER = 4,
	WECHAT_CONTACT_IMPORTER = 5,
	QR_CODE = 6,
	PROFILE_SHARE = 7,
	PHONE_CONTACT_IMPORTER = 8,
	FRIEND_RECOMMENDATIONS = 10,
}

export type UserProfileinsightFriendRequestOrigin = {
	friendRequestOriginInsight: {
		friendRequestOriginSource: number;
	};
	insightCase: 2;
};

export type UserProfileInsightFriendshipAge = {
	friendshipAgeInsight: {
		friendsSinceDateTime: {
			seconds: number;
			nanos: number;
		};
	};
	insightCase: 4;
};

export type UserProfileInsightUserAgeVerified = {
	userAgeVerifiedInsight: {
		verifiedAgeBandLabel:
			| "Label.AgeBandOver13"
			| "Label.AgeBandOver13Checked"
			| "Label.AgeBandOver18"
			| "Label.AgeBandOver18Checked"
			| "Label.AgeBandUnder13";
		namespace: string;
	};
	insightCase: 5;
};

export type UserProfileInsightAccountAgeDate = {
	accountCreationDateInsight: {
		accountCreatedDateTime: {
			seconds: number;
			nanos: number;
		};
	};
	insightCase: 6;
};

export type UserProfileInsightAccountLocation = {
	accountLocationInsight: {
		accountLocationCode: string;
		localizedCountryName: string;
		locale: string;
	};
	insightCase: 7;
};

export type UserProfileInsight =
	| UserProfileInsightMutualFriends
	| UserProfileInsightOfflineFrequents
	| UserProfileinsightFriendRequestOrigin
	| UserProfileInsightFriendshipAge
	| UserProfileInsightAccountAgeDate
	| UserProfileInsightAccountLocation;

export type UserProfileInsightView = {
	targetUser: number;
	profileInsights: UserProfileInsight[];
};

export type MultigetProfileInsightsResponse = {
	userInsights: UserProfileInsightView[];
};

export type SkinnyUserFriend = {
	id: number;
};

export type ListUserFriendsRequest = {
	userId: number;
	userSort?: UserFriendsSort;
	cursor?: string;
	limit?: number;
	// 0 = All friends
	// 1 = Trusted friends
	findFriendsType?: 0 | 1;
};

export type ListUserFriendsResponse = {
	nextCursor?: string | null;
	previousCursor?: string | null;
	pageItems: SkinnyUserFriend[];
};

export type SearchUserFriendsRequest = {
	userId: number;
	query: string;
	userSort?: UserFriendsSort;
	cursor?: string;
	limit?: number;
};

export type ListUserFollowersRequest = {
	userId: number;
	cursor?: string;
	limit?: number;
	sortOrder?: SortOrder;
};

export type ListBlockedUsersRequest = {
	count: number;
	cursor?: string;
};
export type ListBlockedUsersData = {
	blockedUserIds: number[];
	cursor?: string | null;
};

export type ListBlockedUsersResponse = {
	data: ListBlockedUsersData | null;
	error: string | null;
};

export type ReciprocalUserBlockedStatus = {
	userId: number;
	isBlocked: boolean;
	isBlockingViewer: boolean;
};

export type CheckUsersReciprocalBlockedResponse = {
	users: ReciprocalUserBlockedStatus[];
};

export type OnlineFriendPresence = {
	userPresenceType: UserPresenceType;
	userLocationType: UserPresenceLocationType;
	lastLocation: string;
	placeId: number | null;
	rootPlaceId: number | null;
	gameInstanceId: string | null;
	universeId: number | null;
	lastOnline: string;
};
export type OnlineFriend = {
	userPresence: OnlineFriendPresence;
	id: number;
};

export type ListUserOnlineFriendsResponse = {
	data: OnlineFriend[];
};

export type UsernameHistoryItem = {
	name: string;
};

export type ListUserUsernameHistoryResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: UsernameHistoryItem[];
};

export type ListUserUsernameHistoryRequest = {
	userId: number;
	cursor?: string;
	limit?: number;
	sortOrder?: SortOrder;
};

export type ListUserRobloxCollectionsRequest = {
	userId: number;
};

export type RobloxCollectionItem = {
	id: number;
	assetSeoUrl: string;
	thumbnail: {
		final: boolean;
		url: string;
		retryUrl: string | null;
		userId: number;
		endpointType: "Avatar";
	};
	name: string;
	formatName: string | null;
	description: string;
	assetRestrictionIcon: {
		tooltipText: string | null;
		cssTag: string | null;
		loadAssetRestrictionIconCss: boolean;
		hasTooltip: boolean;
	};
	hasPremiumBenefit: boolean;
	assetAttribution: null;
};

export type ListUserFriendsFollowersCountRequest = {
	userId: number;
};

export type GetUserFriendsFollowersCountResponse = {
	count: number;
};

export type ListMyFriendRequestsRequest = {
	limit?: number;
	cursor?: string;
	sortOrder?: SortOrder;
};

export type FriendRequestOriginType =
	| "UserProfile"
	| "InGame"
	| "FriendRecommendations"
	| "PlayerSearch"
	| "QrCode"
	| "QqContactImporter"
	| "WeChatContactImporter"
	| "ProfileShare"
	| "PhoneContactImporter";
// | "OffNetworkFriendLink";

export type UserFriendRequestData = {
	sentAt: string;
	senderId: number;
	sourceUniverseId: number;
	originSourceType: FriendRequestOriginType;
	contactName: string | null;
	senderNickname: string | null;
};

export type UserFriendRequest = {
	friendRequest?: UserFriendRequestData;
	mutualFriendsList: string[];
	id: number;
	name: string;
	displayName: string;
};

export type ListMyFriendRequestsResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: UserFriendRequest[];
};

export type ListUserPlacesRequest = {
	userId: number;
};

export type ListedUserPlace = {
	plays: number;
	isOwned: boolean;
	totalUpVotes: number;
	totalDownVotes: number;
	universeID: number;
	description: string;
	name: string;
	placeID: number;
	playerCount: number;
};
export type ListUserPlacesResponse = {
	title: string;
	games: ListedUserPlace[];
};

export type DeclineAllMyFriendRequestsResponse = {
	backgrounded: boolean;
};

export type AcceptUserFriendRequestRequest = {
	userId: number;
};

export type RequestUserFriendshipRequest = {
	userId: number;
	friendshipOriginSourceType?: FriendRequestOriginType;
	senderNickname?: string;
};

export type RequestUserFriendshipResponse = {
	success: boolean;
	isCaptchaRequired: boolean;
};

export type ListUserFriendRecommendationsRequest = {
	userId: number;
	source: "AddFriendsPage";
};

export type UserFriendRecommendationContextType = "MutualFriends" | "Frequents" | "None";

export type UserFriendRecommendation = {
	friendRequest: UserFriendRequestData | null;
	contextType: UserFriendRecommendationContextType;
	mutualFriendsList: string[] | null;
	rank: number;
	contactId: null | number;
	avatarAssetHashId: number;
	recommendationType: "Roblox";
	id: number;
};

export type ListUserFriendRecommendationsResponse = {
	data: UserFriendRecommendation[];
	recommendationRequestId: string;
};

export type ListUserRobloxBadgesRequest = {
	userId: number;
};

export type RobloxAssignedBadge = {
	id: number;
	name: string;
	description: string;
	imageUrl: string;
};

export type MultigetUsersAreTrustedFriendsResponse = {
	trustedFriendsId: number[];
};

export type GetOpenCloudUserRequest = {
	credentials: HTTPRequestCredentials;
	userId: number;
};

export type GetOpenCloudUserResponse = {
	path: string;
	createTime: string;
	id: string;
	name: string;
	displayName: string;
	about: string;
	locale: string;
	premium?: boolean;
	idVerified?: boolean;
	socialNetworkProfiles?: {
		facebook: string | null;
		twitter: string | null;
		youtube: string | null;
		twitch: string | null;
		guilded: string | null;
		visibility: string;
	};
};

export type ProfileCustomizationEntity = {
	type: "User";
	id: string;
};

export type ProfileCustomizationAsset = {
	assetId: number;
};

export type ProfileCustomizationCustomizedComponents = {
	videoComponent?: ProfileCustomizationAsset | null;
	profileBackground?: ProfileCustomizationAsset | null;
};

export type ProfileCustomizationPinnedComponents = {
	components: unknown[];
};

export type ProfileCustomizationConfiguration = {
	profileEntity: ProfileCustomizationEntity;
	pinnedComponents: ProfileCustomizationPinnedComponents;
	customizedComponents: ProfileCustomizationCustomizedComponents;
};

export type UpdateProfileCustomizationRequest = {
	profileCustomization: Partial<ProfileCustomizationConfiguration>;
};

export function getUserPremiumStatus({ userId, overrideCache }: GetUserByIdRequest) {
	return getOrSetCache({
		key: ["users", userId, "premiumStatus"],
		fn: async () =>
			(
				await httpClient.httpRequest<boolean>({
					url: `${getRobloxUrl("premiumfeatures")}/v1/users/${userId}/validate-membership`,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
			).body,
		overrideCache,
	});
}

export function getUserById({ userId, overrideCache }: GetUserByIdRequest) {
	return getOrSetCache({
		key: ["users", userId, "details"],
		fn: async () =>
			(
				await httpClient.httpRequest<UserDetails>({
					url: `${getRobloxUrl("users")}/v1/users/${userId}`,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
			).body,
		overrideCache,
	});
}

export async function blockUser({ userId }: BlockUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("apis")}/user-blocking-api/v1/users/${userId}/block-user`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
		errorHandling: "BEDEV2",
	});
}

export async function checkUsersReciprocalBlocked({
	userIds,
	overrideCache,
}: CheckUsersBlockedRequest) {
	return getOrSetCaches({
		baseKey: ["users", "blockedStatuses", "reciprocal"],
		keys: userIds.map((id) => ({
			id,
		})),
		fn: async (data) =>
			httpClient
				.httpRequest<CheckUsersReciprocalBlockedResponse>({
					method: "POST",
					url: getRobloxUrl(
						"apis",
						"/user-blocking-api/v1/users/batch-check-reciprocal-block",
					),
					body: {
						type: "json",
						value: {
							userIds: data.map((id) => id.id),
						},
					},
					credentials: {
						type: "cookies",
						value: true,
					},
					errorHandling: "BEDEV2",
				})
				.then((res) => {
					const items: Record<number, ReciprocalUserBlockedStatus> = {};

					for (const user of res.body.users) {
						items[user.userId] = user;
					}

					return items;
				}),
		batchLimit: 50,
		overrideCache,
	});
}

export async function checkUsersBlocked({ userIds, overrideCache }: CheckUsersBlockedRequest) {
	return getOrSetCaches({
		baseKey: ["users", "blockedStatuses"],
		keys: userIds.map((id) => ({
			id,
		})),
		fn: async (data) =>
			httpClient
				.httpRequest<CheckUsersBlockedResponse>({
					method: "POST",
					url: getRobloxUrl("apis", "/user-blocking-api/v1/users/batch-is-blocked"),
					body: {
						type: "json",
						value: {
							userIds: data.map((id) => id.id),
						},
					},
					credentials: {
						type: "cookies",
						value: true,
					},
					errorHandling: "BEDEV2",
				})
				.then((res) => {
					const items: Record<number, UserBlockedStatus> = {};
					for (const user of res.body.users) {
						items[user.userId] = user;
					}

					return items;
				}),
		batchLimit: 50,
		overrideCache,
	});
}

export async function unblockUser({ userId }: BlockUserRequest): Promise<void> {
	await httpClient.httpRequest({
		method: "POST",
		url: `${getRobloxUrl("apis")}/user-blocking-api/v1/users/${userId}/unblock-user`,
		credentials: {
			type: "cookies",
			value: true,
		},
		errorHandling: "BEDEV2",
		expect: "none",
	});
}

export async function getUserIsBlocked({ userId }: BlockUserRequest): Promise<boolean> {
	return (
		await httpClient.httpRequest<boolean>({
			url: `${getRobloxUrl("apis")}/user-blocking-api/v1/users/${userId}/is-blocked`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listBlockedUsers(request: ListBlockedUsersRequest) {
	return (
		await httpClient.httpRequest<ListBlockedUsersResponse>({
			url: `${getRobloxUrl("apis", "/user-blocking-api/v1/users/get-blocked-users")}`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function unfriendUser({ userId }: UnfriendUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/unfriend`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function removeTrustedFriend({ userId }: UnfriendUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/remove-trusted-friend`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function acceptFriendRequestWithToken({
	userId,
	...request
}: AcceptFriendRequestWithTokenRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/accept-friend-request-with-token`,
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

export async function followUser({ userId }: UnfollowUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/follow`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
		handleChallenge: renderGenericChallenge,
	});
}

export async function unfollowUser({ userId }: UnfollowUserRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/unfollow`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function getUserFriendStatus({ userId }: GetUserFriendStatusRequest) {
	return (
		await httpClient.httpRequest<GetUserFriendStatusResponse>({
			url: `${getRobloxUrl("friends")}/v1/my/friends/${userId}/status`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getUserTrustedFriendStatus({ userId }: GetUserFriendStatusRequest) {
	return (
		await httpClient.httpRequest<GetUserTrustedFriendStatusResponse>({
			url: `${getRobloxUrl("friends")}/v1/my/trusted-friends/${userId}/status`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function multigetUsersAreTrustedFriends({
	overrideCache,
	targetUserId,
	userIds,
}: GetUserFriendsStatusRequest) {
	return getOrSetCaches({
		baseKey: ["users", targetUserId, "trustedFriendStatuses"],
		keys: userIds.map((id) => ({
			id,
		})),
		fn: async (data) =>
			httpClient
				.httpRequest<MultigetUsersAreTrustedFriendsResponse>({
					url: `${getRobloxUrl("friends")}/v1/user/${targetUserId}/multiget-are-trusted-friends`,
					search: {
						userIds: data.map((id) => id.id),
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => {
					const items: Record<number, { id: number }> = {};
					for (const id of userIds) {
						if (res.body.trustedFriendsId.includes(id)) {
							items[id] = {
								id,
							};
						}
					}

					return items;
				}),
		batchLimit: 50,
		overrideCache,
	});
}

export async function getUserFriendsStatus({
	targetUserId,
	overrideCache,
	userIds,
}: GetUserFriendsStatusRequest) {
	return getOrSetCaches({
		baseKey: ["users", targetUserId, "friendStatuses"],
		keys: userIds.map((id) => ({
			id,
		})),
		fn: async (data) =>
			httpClient
				.httpRequest<GetUserFriendsStatusResponse>({
					url: `${getRobloxUrl("friends")}/v1/users/${targetUserId}/friends/statuses`,
					search: {
						userIds: data.map((id) => id.id),
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => {
					const items: Record<number, UserFriendStatus> = {};
					for (const user of res.body.data) {
						items[user.id] = user;
					}

					return items;
				}),
		batchLimit: 50,
		overrideCache,
	});
}

export function multigetUsersByNames({
	overrideCache,
	usernames,
	...request
}: MultigetUsersByNamesRequest) {
	return getOrSetCaches({
		baseKey: ["users", "usernameSearch"],
		keys: usernames.map((id) => ({
			id: id.toLowerCase(),
		})),
		fn: async (usernames) =>
			httpClient
				.httpRequest<MultigetUsersByNamesResponse>({
					method: "POST",
					url: getRobloxUrl("users", "/v1/usernames/users"),
					body: {
						type: "json",
						value: {
							...request,
							usernames: usernames.map((username) => username.id),
						},
					},
					includeCsrf: false,
				})
				.then((data) => {
					const items: Record<string, RequestedUserFromUsername> = {};
					for (const user of data.body.data) {
						items[user.requestedUsername.toLowerCase()] = user;
					}

					return items;
				}),
		batchLimit: 100,
	});
}

export function multigetUsersByIds({
	overrideCache,
	userIds,
	...request
}: MultigetUsersByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["users", "byUserIds"],
		keys: userIds.map((id) => ({
			id,
		})),
		fn: (userIds) =>
			httpClient
				.httpRequest<MultigetUsersByIdsResponse>({
					method: "POST",
					url: getRobloxUrl("users", "/v1/users"),
					body: {
						type: "json",
						value: {
							...request,
							userIds: userIds.map((id) => id.id),
						},
					},
					includeCsrf: false,
				})
				.then((data) => {
					const items: Record<number, RequestedUser> = {};
					for (const user of data.body.data) {
						items[user.id] = user;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 100,
	});
}
export async function multigetUsersPresences(request: MultigetUsersPresencesRequest) {
	return (
		await httpClient.httpRequest<MultigetUsersPresencesResponse>({
			method: "POST",
			url: getRobloxUrl("presence", "/v1/presence/users"),
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

export async function multigetFollowingStatuses({
	userIds,
	overrideCache,
}: MultigetFollowingStatusesRequest) {
	return getOrSetCaches({
		baseKey: ["users", "followingStatus"],
		keys: userIds.map((id) => ({
			id,
		})),
		fn: async (userIds) =>
			httpClient
				.httpRequest<MultigetFollowingStatusesResponse>({
					method: "POST",
					url: getRobloxUrl("friends", "/v1/user/following-exists"),
					body: {
						type: "json",
						value: {
							targetUserIds: userIds.map((id) => id.id),
						},
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((data) => {
					const items: Record<number, FollowingStatus> = {};
					for (const user of data.body.followings) {
						items[user.userId] = user;
					}

					return items;
				}),
		batchLimit: 50,
		overrideCache,
	});
}

export async function multigetProfileInsights(request: MultigetProfileInsightsRequest) {
	return (
		await httpClient.httpRequest<MultigetProfileInsightsResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/profile-insights-api/v1/multiProfileInsights"),
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

export async function multigetProfileData<T extends ProfileField, U extends ProfileFieldName>(
	request: MultigetProfileDataRequest<T, U>,
) {
	return (
		await httpClient.httpRequest<MultigetProfileDataResponse<T, U>>({
			method: "POST",
			url: getRobloxUrl("apis", "/user-profile-api/v1/user/profiles/get-profiles"),
			body: {
				type: "json",
				value: {
					...request,
					fields: [
						...(request.fields ?? []),
						...(request.nameFields?.map((name) => `names.${name}`) ?? []),
					],
					nameFields: undefined,
				},
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listUserFriends({ userId, ...request }: ListUserFriendsRequest) {
	return (
		await httpClient.httpRequest<ListUserFriendsResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/friends/find`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function searchUserFriends({ userId, ...request }: SearchUserFriendsRequest) {
	return (
		await httpClient.httpRequest<ListUserFriendsResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/friends/search`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function listUserFollowers({ userId, ...request }: ListUserFollowersRequest) {
	return (
		await httpClient.httpRequest<ListUserFollowersResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/followers`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserFollowings({ userId, ...request }: ListUserFollowersRequest) {
	return (
		await httpClient.httpRequest<ListUserFollowersResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/followings`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserOnlineFriends({ userId, userSort }: LegacyListUserFriendsRequest) {
	return (
		await httpClient.httpRequest<ListUserOnlineFriendsResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/friends/online`,
			search: {
				userSort,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function listUserUsernameHistory({
	userId,
	...request
}: ListUserUsernameHistoryRequest) {
	return (
		await httpClient.httpRequest<ListUserUsernameHistoryResponse>({
			url: `${getRobloxUrl("users")}/v1/users/${userId}/username-history`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function listUserRobloxCollections(request: ListUserRobloxCollectionsRequest) {
	return (
		await httpClient.httpRequest<RobloxCollectionItem[]>({
			url: getRobloxUrl("apis", "/showcases-api/v1/users/profile/robloxcollections-json"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserPlaces(request: ListUserPlacesRequest) {
	return (
		await httpClient.httpRequest<ListUserPlacesResponse>({
			url: getRobloxUrl("www", "/users/profile/playergames-json"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			camelizeResponse: true,
		})
	).body;
}

export async function listUserFollowingsCount({ userId }: ListUserFriendsFollowersCountRequest) {
	return (
		await httpClient.httpRequest<GetUserFriendsFollowersCountResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/followings/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserFriendsCount({ userId }: ListUserFriendsFollowersCountRequest) {
	return (
		await httpClient.httpRequest<GetUserFriendsFollowersCountResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/friends/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserFollowersCount({ userId }: ListUserFriendsFollowersCountRequest) {
	return (
		await httpClient.httpRequest<GetUserFriendsFollowersCountResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/followers/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listMyFriendRequestsCount() {
	return (
		await httpClient.httpRequest<GetUserFriendsFollowersCountResponse>({
			url: `${getRobloxUrl("friends")}/v1/user/friend-requests/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listMyFriendsCount() {
	return (
		await httpClient.httpRequest<GetUserFriendsFollowersCountResponse>({
			url: `${getRobloxUrl("friends")}/v1/my/friends/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listMyFriendRequests(request: ListMyFriendRequestsRequest) {
	return (
		await httpClient.httpRequest<ListMyFriendRequestsResponse>({
			url: `${getRobloxUrl("friends")}/v1/my/friends/requests`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listMyNewFriendRequestsCount() {
	return (
		await httpClient.httpRequest<GetUserFriendsFollowersCountResponse>({
			url: `${getRobloxUrl("friends")}/v1/my/new-friend-requests/count`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function declineAllMyNewFriendRequests() {
	await httpClient.httpRequest<void>({
		method: "DELETE",
		url: `${getRobloxUrl("friends")}/v1/my/new-friend-requests`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function declineAllMyFriendRequests() {
	return (
		await httpClient.httpRequest<DeclineAllMyFriendRequestsResponse>({
			method: "POST",
			url: `${getRobloxUrl("friends")}/v1/user/friend-requests/decline-all`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function declineUserFriendRequest({ userId }: AcceptUserFriendRequestRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/decline-friend-request`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function ignoreUserTrustedFriendRequest({ userId }: AcceptUserFriendRequestRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/ignore-trusted-friend-request`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function acceptUserFriendRequest({ userId }: AcceptUserFriendRequestRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/accept-friend-request`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function acceptUserTrustedFriendRequest({ userId }: AcceptUserFriendRequestRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: `${getRobloxUrl("friends")}/v1/users/${userId}/accept-trusted-friend-request`,
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
	});
}

export async function requestUserFriendship({ userId, ...request }: RequestUserFriendshipRequest) {
	return (
		await httpClient.httpRequest<RequestUserFriendshipResponse>({
			method: "POST",
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/request-friendship`,
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			handleChallenge: renderGenericChallenge,
		})
	).body;
}

export async function requestTrustedFriend({ userId, ...request }: RequestUserFriendshipRequest) {
	return (
		await httpClient.httpRequest<RequestUserFriendshipResponse>({
			method: "POST",
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/send-trusted-friend-request`,
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

export async function listUserFriendRecommendations({
	userId,
	...request
}: ListUserFriendRecommendationsRequest) {
	return (
		await httpClient.httpRequest<ListUserFriendRecommendationsResponse>({
			url: `${getRobloxUrl("friends")}/v1/users/${userId}/friends/recommendations`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listUserRobloxBadges({
	userId,
}: ListUserRobloxBadgesRequest): Promise<RobloxAssignedBadge[]> {
	return (
		await httpClient.httpRequest<RobloxAssignedBadge[]>({
			url: `${getRobloxUrl("accountinformation")}/v1/users/${userId}/roblox-badges`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getOpenCloudUser({
	credentials,
	userId,
}: GetOpenCloudUserRequest): Promise<GetOpenCloudUserResponse> {
	return (
		await httpClient.httpRequest<GetOpenCloudUserResponse>({
			url: `${getRobloxUrl("apis")}/cloud/v2/users/${userId}`,
			credentials,
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function updateProfileCustomization(request: UpdateProfileCustomizationRequest) {
	await httpClient.httpRequest<void>({
		method: "POST",
		url: getRobloxUrl("apis", "/profile-platform-api/v1/profiles/customization/update"),
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		expect: "none",
		errorHandling: "BEDEV2",
	});
}
