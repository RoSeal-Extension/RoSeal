import { signal } from "@preact/signals";
import type { Agent } from "../helpers/requests/services/assets";
import type {
	BundledItemType,
	MarketplaceItemType,
} from "../helpers/requests/services/marketplace";
import type { TradeStatus } from "../helpers/requests/services/trades";

export const VOICE_CHAT_SUSPENSION_STORAGE_KEY = "voiceChatSuspension";

export const BLOCKED_ITEMS_STORAGE_KEY = "blockedItems";
export const ALLOWED_ITEMS_STORAGE_KEY = "blockedItems.allowedItems";

export const UNIVERSES_SESSION_CACHE_STORAGE_KEY = "cache.universesData";

export type BlockedItemCreator = {
	id: number;
	type: Agent;
};

export type BlockedExperiencesGroup = {
	ids: number[];
	names: string[];
	descriptions: string[];
};

export type BlockedItem = {
	id: number;
	type: MarketplaceItemType;
};

export type BlockedItemsGroup = {
	items: BlockedItem[];
	names: string[];
	descriptions: string[];
};

export type BlockedItemsStorage = {
	experiences: BlockedExperiencesGroup;
	items: BlockedItemsGroup;
	creators: BlockedItemCreator[];
};

export type AllowedExperiencesGroup = {
	ids: number[];
};

export type AllowedItemsGroup = {
	items: BlockedItem[];
};

export type AllowedItemCreator = {
	id: number;
	type: Agent;
};

export type AllowedItemsStorage = {
	experiences: AllowedExperiencesGroup;
	items: AllowedItemsGroup;
	creators: AllowedItemCreator[];
};

export const LAUNCH_DATA_STORAGE_KEY = "cache.launchData";
export const PENDING_ROBUX_SESSION_CACHE_STORAGE_KEY = "cache.pendingRobux";
export const UPCOMING_FOLLOWED_EVENTS_SESSION_CACHE_STORAGE_KEY =
	"cache.upcomingFollowedExperienceEvents";

export const BC_ROBUX_STIPEND_AMOUNTS = [
	// Standard Builder's Club
	15,
	// Turbo Builder's Club
	35,
	// Outrageous Builder's Club
	60,
];

export const CHAT_SORT_TYPES = ["Default", "NewestFirst", "OldestFirst", "UnreadFirst"] as const;

export const PERSIST_TRANSACTIONS_SELECTION_LOCALSTORAGE_KEY = "persistTransactionsSelection";

export const PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY =
	"premiumStatusButtonAcknowledged";
export const PREMIUM_MEMBERSHIP_STATUS_SESSION_CACHE_STORAGE_KEY = "cache.premiumMembership";

export const animalTextCount = {
	seal: 1,
	kitty: 5,
};

export const ROBLOX_CACHE_KEY_PREFIXES = [
	"CacheStore:BatchRequestProcessor::",
	"Roblox.RealTime.StateTracker.LastNamespaceSequenceNumberProcessed_",
];

export const ROBLOX_REALTIME_KEY_PREFIXES = [
	"Roblox.CrossTabCommunication.Kingmaker",
	"Roblox.RealTime.Events",
];

export const blockedItemsData = signal<BlockedItemsStorage>();
export const allowedItemsData = signal<AllowedItemsStorage>();

export const DEFAULT_BLOCKED_ITEMS_STORAGE = {
	experiences: {
		ids: [],
		names: [],
		descriptions: [],
	},
	items: {
		items: [],
		names: [],
		descriptions: [],
	},
	creators: [],
};

export const DEFAULT_ALLOWED_ITEMS_STORAGE = {
	experiences: {
		ids: [],
	},
	items: {
		items: [],
	},
	creators: [],
};

export const TRANSACTION_NAVIGATION_ITEMS = [
	"#type-selection + .dropdown-menu a",
	"#num-items-selection + .dropdown-menu a, #date-selection + .dropdown-menu a",
	"#paid-items-selection + .dropdown-menu a",
];

export const VERSION_STORAGE_KEY = "version";

export const ONBOARDING_COMPLETED_STORAGE_KEY = "onboarding.completed";

export const FFLAGS_APPLICATION_NAME = "PCDesktopClient";

export const SEAL_EMOJI_CODE = "🦭";
export const TACO_EMOJI_CODE = "🌮";
export const KITTY_EMOJI_CODE = "🐈";

export const SYNC_THEME_ENABLED_LOCALSTORAGE_KEY = "syncThemeEnabled";

export const NULL_TIME = "0001-01-01T00:00:00";

export const APPLICATION_BINARY_TYPES = [
	"MacPlayer",
	"MacPlayerCJV",
	"MacStudio",
	"MacStudioCJV",
	"WindowsPlayer",
	"WindowsPlayerCJV",
	"WindowsStudio",
	"WindowsStudioCJV",
	"WindowsStudio64",
	"WindowsStudio64CJV",
	"GoogleAndroidApp",
	"AmazonAndroidApp",
	"IOSApp",
	"XboxApp",
	"PS4App",
	"QuestVRApp",
	"PS5App",
	"UWPApp",
] as const;

export const TEST_PLACE_ID = 1818 as const;
export const TEST_RCC_CHANNEL_NAME = "z" as const;
export const DEFAULT_PRERELEASE_CHANNEL_NAME = "zbeta" as const;
export const DEFAULT_RELEASE_CHANNEL_NAME = "live" as const;

export const VOTING_ITEM_TYPES = [
	"Game Pass",
	"Place",
	"Model",
	"Plugin",
	"Decal",
	"Video",
	"MeshPart",
	"Audio",
	"FontFamily",
] as const;

export const FAST_SEARCH_USER_LIMIT = 4;
export const TRANSACTION_PAGE_SIZES = [10, 25, 50, 100];

export type ArchivedItemsItem = {
	type: MarketplaceItemType | BundledItemType;
	id: number;
	bundleId?: number;
};

export type ArchivedItemsStorageValue = {
	items: ArchivedItemsItem[];
};

export const ARCHIVED_ITEMS_STORAGE_KEY = "archivedItems";
export const PLAYER_REFERRAL_LOCALSTORAGE_KEY = "ref_info";
export const ROBLOX_RELEASE_YEAR = 2006;

export const STARTUP_NOTIFICATIONS_FEATURE_ID = "startUpNotifications";
export const STARTUP_NOTIFICATION_HAS_OPENED_ROBLOX_SESSION_STORAGE_KEY = "hasStartupNotification";
export const STARTUP_NOTIFICATION_NOTIFICATION_PREFIX = "startup:";

export const COMMUNITY_SHOUT_NOTIFICATIONS_ALARM_NAME = "communityShoutsCheck";
export const COMMUNITY_SHOUT_NOTIFICATIONS_FEATURE_ID = "communityShoutNotifications";
export const COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID =
	"communityShoutNotifications.backgroundChecks";
export const COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY = "recentCommmunityShouts";
export const COMMUNITY_SHOUT_NOTIFICATIONS_NOTIFICATION_PREFIX = "communityShout:";
export const COMMUNITY_SHOUT_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY =
	"cache.communityShoutsChecked";

export const TRADING_NOTIFICATIONS_ALARM_NAME = "tradesCheck";
export const TRADING_NOTIFICATIONS_FEATURE_ID = "tradeNotifications";
export const TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID =
	"tradeNotifications.backgroundChecks";
export const TRADING_NOTIFICATIONS_STORAGE_KEY = "recentTrades";
export const TRADING_NOTIFICATIONS_NOTIFICATION_PREFIX = "tradeUpdate:";
export const TRADING_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY = "cache.tradesCheck";
export type TradingNotificationsStorageValue = {
	usersLastChecked: Record<string, number>;
	trades: Record<string, TradeStatus>;
};
export const TRADING_NOTIFICATIONS_STORAGE_DEFAULT_VALUE = {
	usersLastChecked: {},
	trades: {},
} as TradingNotificationsStorageValue;

export const ROBUX_HISTORY_STORAGE_KEY = "robuxHistory";
export type RobuxHistoryStorageValue = Record<
	number,
	{
		date: number;
		robux: number;
	}[]
>;
