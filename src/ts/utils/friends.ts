import type { ConnectionsTypesStorageValue, ConnectionType } from "../constants/friends";
import { getOrSetCache } from "../helpers/cache";
import { localeCompare } from "../helpers/i18n/intlFormats";
import { profileInsightsProcessor } from "../helpers/processors/profileInsightsProcessor";
import type { UserProfileResponse } from "../helpers/processors/profileProcessor";
import { listUserConversations } from "../helpers/requests/services/chat";
import { getFeatureAccess } from "../helpers/requests/services/testService";
import {
	checkUsersReciprocalBlocked,
	listUserFriends,
	type UserPresence,
} from "../helpers/requests/services/users";
import { crossSort } from "./objects";

// same as 0000-00-00T00:00:00.000Z (start of gregorian calendar)
const FRIENDS_CURSOR_CUSTOM_EPOCH = -62135596800000;

function calculateTimestampFromCursorHalf(
	cursorHalf: bigint,
	customEpochMillis = FRIENDS_CURSOR_CUSTOM_EPOCH,
) {
	const millis = cursorHalf / 10000n; // Convert to ms

	// Add to custom epoch to get the timestamp
	const timestampMillis = BigInt(customEpochMillis) + millis;
	return new Date(Number(timestampMillis));
}

export function getUserFriendshipCreationDate(
	userId: number,
	friendUserId: number,
	startingCursor?: string,
	startingLimit = 50,
) {
	return getOrSetCache({
		key: ["users", userId, "friendships", friendUserId, "creationDate"],
		fn: async () => {
			let limit = startingLimit;
			let isStartingLimit = startingLimit !== undefined;
			let cursor: string | undefined = startingCursor;
			while (true) {
				const data = await listUserFriends({
					cursor,
					limit,
					userId,
					userSort: "Created",
				});

				let found = false;
				for (let i = 0; i < data.pageItems.length; i++) {
					const item = data.pageItems[i];
					if (item.id === friendUserId) {
						found = true;

						if (i === limit - 1) {
							// formatted as: 1:snowflake at the moment
							const split = data.nextCursor?.split(":");
							if (split) {
								const timestamp = BigInt(split[1]);
								return calculateTimestampFromCursorHalf(timestamp);
							}

							return;
						}

						limit = i + 1;
						break;
					}
				}

				if (!found) {
					if (isStartingLimit) {
						isStartingLimit = false;
						limit = 50;
					}

					if (!data.nextCursor) return;
					cursor = data.nextCursor;
				}
			}
		},
	});
}

export async function getUserFriendshipsCreationDates(userId: number) {
	return getOrSetCache({
		key: ["users", userId, "friendships", "creationDates"],
		fn: async () => {
			let cursor: string | undefined;
			const data: Record<number, Date> = {};
			while (true) {
				const response = await listUserConversations({
					cursor,
					includeMessages: true,
				});

				for (const item of response.conversations) {
					if (item.type === "one_to_one") {
						for (const participantId of item.participantUserIds) {
							if (participantId !== userId) {
								if (item.source === "friends")
									data[participantId] = new Date(item.createdAt);

								break;
							}
						}
					}
				}

				if (!response.nextCursor) {
					return data;
				}
				cursor = response.nextCursor;
			}
		},
	});
}

export async function getMyUserFriendshipCreationDate(friendUserId: number) {
	const insightsData = await profileInsightsProcessor.request({
		userId: friendUserId,
	});

	for (const insight of insightsData.profileInsights) {
		if ("friendshipAgeInsight" in insight) {
			return new Date(insight.friendshipAgeInsight.friendsSinceDateTime.seconds * 1000);
		}
	}
}

export type MutualFriendData = {
	id: number;
	displayName: string;
	username: string;
};

export async function getMutualFriends(userId: number, overrideCache?: boolean) {
	const data = await profileInsightsProcessor.request(
		{
			userId,
		},
		overrideCache,
	);

	for (const insight of data.profileInsights) {
		if ("mutualFriendInsight" in insight) {
			const userIds: MutualFriendData[] = [];

			for (const item in insight.mutualFriendInsight.mutualFriends) {
				const data = insight.mutualFriendInsight.mutualFriends[item];

				userIds.push({
					id: Number.parseInt(item, 10),
					displayName: data.displayName,
					username: data.username,
				});
			}

			return userIds;
		}
	}

	return [];
}

export async function getCanViewUserFriends(userId: number) {
	try {
		const [mustHideConnectionsAMPValue, isBlockingViewer] = await Promise.all([
			getFeatureAccess({
				featureName: "MustHideConnections",
				extraParameters: [
					{
						name: "vieweeUserId",
						type: "UserId",
						value: userId,
					},
				],
			}),
			checkUsersReciprocalBlocked({
				userIds: [userId],
			}).then((data) => data[0].isBlockingViewer),
		]);

		return isBlockingViewer === false && mustHideConnectionsAMPValue.access !== "Granted";
	} catch {
		return false;
	}
}

export function sortOnlineFriends(
	friends: UserPresence[],
	profileData: UserProfileResponse[],
	typeData?: ConnectionsTypesStorageValue,
	types?: ConnectionType[],
) {
	return crossSort([...friends], (a, b) => {
		if (typeData && types) {
			const aTypeId = typeData.users[a.userId];
			const bTypeId = typeData.users[b.userId];

			let aTypeIndex = -1;
			let bTypeIndex = -1;

			for (let i = 0; i < types.length; i++) {
				const item = types[i];

				if (item.id === aTypeId) {
					aTypeIndex = i;
				}

				if (item.id === bTypeId) {
					bTypeIndex = i;
				}

				if (aTypeIndex !== -1 && bTypeIndex !== -1) {
					break;
				}
			}

			if (aTypeIndex !== bTypeIndex) {
				if (aTypeIndex !== -1 && bTypeIndex === -1) {
					return -1;
				}

				if (bTypeIndex !== -1 && aTypeIndex === -1) {
					return 1;
				}

				if (aTypeIndex < bTypeIndex) {
					return -1;
				}

				return 1;
			}
		}

		if (a.userPresenceType === b.userPresenceType) {
			let aCombinedName: string | undefined;
			let bCombinedName: string | undefined;
			for (const item of profileData) {
				if (item?.userId === a.userId) {
					aCombinedName = item.names.combinedName;
				}
				if (item?.userId === b.userId) {
					bCombinedName = item.names.combinedName;
				}
			}

			if (aCombinedName && bCombinedName) {
				return localeCompare(aCombinedName, bCombinedName);
			}

			return 0;
		}
		if (a.userPresenceType === 2) return -1;
		if (b.userPresenceType === 2) return 1;
		if (a.userPresenceType < b.userPresenceType) return 1;
		if (a.userPresenceType > b.userPresenceType) return -1;

		return 0;
	});
}
