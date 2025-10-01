import type messageesType from "#i18n/types";
import type { CustomHomePlaylist } from "src/ts/components/home/layoutCustomization/constants";
import type { Layout } from "src/ts/components/home/layoutCustomization/utils";
import type { StoredAccountPartial } from "src/ts/constants/accountsManager";
import type { AvatarItemListsStorageValue } from "src/ts/constants/avatar";
import type { ChartFiltersState } from "src/ts/constants/chartFilters";
import type {
	AllowedItemsStorage,
	ArchivedItemsItem,
	BlockedItemsStorage,
	CHAT_SORT_TYPES,
} from "src/ts/constants/misc";
import type { AnyFeature, FeatureValue } from "src/ts/helpers/features/featuresData.ts";
import type { FlagCall } from "src/ts/helpers/flags/flags";
import type { FlagsData } from "src/ts/helpers/flags/flagsData";
import type { GetCurrentAuthenticatedUserResponse } from "src/ts/helpers/requests/services/account";
import type {
	AvatarAssetDefinitionWithTypes,
	AvatarColors3s,
	OutfitRequest,
} from "src/ts/helpers/requests/services/avatar";
import type {
	ListedUserInventoryAssetDetailed,
	ListUserInventoryCategoriesResponse,
	UserInventoryCategory,
} from "src/ts/helpers/requests/services/inventory";
import type {
	AvatarItemDetail,
	MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import type { RealtimeNotifications } from "src/ts/helpers/requests/services/notifications";
import type {
	RobloxExperimentVariable,
	RoSealLaunchData,
} from "src/ts/helpers/requests/services/roseal";
import type { FriendInviteData } from "src/ts/helpers/requests/services/sharelinks";
import type { OmniSort } from "src/ts/helpers/requests/services/universes";
import type {
	CrossFetchArgs,
	CrossFetchResponse,
} from "src/ts/helpers/requests/utils/bypassCORSFetch";
import type { AvatarItemFeedback } from "src/ts/pages/main/www/items/[id]/[name]";
import type { InjectScript } from "src/ts/utils/dom";
import type {
	Challenge2SV,
	Render2SVChallengeResponse,
	RenderGenericChallengeArgs,
	RenderGenericChallengeResponse,
} from "../ts/helpers/challenges/challengesInject";
import type { ListUserOnlineFriendsResponse } from "src/ts/helpers/requests/services/users";
import type { SortOrder } from "src/ts/helpers/requests/services/badges";
import type { CurrentServerJoinMetadata } from "src/ts/utils/gameLauncher";
import type { ReactAvatarEditorPageAvatar } from "src/ts/pages/inject/www/my/avatar";

export type PopupData = {
	permissions: chrome.permissions.Permissions;
	remove: boolean;
};

export type DefaultError = "UnknownError";

export type DOMCommunicationMessageDataTypes = {
	"chat.updateSortType": {
		args: (typeof CHAT_SORT_TYPES)[number];
	};
	"marketplace.sendItems": {
		args: AvatarItemDetail<MarketplaceItemType>[];
	};
	"user.inventory.canViewInventory": {
		args: {
			canViewInventory: boolean;
			isPrivateServersTab: boolean;
		};
	};
	"user.inventory.addAssets": {
		args: {
			userId: number;
			assetTypeId: number;
			items: ListedUserInventoryAssetDetailed[];
		};
	};
	"user.inventory.categoryChanged": {
		args: InventoryCategoryData;
	};
	"user.inventory.refreshInventory": {
		args: void;
	};
	"user.inventory.setSortDirection": {
		args: SortOrder;
	};
	updatePendingRobux: {
		args: {
			robux: number;
			userId: number;
		};
	};
	invokeResponse: {
		args: {
			id: string;
			action: keyof DOMCommunicationInvokeDataTypes;
			args: CommunicationResponseMessage<
				DOMCommunicationInvokeDataTypes[keyof DOMCommunicationInvokeDataTypes]["res"]["data"]
			>;
		};
	};
	documentReady: {
		args: void;
	};
	scrollHeightChanged: {
		args: number;
	};
	setBlockedItems: {
		args: {
			blockedItems?: BlockedItemsStorage;
			allowedItems?: AllowedItemsStorage;
		};
	};
	"experiments.setOverrides": {
		args: {
			overrides: RobloxExperimentVariable[];
			discoverExperiments?: boolean;
		};
	};
	invoke: {
		args: {
			id: string;
			action: keyof DOMCommunicationInvokeDataTypes;
			args: DOMCommunicationInvokeDataTypes[keyof DOMCommunicationInvokeDataTypes]["args"];
		};
	};
	"group.setActiveGroup": {
		args: {
			groupId: number;
		};
	};
	"group.list.update": {
		args: undefined;
	};
	"group.wall.paginate": {
		args: boolean;
	};
	"experiments.discovered": {
		args: {
			type: "ixp" | "guac" | "clientSettings";
			parentId: number | string;
			id: string;
			parameters: string[];
		}[];
	};
	"transactions.setHideFreeItems": {
		args: boolean;
	};
	"transactions.setPageSize": {
		args: number;
	};
	"transactions.setHidePrivateServers": {
		args: boolean;
	};
	"charts.updateSortV2Layout": {
		args: {
			layout?: Layout;
			playlists?: CustomHomePlaylist[];
		};
	};
	"settings.changeTheme": {
		args: {
			isSync: boolean;
		};
	};
	triggerHandler: {
		args: [string, unknown];
	};
	"avatar.createCharacter": {
		args: void;
	};
	recordRobuxHistory: {
		args: {
			userId: number;
			robux: number;
		};
	};
	updateDocumentTitle: {
		args: string;
	};
	"avatar.refreshThumbnail": {
		args: void;
	};
	"avatar.refreshCharacters": {
		args: undefined;
	};
	"avatar.avatarUpdated": {
		args: ReactAvatarEditorPageAvatar;
	};
	"avatar.updateAssets": {
		args: AvatarAssetDefinitionWithTypes[];
	};
	"avatar.hoveredTabNameChanged": {
		args: string | undefined;
	};
	"avatar.setItemLists": {
		args: AvatarItemListsStorageValue;
	};
	"avatar.updateCharacter": {
		args: {
			characterId: number;
		};
	};
	onlineFriendsFetched: {
		args: ListUserOnlineFriendsResponse;
	};
	"avatar.bodyColorsChanged": {
		args: AvatarColors3s;
	};
	"avatar.updateBodyColors": {
		args: AvatarColors3s;
	};
	"avatar.updateDetailsFromOutfit": {
		args: OutfitRequest;
	};
	"home.setBTRFeatureDetection": {
		args: {
			btr: boolean;
			btrSecondRow: boolean;
		};
	};
	"home.sortsUpdated": {
		args: OmniSort[];
	};
	"home.updateSortsLayout": {
		args: {
			layout: Layout;
			playlists?: CustomHomePlaylist[];
		};
	};
	"featurePermissions.showError": {
		args: boolean;
	};
	featureValueUpdate: {
		args: {
			featureId: AnyFeature["id"];
			// biome-ignore lint/suspicious/noExplicitAny: Fine
			newValue: any;
		};
	};
	"avatarItem.refreshDetails": {
		args: undefined;
	};
	"avatarItem.showSystemFeedback": {
		args: AvatarItemFeedback;
	};
	realtimeNotification: {
		args: {
			type: RealtimeNotifications[0];
			data: RealtimeNotifications[1];
		};
	};
	"experience.unmountPlayButton": {
		args: void;
	};
	"experience.renderPlayButton": {
		args: void;
	};
	"charts.setFilters": {
		args: ChartFiltersState;
	};
	"user.inventory.addCategories": {
		args: UserInventoryCategory[];
	};
	"user.inventory.setupCategories": {
		args: ListUserInventoryCategoriesResponse;
	};
	"experience.store.promptPurchase": {
		args: number;
	};
	masterTabChange: {
		args: {
			isMaster: boolean;
		};
	};
	"user.inventory.setArchivedItems": {
		args: ArchivedItemsItem[];
	};
	"user.inventory.setupArchive": {
		args: void;
	};
	"avatar.setupArchive": {
		args: void;
	};
	"avatar.setArchivedItems": {
		args: ArchivedItemsItem[];
	};
};

export type DOMCommunicationInvokeDataTypes = {
	"experience.events.onReady": {
		args: number;
		res: {
			data: string;
			reason: DefaultError;
		};
	};
	setGameLaunchData: {
		args: CurrentServerJoinMetadata;
		res: void;
	};
	getMessage: {
		args: {
			messageName: keyof typeof messageesType;
			value?: Record<string, string | number | undefined> | void;
		};
		res: {
			data: string;
			reason: DefaultError;
		};
	};
	getMessages: {
		args: {
			messageNames: (keyof typeof messageesType)[];
		};
		res: {
			data: string[];
			reason: DefaultError;
		};
	};
	isMasterTab: {
		args: void;
		res: {
			data: boolean;
			reason: DefaultError;
		};
	};
	determineCanJoinUser: {
		args: {
			userIdToFollow: number;
		};
		res: {
			data: {
				disabled: boolean;
				message?: string;
			};
			reason: DefaultError;
		};
	};
	"avatar.wearCharacter": {
		args: {
			characterId: number;
		};
		res: {
			data: OutfitRequest;
			reason: DefaultError;
		};
	};
	"avatar.getHoveredTabName": {
		args: void;
		res: {
			data: string | undefined;
			reason: DefaultError;
		};
	};
	"group.wall.setupPagination": {
		args: void;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	"group.wall.canLoadNextPage": {
		args: void;
		res: {
			data: boolean;
			reason: DefaultError;
		};
	};
	checkBlockedUniverses: {
		args: {
			ids: number[];
			checkNames?: boolean;
		};
		res: {
			data: number[];
			reason: DefaultError;
		};
	};
	"group.wall.onReady": {
		args: void;
		res: {
			data: boolean;
			reason: DefaultError;
		};
	};
	"chat.setupSortTypes": {
		args: void;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	"group.store.setSearchQuery": {
		args: string;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	"group.store.canSearch": {
		args: void;
		res: {
			data: boolean;
			reason: DefaultError;
		};
	};
	bypassCORSFetch: {
		args: CrossFetchArgs;
		res: {
			data: CrossFetchResponse;
			reason: DefaultError;
		};
	};
	"shareLink.onFriendShareLink": {
		args: FriendInviteData;
		res: {
			data: undefined;
			reason: DefaultError;
		};
	};
	"user.inventory.getCategoryData": {
		args: void;
		res: {
			data: InventoryCategoryData;
			reason: DefaultError;
		};
	};
	setup3DThumbnail: {
		args: {
			type: "regular" | "animated";
			targetId: number;
			selector: string;
			json: unknown;
		};
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	"user.avatar.getDownloadUrl": {
		args: number;
		res: {
			data: string | undefined;
			reason: DefaultError;
		};
	};
	getFeatureValue: {
		args: {
			featureId: AnyFeature["id"];
			uncached?: boolean;
		};
		res: {
			data: FeatureValue<AnyFeature> | undefined;
			reason: DefaultError;
		};
	};
	blankCall: {
		args: {
			fn: string[];
			args?: unknown[];
		};
		res: {
			data: unknown;
			reason: DefaultError;
		};
	};
	blankGet: {
		args: {
			target: string[];
		};
		res: {
			data: unknown;
			reason: DefaultError;
		};
	};
	getLangNamespace: {
		args: string;
		res: {
			data: Record<string, string>;
			reason: DefaultError;
		};
	};
	injectScripts: {
		args: InjectScript[];
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	injectStyles: {
		args: InjectScript[];
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	"avatarItem.changeItem": {
		args: {
			itemId: number;
			itemType: "Bundle" | "Asset";
		};
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	renderGenericChallenge: {
		args: RenderGenericChallengeArgs;
		res: {
			data: RenderGenericChallengeResponse;
			reason: DefaultError;
		};
	};
	render2SVChallenge: {
		args: Challenge2SV;
		res: {
			data: Render2SVChallengeResponse;
			reason: DefaultError;
		};
	};
	getFlag: {
		args: {
			namespace: keyof FlagsData;
			key: keyof FlagsData[keyof FlagsData];
		};
		res: {
			// biome-ignore lint/suspicious/noExplicitAny: no
			data: FlagsData[any][any];
			reason: DefaultError;
		};
	};
	getFlagNamespace: {
		args: {
			namespace: keyof FlagsData;
		};
		res: {
			// biome-ignore lint/suspicious/noExplicitAny: no
			data: FlagsData[any];
			reason: DefaultError;
		};
	};
};

export type BackgroundCommunicationDataTypes = {
	fetch: {
		args: CrossFetchArgs;
		res: {
			data: CrossFetchResponse;
			reason: DefaultError;
		};
	};
	createNotification: {
		args: {
			notification: chrome.notifications.NotificationCreateOptions;
			id: string;
		};
		res: {
			data: string;
			reason: DefaultError;
		};
	};
	listRobloxAccounts: {
		args: undefined;
		res: {
			data: StoredAccountPartial[];
			reason: DefaultError;
		};
	};
	checkAccountTrackingPrevention: {
		args: {
			userId: number;
		};
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	addCurrentRobloxAccount: {
		args: StoredAccountPartial;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	getSessionStorage: {
		args: string;
		res: {
			// biome-ignore lint/suspicious/noExplicitAny: Fine really
			data: Record<string, any>;
			reason: DefaultError;
		};
	};
	setSessionStorage: {
		args: Record<string, unknown>;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	removeSessionStorage: {
		args: string | string[];
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	sortRobloxAccounts: {
		args: StoredAccountPartial[];
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	logoutRobloxSession: {
		args: undefined;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	removeRobloxAccount: {
		args: StoredAccountPartial;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	switchRobloxAccount: {
		args: StoredAccountPartial;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	getLaunchData: {
		args: undefined;
		res: {
			data: RoSealLaunchData;
			reason: DefaultError;
		};
	};
	getPermissions: {
		args: undefined;
		res: {
			data: chrome.permissions.Permissions;
			reason: DefaultError;
		};
	};
	requestPermissions: {
		args: PopupData;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	openOptionsPage: {
		args: void;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
};

export type CommunicationResponseMessage<T = unknown, U extends string = string> =
	| {
			success: true;
			data: T;
	  }
	| {
			success: false;
			reason: U | DefaultError;
	  };

export type BackgroundMessageData<
	T extends keyof BackgroundCommunicationDataTypes = keyof BackgroundCommunicationDataTypes,
> = {
	action: T;
	args: BackgroundCommunicationDataTypes[T]["args"];
};

export type AuthenticatedUserWithCreatedAndBadge = GetCurrentAuthenticatedUserResponse & {
	created: string;
	hasVerifiedBadge: boolean;
};

export type MainCommunicationDataTypes = {
	logoutRobloxAccount: {
		args: undefined;
		res: {
			data: boolean;
			reason: DefaultError;
		};
	};
	authenticatedUserUpdated: {
		args: AuthenticatedUserWithCreatedAndBadge | undefined;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
	getAuthenticatedUser: {
		args: undefined;
		res: {
			data: AuthenticatedUserWithCreatedAndBadge;
			reason: DefaultError | "NotAuthenticated";
		};
	};
	permissionsUpdated: {
		args: chrome.permissions.Permissions;
		res: {
			data: void;
			reason: DefaultError;
		};
	};
};

export type AnyBackgroundMessageListener<
	T extends string = string,
	U = unknown,
	V = unknown,
	W extends keyof FlagsData = keyof FlagsData,
	X extends keyof FlagsData[W] = keyof FlagsData[W],
> = {
	action: T;
	featureIds?: AnyFeature["id"][];
	flags?: FlagCall<W, X>[];
	isExternal?: boolean;
	fn: (args: U, sender?: chrome.runtime.MessageSender) => Promise<V> | V;
};

export type BackgroundMessageListener<
	T extends keyof BackgroundCommunicationDataTypes = keyof BackgroundCommunicationDataTypes,
	U extends
		BackgroundCommunicationDataTypes[T]["args"] = BackgroundCommunicationDataTypes[T]["args"],
	V extends
		BackgroundCommunicationDataTypes[T]["res"]["data"] = BackgroundCommunicationDataTypes[T]["res"]["data"],
	W extends keyof FlagsData = keyof FlagsData,
	X extends keyof FlagsData[W] = keyof FlagsData[W],
> = AnyBackgroundMessageListener<T, U, V, W, X>;

export type BackgroundAlarmListener = {
	action: string;
	featureIds?: AnyFeature["id"][];
	fn: () => unknown | void;
};

export type ContentBackgroundMessageListener<
	T extends keyof MainCommunicationDataTypes = keyof MainCommunicationDataTypes,
	U extends MainCommunicationDataTypes[T]["args"] = MainCommunicationDataTypes[T]["args"],
	V extends
		MainCommunicationDataTypes[T]["res"]["data"] = MainCommunicationDataTypes[T]["res"]["data"],
	W extends keyof FlagsData = keyof FlagsData,
	X extends keyof FlagsData[W] = keyof FlagsData[W],
> = AnyBackgroundMessageListener<T, U, V, W, X>;
