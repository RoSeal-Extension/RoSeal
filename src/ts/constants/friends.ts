import type { CONNECTION_TYPE_ICONS } from "../components/icons";
import type { UserPresenceTypeId } from "./presence";

export const MUTUAL_FRIENDS_SHOW_COUNT = 5;

export const USER_ONLINE_FRIENDS_FETCH_ALARM_NAME = "userOnlineFriendsFetch";
export const USER_ONLINE_FRIENDS_FETCHED_SESSION_CACHE_STORAGE_KEY = "cache.userOnlineFriendsFetch";

export const FRIENDS_LAST_SEEN_STORAGE_KEY = "friendsLastSeen";
export const FRIENDS_LAST_SEEN_FEATURE_ID = "friendsLastSeen";
export const FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID = "friendsLastSeen.backgroundChecks";

export const FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY = "connectionActivity";
export const FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_KEY = "cache.connectionActivity";
export type FriendsPresenceNotificationsSessionCacheStorageValue = {
	users: Record<
		string,
		{
			type: UserPresenceTypeId;
			experienceId?: number;
		}
	>;
};
export type FriendsPresenceNotificationsDataStorageValue = {
	userIds: number[];
};
export const FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_DEFAULT_VALUE = {
	userIds: [],
} as FriendsPresenceNotificationsDataStorageValue;
export const FRIENDS_PRESENCE_NOTIFICATIONS_SESSION_CACHE_STORAGE_DEFAULT_VALUE = {
	users: {},
} as FriendsPresenceNotificationsSessionCacheStorageValue;
export const FRIENDS_PRESENCE_NOTIFICATIONS_NOTIFICATION_PREFIX = "friendActivity:";
export const FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID = "connectionActivityNotifications";
export const FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID =
	"connectionActivityNotifications.backgroundChecks";

export const FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID =
	"connectionActivityNotifications.inExperience";
export const FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID =
	"connectionActivityNotifications.inStudio";
export const FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID =
	"connectionActivityNotifications.online";

export const FRIENDS_STATUS_FILTERS = ["All", "Online", "InGame", "InStudio", "Offline"] as const;

export const FRIEND_TILE_WIDTH = 110;

export type ConnectionType = {
	id: number | string;
	type: "custom" | "default";
	name: string;
	description?: string;
	color?: string;
	iconName?: keyof typeof CONNECTION_TYPE_ICONS;
	emojiText?: string;
};

export const DEFAULT_CONNECTION_TYPES: ConnectionType[] = [
	{
		id: 5,
		type: "default",
		name: "bestFriend",
		iconName: "Star",
		color: "#452159",
	},
	{
		id: 2,
		type: "default",
		name: "family",
		iconName: "FamilyHome",
		color: "#574424",
	},
	{
		id: 3,
		type: "default",
		name: "friend",
		iconName: "Group",
		color: "#1e5637",
	},
	{
		id: 6,
		type: "default",
		name: "coworker",
		iconName: "Work",
		color: "#3b4757",
	},
	{
		id: 4,
		type: "default",
		name: "teammate",
		iconName: "Groups",
		color: "#5a2024",
	},
	{
		id: 1,
		type: "default",
		name: "mutual",
		iconName: "Handshake",
		color: "#1e4b60",
	},
];

export const DEFAULT_NONE_CONNECTION_TYPE: ConnectionType = {
	id: 0,
	type: "default",
	name: "default",
} as ConnectionType;

export const DEFAULT_ALL_CONNECTION_TYPE: ConnectionType = {
	id: -1,
	type: "default",
	name: "all",
};

export const CONNECTIONS_TYPES_STORAGE_KEY = "userConnectonsTypes";
export type ConnectionsTypesStorageValue = {
	customTypes: ConnectionType[];
	users: Record<number, number | string | undefined>;
	layout?: (number | string)[];
};

export const DEFAULT_CONNECTION_TYPE_COLOR = "#919191";
export const MAX_CONNECTION_TYPE_NAME_LENGTH = 35;
export const MAX_CONNECTION_TYPE_DESCRIPTION_LENGTH = 50;

export const MAX_CONNECTIONS_LIMIT = 1_000;
export const MAX_COMMUNITIES_LIMIT = 100;

export const FRIEND_REQUESTS_FILTER_SORTS = [
	"sentDate",
	"joinedDate",
	"connectionsCount",
	"followersCount",
	"followingsCount",
	"mutualCommunitiesCount",
	"mutualConnectionsCount",
] as const;
