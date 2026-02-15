/*
export type NewResolution = {
	type: chrome.storage.AreaName;
	data?: unknown;
	delete?: boolean;
	newKey?: string;
};

export type StorageMigration = {
	type: chrome.storage.AreaName;
	oldKey: string | RegExp;
	newKey?: string;
	transform: (value: unknown, key: string) => Promise<NewResolution> | NewResolution;
};

export const storageMigration: StorageMigration[] = [];

async function migrateStorageArea(type: string, data: Record<string, unknown>) {
	const deleteKeys: string[] = [];
	const setKeys: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(data)) {
		for (const migration of storageMigration) {
			if (
				(typeof migration.oldKey === "string"
					? migration.oldKey === key
					: key.match(migration.oldKey)) &&
				migration.type === type
			) {
				const result = await migration.transform(value, key);

				if (result.delete) {
					deleteKeys.push(key);
				} else {
					if (result.newKey) {
						deleteKeys.push(key);
					}

					if (result.data === undefined) {
						deleteKeys.push(key);
					} else {
						setKeys[result.newKey ?? key] = result.data;
					}
				}
			}
		}
	}

	return [deleteKeys, setKeys] as const;
}

export function migrateStorage() {
	return Promise.all([
		...(["local"] as const).map((type) =>
			browser.storage[type]
				.get()
				.then((data) => migrateStorageArea(type, data))
				.then((data) => {
					if (data[0].length) {
						browser.storage[type].remove(data[0]);
					}
					if (Object.keys(data[1]).length) {
						browser.storage[type].set(data[1]);
					}
				}),
		),
	]);
}*/

import { AGREEMENTS_STORAGE_KEY } from "../constants/alerts";
import { PRIVATE_NOTE_STORAGE_KEY } from "../constants/experiences";
import { GROUP_ORGANIZATION_STORAGE_KEY } from "../constants/groupOrganization";
import { PREFERRED_LOCALES_STORAGE_KEY } from "../constants/i18n";
import {
	BLOCKED_ITEMS_STORAGE_KEY,
	type BlockedItemsStorage,
	VOICE_CHAT_SUSPENSION_STORAGE_KEY,
} from "../constants/misc";
import { PRIVATE_SERVER_LINKS_STORAGE_KEY } from "../constants/privateServerLinks";
import { ALL_MAIN_STORAGE_KEYS, LEGACY_MAIN_UNMIGRATED_STORAGE_KEYS } from "../constants/storage";
import { FEATURE_STORAGE_KEY } from "./features/constants";
import { timeTargets } from "./features/featuresData";

const featureKeys = [
	{
		id: "CreatedUpdatedItemsTimeType.GroupUpdated",
		newId: "avatarItemCreatedUpdated.showActors",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RemoveHomePhoneNumberUpsell",
		newId: "removePhoneNumberUpsells",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "RefreshedHomeUserHeader",
		newId: "homeUserHeader",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "RefreshedHomeUserHeader.HelloText",
		newId: "homeUserHeader.greetingText",
		component: {
			type: "InputWithToggle",
			defaultValue: false,
		},
	},
	{
		id: "RefreshedHomeUserHeader.HasBackground",
		newId: "homeUserHeader.includeWhiteBackground",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RefreshedHomeUserHeader.BasedText",
		newId: "homeUserHeader.easterEggText",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RefreshedHomeUserHeader.BirthdayMessage",
		newId: "homeUserHeader.birthdayMessage",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RefreshedHomeUserHeader.AvatarSize",
		newId: "homeUserHeader.thumbnailSize",
		component: {
			type: "Dropdown",
			values: [
				{
					value: "Small",
					newValue: "small",
				},
				{
					value: "Medium",
					newValue: "medium",
				},
				{
					value: "Large",
					newValue: "large",
				},
				{
					value: "ExtraLarge",
					newValue: "extraLarge",
				},
			],
			defaultValue: "Large",
		},
	},
	{
		id: "RefreshedHomeUserHeader.AvatarType",
		newId: "homeUserHeader.thumbnailType",
		component: {
			type: "Dropdown",
			values: [
				{
					value: "Avatar",
					newValue: "Avatar",
				},
				{
					value: "AvatarHeadShot",
					newValue: "AvatarHeadShot",
				},
				{
					value: "AvatarBust",
					newValue: "AvatarBust",
				},
			],
			defaultValue: "AvatarHeadShot",
		},
	},
	{
		id: "RefreshedHomeUserHeader.ShowNameType",
		newId: "homeUserHeader.displayNameType",
		component: {
			type: "Dropdown",
			values: [
				{
					value: "Both",
					newValue: "both",
				},
				{
					value: "DisplayName",
					newValue: "displayName",
				},
				{
					value: "Username",
					newValue: "username",
				},
			],
			defaultValue: "Both",
		},
	},
	{
		id: "DiscoverFilters",
		newId: "chartsClientFilters",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "DiscoverTryExactMatch",
		newId: "chartsTryExactMatch",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "AddToProfileGroupExperiences",
		newId: "addGroupExperiencesToProfile",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "BetterExperienceNotificationsList",
		newId: "betterNotificationPreferences",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ExperienceCountdowns",
		newId: "experienceCountdown",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "BadgeMoreStatistics",
		newId: "badgeAwardedStats",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "MoveExperienceEvents",
		newId: "moveExperienceEvents",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ExperiencePrivateNote",
		newId: "experiencePrivateNotes",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ShowExperienceAvatarType",
		newId: "viewExperienceAvatarType",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ShowExperienceAvatarType.ShowAvatarRestriction",
		newId: "viewExperienceAvatarType.showAvatarRestricted",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ExperienceMediaAltTextButton",
		newId: "easyExperienceAltText",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "BetterExperienceBadges",
		newId: "improvedExperienceBadges",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "BetterExperiencesBadges.FiltersAndSorts",
		newId: "improvedExperienceBadges.showFiltersSorts",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "BetterExperiencesBadges.DisableRobloxBadges",
		newId: "improvedExperienceBadges.hideRobloxBadges",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "PrivateServerLinksSection",
		newId: "privateServerLinksSection",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "PrivateServerLinksSection.TryResolveOwner",
		newId: "privateServerLinksSection.tryResolveOwner",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "BlockExperiences",
		newId: "blockedItems",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "AddCommunityWikiButton",
		newId: "experienceLinks",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RemovePrivateServersSectionInAbout",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
		newId: "hidePrivateServersInAbout",
	},
	{
		id: "DisableDesktopApp",
		newId: "disableDesktopAppBanner",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "ShowExperienceUniverseId",
		newId: "viewUniverseId",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "DeveloperProductsInExperienceStore",
		newId: "viewExperienceDeveloperProducts",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ExperienceStoreItemFiltering",
		newId: "experienceStoreFiltering",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ShowVoiceChatSuspension",
		newId: "showVoiceChatSuspension",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "AccountsManager",
		newId: "accountsManager",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	/*
	{
		id: "ThemeSwitchThroughoutDay",
		newId: "syncBrowserThemeOption",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},*/
	{
		id: "UserFriendsPageContextMenu",
		newId: "userFriendsMoreActions",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "UserFriendsPageNewTitle",
		newId: "userPagesNewTitle",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "UserProfileForceUnfollow",
		newId: "removeFollowers",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "UserProfileAddMargins",
		newId: "userProfileAddPadding",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "UserProfileCancelRequest",
		newId: "cancelFriendRequests",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	/*
	{
		id: "UserProfileLastOnline",
		newId: "userLastOnline",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},*/
	{
		id: "ListPendingGroups",
		newId: "viewUserGroupJoinRequests",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "GroupOrganization",
		newId: "groupOrganization",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "RefreshlessGroupNavigation",
		newId: "groupSeamlessNavigation",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "DisableGroupWallInfiniteScrolling",
		newId: "disableGroupWallInfiniteScrolling",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "CreatorMarketplaceViewOffSaleAssetPage",
		newId: "viewOffsaleStoreItems",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ItemAdditionalProductInfo",
		newId: "viewItemProductInfo",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "ItemPagesMoveReportAbuse",
		newId: "moveReportAbuse",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "LinkMentions",
		newId: "formatItemMentions",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	/*
	{
		id: "ViewItemIconThumbnailAssets",
		newId: "viewItemMedia",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},*/
	{
		id: "ViewHiddenAvatarAsset",
		newId: "viewHiddenAvatarItems",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RefreshAvatarItemDetails",
		newId: "avatarItemRefreshDetails",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "RefreshAvatarItemDetails.FastFreeBuy",
		newId: "avatarItemQuickFreePurchase",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ViewAvatarAssetDependencies",
		newId: "viewAvatarAssetDependencies",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "ViewItemBundle",
		newId: "viewAvatarItemBundles",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "AvatarItemViewSaleTimer",
		newId: "viewAvatarItemSaleTimer",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "SearchByCreatorButton",
		newId: "avatarItemSearchByCreator",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "FixDeeplinks",
		newId: "fixExperienceDeeplinks",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	/*
	{
		id: "AccountPinPromptMoreLocations",
		newId: "accountPinPromptAnywhere",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},*/
	{
		id: "Enable3DThumbnailDynamicLighting",
		newId: "3dThumbnailDynamicLighting",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "CSSFixes",
		newId: "cssFixes",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "ErrorShowMachineID",
		newId: "errorPageMachineId",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "GetUnreadR2EButton",
		newId: "getUnreadR2EButton",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "Transactions0RobuxAmountToggle",
		newId: "transactionsHideFreeItemsToggle",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "TransactionsPrivateServersToggle",
		newId: "transactionsHidePrivateServersToggle",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "PersistentTransactionsSelection",
		newId: "myTransactionsHashNav.persistTransactionsSelection",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "MarketplaceColorFilters",
		newId: "clientMarketplaceColorFilters",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	/*
	{
		id: "DisableAvatarShopInfiniteScrolling",
		newId: "disableMarketplaceInfiniteScrolling",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},*/
	{
		id: "ChatSortTypes",
		newId: "chatSorts",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "HideWalletInNav",
		newId: "hideWalletInNav",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "RoSealSettingDropdown",
		newId: "rosealSettingsInDropdown",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	/*
	{
		id: "MoveAgeBracket",
		newId: "ageBracket",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},*/
	{
		id: "ChangeNavFriendsHash",
		newId: "changeFriendsNav",
		component: {
			type: "Dropdown",
			values: [
				{
					value: "friends",
					newValue: "friends",
				},
				{
					value: "following",
					newValue: "following",
				},
				{
					value: "followers",
					newValue: "followers",
				},
				{
					value: "friend-requests",
					newValue: "friend-requests",
				},
			],
			defaultValue: "friend-requests",
		},
	},
	{
		id: "HideFriendRequestsCount",
		newId: "hideFriendsNotificationsCount",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "HideMessagesCount",
		newId: "hideMessagesNotificationsCount",
		component: {
			type: "Toggle",
			defaultValue: false,
		},
	},
	{
		id: "BodyColors3s",
		newId: "hexBodyColors",
		component: {
			type: "Toggle",
			defaultValue: true,
		},
	},
	{
		id: "AnimalImages",
		newId: "animalImages",
		component: {
			type: "DropdownWithToggle",
			values: [
				{
					value: "Seal",
					newValue: "seal",
				},
				{
					value: "Kitty",
					newValue: "kitty",
				},
			],
			defaultValue: "Disabled",
		},
	},
	{
		id: "AnimalText",
		newId: "animalText",
		component: {
			type: "DropdownWithToggle",
			values: [
				{
					value: "Seal",
					newValue: "seal",
				},
				{
					value: "Kitty",
					newValue: "kitty",
				},
			],
			defaultValue: "Disabled",
		},
	},
];

const conformStorageKeys = [
	{
		id: "ExperiencePrivateNotes",
		newId: PRIVATE_NOTE_STORAGE_KEY,
	},
	{
		id: "GroupOrganization",
		newId: GROUP_ORGANIZATION_STORAGE_KEY,
	},
	{
		id: "PrivateServerLinks",
		newId: PRIVATE_SERVER_LINKS_STORAGE_KEY,
	},
	/*
	{
		id: "Locale",
		newId: PREFERRED_LOCALES_STORAGE_KEY,
	},*/
	{
		id: "VoiceChatSuspension",
		newId: VOICE_CHAT_SUSPENSION_STORAGE_KEY,
	},
];

const deleteStorageKeys = [
	"DisabledFeatures",
	"Flags",
	"Alerts_Dismissed",
	// "Delay_HomeHeaderBirthdayMessage",
];

export function migrateStorage(
	// biome-ignore lint/suspicious/noExplicitAny: Fine
	mergeValue: Record<string, any>,
	// biome-ignore lint/suspicious/noExplicitAny: Fine
	currentValue: Record<string, any>,
) {
	const deleteKeys: string[] = [];

	const timeType = mergeValue.feature_CreatedUpdatedItemsTimeType;
	const tooltipTimeType = mergeValue.feature_TooltipTimeType;
	if (mergeValue.feature_CreatedUpdatedItemsTimeType) {
		currentValue[FEATURE_STORAGE_KEY] ??= {};
		for (const target of timeTargets) {
			currentValue[FEATURE_STORAGE_KEY][`times.${target}.time`] = [
				timeType !== "Disabled",
				timeType !== "Disabled" ? timeType.toLowerCase() : "relative",
			];
		}
	}
	if (mergeValue.feature_TooltipTimeType) {
		currentValue[FEATURE_STORAGE_KEY] ??= {};
		for (const target of timeTargets) {
			currentValue[FEATURE_STORAGE_KEY][`times.${target}.tooltip`] = [
				tooltipTimeType !== "Disabled",
				tooltipTimeType !== "Disabled" ? tooltipTimeType.toLowerCase() : "absolute",
			];
		}
	}
	for (const [key, value] of Object.entries(mergeValue)) {
		if (key.startsWith("feature_")) {
			currentValue[FEATURE_STORAGE_KEY] ??= {};
			const features = currentValue[FEATURE_STORAGE_KEY];

			const featureName = key.split("_")[1];
			for (const feature of featureKeys) {
				if (feature.id === featureName) {
					if (feature.component.type === "Toggle") {
						features[feature.newId] = value;
					} else if (
						feature.component.type === "Dropdown" ||
						(feature.component.type === "DropdownWithToggle" && value !== "Disabled")
					) {
						const newValue = feature.component.values?.find(
							(value) => (value.value as unknown) === value,
						)?.newValue;

						if (newValue) {
							features[feature.newId] = newValue;
						} else {
							deleteKeys.push(key);
						}
					} else if (feature.component.type === "InputWithToggle") {
						features[feature.newId] = [value];
					}
					break;
				}
			}

			deleteKeys.push(key);
		} else if (key === "Alerts_LastPPAccept") {
			currentValue[AGREEMENTS_STORAGE_KEY] = value;
			deleteKeys.push(key);
		} else if (key === "Locale") {
			try {
				const newLocale = Intl.getCanonicalLocales(value)[0];
				if (newLocale) {
					currentValue[PREFERRED_LOCALES_STORAGE_KEY] = [newLocale];
				}
				deleteKeys.push(key);
			} catch {}
		} else if (key === "BlockedExperiences") {
			currentValue[BLOCKED_ITEMS_STORAGE_KEY] ??= {
				experiences: {
					descriptions: [],
					ids: [],
					names: [],
				},
				items: {
					descriptions: [],
					items: [],
					names: [],
				},
				creators: [],
			} satisfies BlockedItemsStorage;
			const nextValue = currentValue[BLOCKED_ITEMS_STORAGE_KEY] as BlockedItemsStorage;
			nextValue.experiences.ids.push(...value.ids);
			nextValue.experiences.names.push(...value.keywords);
			deleteKeys.push(key);
		} else if (deleteStorageKeys.includes(key) || key.startsWith("Delay_")) {
			deleteKeys.push(key);
		} else {
			const conform = conformStorageKeys.find((conform) => conform.id === key);
			if (conform) {
				currentValue[conform.newId] = value;
				deleteKeys.push(key);
			} else {
				currentValue[key] = value;
			}
		}
	}

	for (const key in currentValue) {
		if (
			!ALL_MAIN_STORAGE_KEYS.includes(key) &&
			!LEGACY_MAIN_UNMIGRATED_STORAGE_KEYS.includes(key)
		) {
			delete currentValue[key];
			//deleteKeys.push(key);
		}
	}

	return {
		deleteKeys,
		newValue: currentValue,
	};
}
