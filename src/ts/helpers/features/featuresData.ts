import type { Target } from "scripts/build/constants";
import type { ButtonType } from "src/ts/components/core/Button";
import { HOME_SORTS_LAYOUT_STORAGE_KEY } from "src/ts/components/home/layoutCustomization/constants";
import {
	ACCOUNTS_BIGGER_GAP_FEATURE_ID,
	ACCOUNTS_DISCOVERY_FEATURE_ID,
	ACCOUNTS_FEATURE_ID,
	ACCOUNTS_SHOW_AGE_BRACKET_FEATURE_ID,
	ACCOUNTS_SHOW_AUTHENTICATED_USER_PILL_FEATURE_ID,
	ACCOUNTS_UPDATE_TABS_FEATURE_ID,
	UNENCRYPTED_ACCOUNTS_STORAGE_KEY,
} from "src/ts/constants/accountsManager";
import {
	ACCOUNT_TRACKING_PREVENTION_FEATURE_ID,
	ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY,
} from "src/ts/constants/accountTrackingPrevention";
import {
	AVATAR_ITEM_LISTS_STORAGE_KEY,
	BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY,
} from "src/ts/constants/avatar";
import {
	COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	COMMUNITY_SHOUT_NOTIFICATIONS_FEATURE_ID,
	COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY,
} from "src/ts/constants/communities";
import { DEVEX_FIAT_CURRENCIES } from "src/ts/constants/devexRates";
import { PRIVATE_NOTE_STORAGE_KEY } from "src/ts/constants/experiences";
import {
	CONNECTIONS_TYPES_STORAGE_KEY,
	FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_LAST_SEEN_FEATURE_ID,
	FRIENDS_LAST_SEEN_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
} from "src/ts/constants/friends";
import { GROUP_ORGANIZATION_STORAGE_KEY } from "src/ts/constants/groupOrganization";
import { BIRTHDAYMESSAGE_DELAY_KEY } from "src/ts/constants/home";
import {
	ALLOWED_ITEMS_STORAGE_KEY,
	ARCHIVED_ITEMS_STORAGE_KEY,
	BLOCKED_ITEMS_STORAGE_KEY,
	PERSIST_TRANSACTIONS_SELECTION_LOCALSTORAGE_KEY,
	ROBUX_HISTORY_STORAGE_KEY,
	STARTUP_NOTIFICATIONS_FEATURE_ID,
} from "src/ts/constants/misc";
import { EXPERIMENTS_DISCOVERED_STORAGE_KEY } from "src/ts/constants/robloxExperiments";
import {
	TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	TRADING_NOTIFICATIONS_FEATURE_ID,
	TRADING_NOTIFICATIONS_STORAGE_KEY,
} from "src/ts/constants/trades";
import { getRolimonsUrl, getRoSealUrl } from "src/ts/utils/baseUrls";
import { getHomePageUrl } from "src/ts/utils/links";
import { getDelayKey } from "src/ts/utils/misc";
import type { FlagCall } from "../flags/flags";
import type { SubscriptionTier } from "../requests/services/roseal";

export type FeatureType = "Regular" | "Beta" | "Experimental";

export type FeatureComponentTypeToggle = {
	type: "Toggle";
	shouldChangeValue?: (value: boolean) => boolean;
	defaultValue: boolean;
};

export type FeatureComponentTypeInputWithToggle = {
	type: "InputWithToggle";

	toggleDefaultValue: boolean;
};

export type FeatureComponentTypeDropdownWithToggle<T extends string | number = string | number> = {
	type: "DropdownWithToggle";
	values: (DropdownValue<T> | DropdownGroup<T>)[];
	defaultValue: T;
	toggleDefaultValue: boolean;
};

export type DropdownValue<T extends string | number | boolean> = {
	value: T;
	label?: string;
	labelFormat?: "region" | "currencyCode";
};

export type DropdownGroup<T extends string | number | boolean> = {
	id: string;
	values: DropdownValue<T>[];
};

export type FeatureComponentTypeDropdown<
	T extends string | number | boolean = string | number | boolean,
> = {
	type: "Dropdown";
	shouldChangeValue?: (value: T) => boolean;
	defaultValue: T;
	values: (DropdownValue<T> | DropdownGroup<T>)[];
};

export type FeatureComponentTypePlaceholder = {
	type: "Placeholder";
};

export type FeaturePermissionPermission = "cookies" | "notifications";

export type FeaturePermissions = {
	permissions?: FeaturePermissionPermission[];
	origins?: string[];
};

export type BooleanOrFlagCall =
	| boolean
	| {
			type: "Flag";
			value: FlagCall;
	  };

export type DescriptionVariable = {
	placeholder: string;
	value: () => MaybePromise<string>;
};

export type Feature = {
	type: FeatureType;
	subscriptionTier?: SubscriptionTier;
	id: string;
	variant?: number;
	hasCSS?: boolean;
	descriptionVariables?: Record<string, DescriptionVariable>;
	storageKeys?: {
		localStorage?: string[];
		localForage?: string[];
		session?: string[];
		main?: string[];
	};
	permissions?: {
		required?: FeaturePermissions;
		optional?: FeaturePermissions;
	};
	deprecated?: BooleanOrFlagCall;
	disabled?: boolean;
	supportedTargets?: Target[];
	component:
		| FeatureComponentTypeToggle
		| FeatureComponentTypeDropdown
		| FeatureComponentTypePlaceholder
		| FeatureComponentTypeInputWithToggle
		| FeatureComponentTypeDropdownWithToggle;
	subfeatures?: {
		items: Feature[];
		showAsList?: boolean;
	};
	btns?: {
		href: string;
		type: ButtonType;
		id: string;
	}[];
	_isSubOf?: Feature;
};

export type Subsection = {
	id: string;
	features: Feature[];
};

export type Section = {
	id: string;
	subsections: Subsection[];
};

export type ExtractMainFeatures<T extends Section[]> =
	T[number]["subsections"][number]["features"][number];

type ExtractAllSubfeaturesRecursive<T extends Feature> = T extends {
	subfeatures: { items: infer U };
}
	? U extends Feature[]
		? U[number] | ExtractAllSubfeaturesRecursive<U[number]>
		: never
	: never;

export type ExtractAllSubfeatures<T extends Section[]> = ExtractAllSubfeaturesRecursive<
	ExtractMainFeatures<T>
>;

export type FeaturesIntoRecord<T extends Section[]> = {
	[key in ExtractMainFeatures<T>["id"]]: Extract<
		ExtractMainFeatures<T>,
		{
			id: key;
		}
	>;
} & {
	[key in ExtractAllSubfeatures<T>["id"]]: Extract<
		ExtractAllSubfeatures<T>,
		{
			id: key;
		}
	>;
};

export type ExtractDropdownValues<
	T extends DropdownValue<string | number | boolean> | DropdownGroup<string | number | boolean>,
> =
	T extends DropdownValue<string | number | boolean>
		? T["value"]
		: T extends DropdownGroup<string | number>
			? T["values"][number]["value"]
			: never;

export type FeatureValue<T extends Feature> = T extends { component: infer U }
	? U extends FeatureComponentTypeToggle
		? boolean
		: U extends FeatureComponentTypeDropdownWithToggle
			? [boolean, ExtractDropdownValues<U["values"][number]>]
			: U extends FeatureComponentTypeDropdown
				? ExtractDropdownValues<U["values"][number]>
				: U extends FeatureComponentTypeInputWithToggle
					? [boolean, string?]
					: never
	: never;

export const timeFormatTypes = [
	{ value: "relative" },
	{ value: "absolute" },
	{ value: "regular" },
] as const;
export const timeTargets = [
	"avatarItems",
	"associatedItems",
	"experiences",
	"userProfiles",
	"groupProfiles",
] as const;
export const timeTypes = ["time", "tooltip"] as const;
export type TimeFormatType = (typeof timeFormatTypes)[number];
export type TimeTarget = (typeof timeTargets)[number];
export type TimeType = (typeof timeTypes)[number];

const inventoryItemCategories = [
	{
		id: "accessories",
		values: [
			{ value: "accessories/head" },
			{ value: "accessories/face" },
			{ value: "accessories/neck" },
			{ value: "accessories/shoulder" },
			{ value: "accessories/front" },
			{ value: "accessories/back" },
			{ value: "accessories/waist" },
			{ value: "accessories/gear" },
		],
	},
	{ value: "animations" },

	{ value: "audio" },
	{
		id: "avatar-animations",
		values: [
			{ value: "avatar-animations/run" },
			{ value: "avatar-animations/walk" },
			{ value: "avatar-animations/fall" },
			{ value: "avatar-animations/jump" },
			{ value: "avatar-animations/idle" },
			{ value: "avatar-animations/swim" },
			{ value: "avatar-animations/climb" },
			{ value: "avatar-animations/pose" },
			{ value: "avatar-animations/death" },
		],
	},
	{
		id: "body-parts",
		values: [
			{
				value: "body-parts/torso",
			},
			{
				value: "body-parts/right-arm",
			},
			{
				value: "body-parts/left-arm",
			},
			{
				value: "body-parts/right-leg",
			},
			{
				value: "body-parts/left-leg",
			},
		],
	},
	{ value: "badges" },
	{
		id: "bottoms",
		values: [
			{ value: "bottoms/pants" },
			{ value: "bottoms/shorts" },
			{ value: "bottoms/skirts" },
		],
	},
	{
		id: "bundles",
		values: [
			{
				value: "bundles/body-parts",
			},
			{
				value: "bundles/avatar-animations",
			},
			{
				value: "bundles/shoes",
			},
		],
	},
	{
		id: "classic-clothing",
		values: [
			{ value: "classic-clothing/classic-t-shirts" },
			{ value: "classic-clothing/classic-shirts" },
			{ value: "classic-clothing/classic-pants" },
		],
	},
	{ value: "classic-heads" },
	{ value: "decals" },
	{ value: "emote-animations" },
	{ value: "faces" },
	{ value: "hair" },
	{
		id: "heads",
		values: [
			{
				value: "heads/heads",
			},
			{
				value: "heads/mood-animations",
			},
			{
				value: "heads/eyebrows",
			},
			{
				value: "heads/eyelashes",
			},
			{
				value: "heads/dynamic-heads-asset",
			},
		],
	},
	{ value: "meshparts" },
	{ value: "models" },
	{ value: "game-passes" },
	{
		id: "places",
		values: [
			{ value: "places/created-by-me" },
			{ value: "places/purchased" },
			{ value: "places/my-experiences" },
			{ value: "places/other-experiences" },
		],
	},
	{ value: "plugins" },
	{
		id: "private-servers",
		values: [
			{ value: "private-servers/my-private-servers" },
			{ value: "private-servers/other-private-servers" },
		],
	},
	{
		id: "shoes",
		values: [{ value: "shoes/left-shoe" }, { value: "shoes/right-shoe" }],
	},
	{
		id: "tops",
		values: [
			{ value: "tops/t-shirts" },
			{ value: "tops/shirts" },
			{ value: "tops/sweaters" },
			{ value: "tops/jackets" },
		],
	},
	{ value: "video" },
];

const favoriteItemCategories = [
	{
		id: "accessories",
		values: [
			{ value: "accessories/head" },
			{ value: "accessories/face" },
			{ value: "accessories/neck" },
			{ value: "accessories/shoulder" },
			{ value: "accessories/front" },
			{ value: "accessories/back" },
			{ value: "accessories/waist" },
			{ value: "accessories/gear" },
		],
	},

	{ value: "animations" },
	{ value: "audio" },
	{
		id: "avatar-animations",
		values: [
			{ value: "avatar-animations/run" },
			{ value: "avatar-animations/walk" },
			{ value: "avatar-animations/fall" },
			{ value: "avatar-animations/jump" },
			{ value: "avatar-animations/idle" },
			{ value: "avatar-animations/swim" },
			{ value: "avatar-animations/climb" },
			{ value: "avatar-animations/pose" },
			{ value: "avatar-animations/death" },
		],
	},
	{
		id: "body-parts",
		values: [
			{
				value: "body-parts/torso",
			},
			{
				value: "body-parts/right-arm",
			},
			{
				value: "body-parts/left-arm",
			},
			{
				value: "body-parts/right-leg",
			},
			{
				value: "body-parts/left-leg",
			},
		],
	},
	{
		id: "bottoms",
		values: [
			{ value: "bottoms/pants" },
			{ value: "bottoms/shorts" },
			{ value: "bottoms/skirts" },
		],
	},
	{
		id: "bundles",
		values: [
			{
				value: "bundles/body-parts",
			},
			{
				value: "bundles/avatar-animations",
			},
			{
				value: "bundles/shoes",
			},
		],
	},
	{
		id: "classic-clothing",
		values: [
			{ value: "classic-clothing/classic-t-shirts" },
			{ value: "classic-clothing/classic-shirts" },
			{ value: "classic-clothing/classic-pants" },
		],
	},

	{ value: "classic-heads" },
	{ value: "decals" },
	{ value: "emote-animations" },
	{ value: "faces" },
	{ value: "hair" },
	{
		id: "heads",
		values: [
			{
				value: "heads/heads",
			},
			{
				value: "heads/mood-animations",
			},
			{
				value: "heads/eyebrows",
			},
			{
				value: "heads/eyelashes",
			},
			{
				value: "heads/dynamic-heads-asset",
			},
		],
	},
	{ value: "meshparts" },
	{ value: "models" },
	{ value: "places" },
	{ value: "plugins" },
	{
		id: "shoes",

		values: [{ value: "shoes/left-shoe" }, { value: "shoes/right-shoe" }],
	},
	{
		id: "tops",

		values: [
			{ value: "tops/t-shirts" },
			{ value: "tops/shirts" },
			{ value: "tops/sweaters" },
			{ value: "tops/jackets" },
		],
	},
	{ value: "video" },
];

const timesFeatures: {
	[K in TimeTarget]: {
		type: "Regular";
		id: `times.${K}`;
		component: {
			type: "Placeholder";
		};
		subfeatures: {
			items: {
				[K2 in TimeType]: {
					type: "Regular";
					id: `times.${K}.${K2}`;
					component: {
						type: "DropdownWithToggle";
						values: TimeFormatType[];
						toggleDefaultValue: boolean;
						defaultValue: K2 extends "time" ? "relative" : "absolute";
					};
				};
			}[TimeType][];
			showAsList: true;
		};
	};
}[TimeTarget][] = [];
for (const item of timeTargets) {
	const itemItems = [];
	for (const type of timeTypes) {
		itemItems.push({
			type: "Regular" as const,
			id: `times.${item}.${type}` as const,
			component: {
				type: "DropdownWithToggle" as const,
				values: timeFormatTypes as Writable<typeof timeFormatTypes>,
				toggleDefaultValue: true,
				defaultValue: type === "time" ? "relative" : "absolute",
			},
		});
	}
	timesFeatures.push({
		type: "Regular",
		id: `times.${item}`,
		component: {
			type: "Placeholder",
		},
		subfeatures: {
			// @ts-expect-error: Fine
			items: itemItems,
			showAsList: true,
		},
	});
}

const devexDropdownValues = DEVEX_FIAT_CURRENCIES.map((currency) => ({
	value: currency,
	labelFormat: "currencyCode" as const,
}));

export const sections = [
	{
		id: "home",
		subsections: [
			{
				id: "sorts",
				features: [
					{
						type: "Regular",
						id: "improvedConnectionsCarousel",
						variant: 1,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "improvedConnectionsCarousel.showCardUsername",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedConnectionsCarousel.autoUpdate",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: 1,
											},
											{
												value: 3,
											},
											{
												value: 5,
											},
											{
												value: 10,
											},
										],
										defaultValue: 3,
										toggleDefaultValue: false,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "homeFriendsRows",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: 1,
								},
								{
									value: 2,
								},
								{
									value: 3,
								},
								{
									value: 4,
								},
								{
									value: 5,
								},
							],
							defaultValue: 2,
							toggleDefaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "customizeHomeSortsLayout",
						storageKeys: {
							main: [HOME_SORTS_LAYOUT_STORAGE_KEY],
						},
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "customizeHomeSortsLayout.hideButton",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
									hasCSS: true,
								},
								{
									type: "Regular",
									id: "customizeHomeSortsLayout.playlists",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									hasCSS: true,
								},
							],
						},
						btns: [
							{
								id: "openCustomizeLayout",
								type: "secondary",
								href: `${getHomePageUrl()}?customizeLayout=true`,
							},
						],
					},
				],
			},
			{
				id: "misc",
				features: [
					{
						type: "Regular",
						id: "hideAddFriendsButton",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "expandHomeContent",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: "expand",
								},
								{
									value: "shrink",
								},
							],
							defaultValue: "shrink",
							toggleDefaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "homeUserHeader",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "homeUserHeader.birthdayMessage",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									storageKeys: {
										main: [getDelayKey(BIRTHDAYMESSAGE_DELAY_KEY)],
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.easterEggText",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.includeWhiteBackground",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.includeBadges",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.greetingText",
									component: {
										type: "InputWithToggle",
										toggleDefaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.displayNameType",
									component: {
										type: "Dropdown",
										values: [
											{
												value: "both",
											},
											{
												value: "displayName",
											},
											{
												value: "username",
											},
										],
										defaultValue: "both",
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.thumbnailType",
									component: {
										type: "Dropdown",
										values: [
											{
												value: "Avatar",
											},
											{
												value: "AvatarHeadShot",
											},
											{
												value: "AvatarBust",
											},
										],
										defaultValue: "AvatarHeadShot",
									},
								},
								{
									type: "Regular",
									id: "homeUserHeader.thumbnailSize",
									component: {
										type: "Dropdown",
										values: [
											{
												value: "small",
											},
											{
												value: "medium",
											},
											{
												value: "large",
											},
											{
												value: "extraLarge",
											},
										],
										defaultValue: "large",
									},
									hasCSS: true,
								},
							],
						},
					},
					{
						type: "Regular",
						id: "removePhoneNumberUpsells",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
				],
			},
		],
	},
	{
		id: "experiences",
		subsections: [
			{
				id: "discovery",
				features: [
					{
						type: "Beta",
						id: "chartsClientFilters",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "chartsTryExactMatch",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "store",
				features: [
					{
						type: "Regular",
						id: "viewExperienceDeveloperProducts",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "experienceStoreFiltering",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "stats",
				features: [
					{
						type: "Regular",
						id: "experienceRecentVotes",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: 2,
								},
								{
									value: 7,
								},
								{
									value: 14,
								},
								{
									value: 21,
								},
								{
									value: 28,
								},
							],
							defaultValue: 14,
							toggleDefaultValue: false,
						},
						hasCSS: true,
						permissions: {
							required: {
								origins: [`*://${getRolimonsUrl("*", "/*")}`],
							},
						},
					},
					{
						type: "Regular",
						id: "experienceLiveStatsChart",
						variant: 1,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "experienceStatsTooltips",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "experienceStatsTooltips.experienceLiveStats",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: 3,
											},
											{
												value: 5,
											},
											{
												value: 10,
											},
											{
												value: 15,
											},
											{
												value: 20,
											},
										],
										defaultValue: 10,
										toggleDefaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "viewExperienceRestrictedCountries",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewExperienceSupportedDevices",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewExperienceAvatarType",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "viewExperienceAvatarType.showAvatarRestricted",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "experiencePlaytime",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "experiencePlaytime.hideIfOtherExtensions",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									hasCSS: true,
								},
							],
						},
					},
				],
			},
			{
				id: "events",
				features: [
					{
						type: "Regular",
						id: "moveExperienceEvents",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						variant: 2,
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "moveExperienceEvents.showPastEvents",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "experienceEventsUpdatedCreated",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "details",
				features: [
					{
						type: "Regular",
						id: "experienceVerticalStats",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "experienceRestrictedScreen",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "experienceCountdown",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						permissions: {
							required: {
								origins: [`*://${getRoSealUrl("*", "/*")}`],
							},
						},
					},
					{
						type: "Regular",
						id: "experiencePrivateNotes",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						storageKeys: {
							main: [PRIVATE_NOTE_STORAGE_KEY],
						},
					},
					{
						type: "Regular",
						id: "disableExperienceCarouselVideoAutoplay",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "experienceLinks",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						permissions: {
							required: {
								origins: [`*://${getRoSealUrl("*", "/*")}`],
							},
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "experienceLinks.useFandomMirror",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "checkExperienceBan",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "hidePrivateServersInAbout",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "easyExperienceAltText",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "experienceAllowJoinNonRootPlaces",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "badges",
				features: [
					{
						type: "Regular",
						id: "badgeAwardedStats",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "improvedExperienceBadges",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "improvedExperienceBadges.showBadgeProgress",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceBadges.showGridUI",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceBadges.showFiltersSorts",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceBadges.hideRobloxBadges",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
									hasCSS: true,
								},
							],
						},
					},
				],
			},
			{
				id: "servers",
				features: [
					{
						type: "Regular",
						id: "improvedExperienceServersTab",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						variant: 1,
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "improvedExperienceServersTab.excludeFullServersDefault",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.tryGetServerInfo",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: "allServers",
											},
											{
												value: "nonFullServers",
											},
										],
										defaultValue: "allServers",
										toggleDefaultValue: true,
									},
									subfeatures: {
										items: [
											{
												type: "Regular",
												id: "improvedExperienceServersTab.tryGetServerInfo.showServerLocation",
												component: {
													type: "Toggle",
													defaultValue: true,
												},
												permissions: {
													required: {
														origins: [`*://${getRoSealUrl("*", "/*")}`],
													},
												},
											},
											{
												type: "Regular",
												id: "improvedExperienceServersTab.tryGetServerInfo.regionFilters",
												component: {
													type: "Toggle",
													defaultValue: true,
												},
												permissions: {
													required: {
														origins: [`*://${getRoSealUrl("*", "/*")}`],
													},
												},
											},
											{
												type: "Regular",
												id: "improvedExperienceServersTab.tryGetServerInfo.showServerDistance",
												component: {
													type: "Toggle",
													defaultValue: false,
												},
												permissions: {
													required: {
														origins: [`*://${getRoSealUrl("*", "/*")}`],
													},
												},
											},
											{
												type: "Regular",
												id: "improvedExperienceServersTab.tryGetServerInfo.showServerConnectionSpeed",
												component: {
													type: "Toggle",
													defaultValue: true,
												},
											},
											{
												type: "Regular",
												id: "improvedExperienceServersTab.tryGetServerInfo.showServerPlaceVersion",
												component: {
													type: "Toggle",
													defaultValue: true,
												},
											},
											{
												type: "Regular",
												id: "improvedExperienceServersTab.tryGetServerInfo.calculateServerDistance",
												component: {
													type: "DropdownWithToggle",
													values: [
														{
															value: "fromAPI",
														},
														{
															value: "fromGeolocation",
														},
													],
													defaultValue: "fromAPI",
													toggleDefaultValue: true,
												},
												subfeatures: {
													items: [
														{
															// in the future, this will allow using preferred regions instead of requiring on getting the users approximate location
															type: "Regular",
															id: "improvedExperienceServersTab.tryGetServerInfo.preferredServerButton",
															component: {
																type: "Toggle",
																defaultValue: false,
															},
															permissions: {
																required: {
																	origins: [
																		`*://${getRoSealUrl("*", "/*")}`,
																	],
																},
															},
														},
													],
												},
											},
										],
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showConnectionsInServer",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showServerLikelyBotted",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showServerUpdateDelay",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showServerPerformance",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showCopyGenerateLink",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showExpiringDate",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showShareLink",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.paginationType",
									component: {
										type: "Dropdown",
										defaultValue: "loadMore",
										values: [
											{
												value: "pagination",
											},
											{
												value: "loadMore",
											},
										],
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.paginationSize",
									component: {
										type: "Dropdown",
										defaultValue: 8,
										values: [
											{
												value: 8,
											},
											{
												value: 16,
											},
											{
												value: 24,
											},
											{
												value: 32,
											},
											{
												value: 40,
											},
											{
												value: 48,
											},
											{
												value: 56,
											},
											{
												value: 64,
											},
											{
												value: 72,
											},
											{
												value: 80,
											},
											{
												value: 88,
											},
											{
												value: 96,
											},
										],
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.privateServerRows",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.joinServerDebug",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedExperienceServersTab.showDebugInfo",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: "all",
											},
											{
												value: "idOnly",
											},
										],
										toggleDefaultValue: true,
										defaultValue: "idOnly",
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "precreateExperiencePrivateServers",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "privateServerLinksSection",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "privateServerLinksSection.tryResolveOwner",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
				],
			},
			{
				id: "misc",
				features: [
					{
						type: "Regular",
						id: "viewExperienceTopSongs",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Beta",
						id: "improvedServerJoinModal",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "improvedServerJoinModal.tryGetMatchmadeServer",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedServerJoinModal.delayServerJoin",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedServerJoinModal.showRCCServerInfo",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedServerJoinModal.showChannelName",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedServerJoinModal.useDeepLinkProtocol",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "improvedServerJoinModal.sillyText",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
									subfeatures: {
										items: [
											{
												type: "Regular",
												id: "improvedServerJoinModal.sillyText.customParticiple",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
											{
												type: "Regular",
												id: "improvedServerJoinModal.sillyText.customModifier",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
											{
												type: "Regular",
												id: "improvedServerJoinModal.sillyText.customSubject",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
										],
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "experienceTestPilotSettings",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewExperiencePlaces",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "viewExperiencePlaces.nonStartPlaceNotice",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "showExperienceShadowBanned",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "addGroupExperiencesToProfile",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
		],
	},
	{
		id: "users",
		subsections: [
			{
				id: "friends",
				features: [
					{
						type: "Regular",
						id: "improvedUserFriendsPage",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "improvedUserFriendsPage.peopleYouMayKnow",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.mutualsTab",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									hasCSS: true,
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.advancedFiltering",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.connectionsTypes",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									storageKeys: {
										main: [CONNECTIONS_TYPES_STORAGE_KEY],
									},
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.trustedConnectionsTab",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.pageSize",
									component: {
										type: "Dropdown",
										defaultValue: 18,
										values: [
											{
												value: 18,
											},
											{
												value: 24,
											},
											{
												value: 30,
											},
											{
												value: 36,
											},
											{
												value: 42,
											},
											{
												value: 48,
											},
											{
												value: 54,
											},
											{
												value: 60,
											},
										],
									},
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.getAccurateFriendDate",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedUserFriendsPage.showFriendRequestSentAt",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: FRIENDS_LAST_SEEN_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						storageKeys: {
							main: [FRIENDS_LAST_SEEN_STORAGE_KEY],
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "userJoinCheck",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "handleFriendLinks",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "userFriendsMoreActions",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "inventory",
				features: [
					{
						type: "Regular",
						id: "viewItemFavoritedDate",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "viewItemFavoritedDate.showOnHover",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "viewInventoryItemObtainedDate",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "viewInventoryItemObtainedDate.showOnHover",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									hasCSS: true,
								},
							],
						},
					},
					{
						type: "Regular",
						id: "inventorySortFilters",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "inventoryHideFreePurchasedPlaces",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewMoreInventoryFavoritesTypes",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "viewMoreInventoryFavoritesTypes.includeUnusedTypes",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "viewUserSharedPrivateServers",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "profile",
				features: [
					{
						type: "Experimental",
						id: "profileCustomization",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewUserProfileLocale",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						variant: 1,
					},
					{
						type: "Regular",
						id: "viewUserPublishedAvatars",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "forceProfileFullBodyAvatarType",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: "R15",
								},
								{
									value: "R6",
								},
							],
							defaultValue: "R15",
							toggleDefaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "profilePlayerBadgesObtainedDates",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "liveProfilePresenceUpdate",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "cancelFriendRequests",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "confirmRemoveConnection",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "removeFollowers",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "previewUserDeletedProfile",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewUserRAP",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewUserProfilePortrait",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "viewUserEquippedEmotes",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "improvedUserCurrentlyWearing",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "improvedUserCurrentlyWearing.showAssociatedItemsBundle",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedUserCurrentlyWearing.separateAnimationsTab",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "improvedUserCurrentlyWearing.showTotalValue",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									subfeatures: {
										items: [
											{
												type: "Regular",
												id: "improvedUserCurrentlyWearing.showTotalValue.includeAnimations",
												component: {
													type: "Toggle",
													defaultValue: true,
												},
											},
											{
												type: "Regular",
												id: "improvedUserCurrentlyWearing.showTotalValue.includeEmotes",
												component: {
													type: "Toggle",
													defaultValue: false,
												},
											},
										],
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "userProfileAddPadding",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "previewFilteredText",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "userBlockedScreen",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "pastUsernamesCount",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "showUserCommunitiesRoles",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "desktopPastUsernamesButton",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						deprecated: true,
					},
					{
						type: "Regular",
						id: "userProfileEasterEggs",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "misc",
				features: [
					{
						type: "Regular",
						id: "removeWhiteBackgroundFriendCarouselsDarkTheme",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "showDeletedUsersUsernames",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "showOfflineStatusIcon",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "userPagesNewTitle",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "userOmniSearchOverridePageLimit",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: 50,
								},
								{
									value: 100,
								},
								{
									value: 150,
								},
								{
									value: 200,
								},
							],
							defaultValue: 50,
							toggleDefaultValue: false,
						},
					},
				],
			},
		],
	},
	{
		id: "groups",
		subsections: [
			{
				id: "nav",
				features: [
					{
						id: "groupOrganization",
						type: "Beta",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						storageKeys: {
							main: [GROUP_ORGANIZATION_STORAGE_KEY],
						},
					},
					{
						id: "groupSeamlessNavigation",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						id: "viewUserGroupJoinRequests",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
				],
			},
			{
				id: "general",
				features: [
					{
						id: "moveCommunitySocialLinks",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						id: "communityWallTradeLinks",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						id: "searchGroupStore",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						id: "disableGroupWallInfiniteScrolling",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						id: "showGroupCreatedDate",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "showGroupCreatedDate.showOriginalCreator",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									hasCSS: true,
								},
							],
						},
					},
					{
						id: "hideEmptyGroupEvents",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "hideEmptyGroupEvents.hideEmptyForOwner",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
						hasCSS: true,
					},
					{
						id: "showRequestToJoinCommunity",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						id: "showCommunityJoinedDate",
						type: "Regular",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
				],
			},
		],
	},
	{
		id: "items",
		subsections: [
			{
				id: "avatarItems",
				features: [
					{
						type: "Regular",
						id: "viewAvatarItemHeldPeriod",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemExperienceCreation",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemResellerMoreInfo",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "avatarItemSearchByCreator",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemConnectionsOwned",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemSaleTimer",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemLastOnSale",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "avatarItemArchiveInInventory",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						storageKeys: {
							main: [ARCHIVED_ITEMS_STORAGE_KEY],
						},
						variant: 1,
					},
					{
						type: "Regular",
						id: "avatarItemToggleAvatar",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "avatarItemRefreshDetails",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "avatarItemQuickFreePurchase",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "fix3DTryOn2DItems",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "itemsCollectionsButtonFix",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewHiddenAvatarItems",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemRAPAfterPurchase",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "avatarItemCreatedUpdated",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "avatarItemCreatedUpdated.showActors",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: "avatarItemCreatedUpdated.showThumbnailUpdated",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemBundles",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemTags",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarItemSaleExperiences",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarBundleRecolorable",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewOwnedAvatarItemPrice",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "avatarItemMorePriceChartData",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "storeItems",
				features: [
					{
						type: "Regular",
						id: "viewOffsaleStoreItems",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "misc",
				features: [
					{
						type: "Regular",
						id: "viewItemSales",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
		],
	},
	{
		id: "avatar",
		subsections: [
			{
				id: "marketplace",
				features: [
					{
						type: "Regular",
						id: "fixLooksTryOn",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "marketplaceSearchLooks",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "marketplaceLandingParity",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "marketplaceHideTopics",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "marketplaceShowQuantityRemaining",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "fixMarketplaceOffSaleFilter",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Experimental",
						id: "clientMarketplaceColorFilters",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "marketplaceCreatorTypeFilter",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "marketplaceOwnedFilter",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "editor",
				features: [
					{
						type: "Regular",
						id: "avatarEditorSearch",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						variant: 1,
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "avatarEditorCurrentlyWearing",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "avatarEditorPostAvatar",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "bypassR6RestrictionModal",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						storageKeys: {
							localStorage: [BYPASS_R6_RESTRICTION_MODAL_LOCALSTORAGE_KEY],
						},
					},
					{
						type: "Regular",
						id: "avatarItemLists",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						storageKeys: {
							main: [AVATAR_ITEM_LISTS_STORAGE_KEY],
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "myAvatarHashNav",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "avatarUnlockedAccessoryLimits",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "3dThumbnailDynamicLighting",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "hexBodyColors",
						variant: 2,
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "advancedAvatarCustomization",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "improvedAvatarBodySection",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
		],
	},
	{
		id: "navigation",
		subsections: [
			{
				id: "topNavigation",
				features: [
					{
						type: "Regular",
						id: "removeNotificationAdvertisements",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "topNavigationCustomization",
						component: {
							type: "Placeholder",
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "topNavigationCustomization.charts",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: "show",
											},
											{
												value: "hide",
											},
										],
										defaultValue: "show",
										toggleDefaultValue: false,
									},
									subfeatures: {
										showAsList: true,
										items: [
											{
												type: "Regular",
												id: "topNavigationCustomization.charts.text",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
											{
												type: "Regular",
												id: "topNavigationCustomization.charts.link",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
										],
									},
								},
								{
									type: "Regular",
									id: "topNavigationCustomization.marketplace",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: "show",
											},
											{
												value: "hide",
											},
										],
										defaultValue: "show",
										toggleDefaultValue: false,
									},
									subfeatures: {
										showAsList: true,
										items: [
											{
												type: "Regular",
												id: "topNavigationCustomization.marketplace.text",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
											{
												type: "Regular",
												id: "topNavigationCustomization.marketplace.link",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
										],
									},
								},
								{
									type: "Regular",
									id: "topNavigationCustomization.create",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: "show",
											},
											{
												value: "hide",
											},
										],
										defaultValue: "show",
										toggleDefaultValue: false,
									},
									subfeatures: {
										showAsList: true,
										items: [
											{
												type: "Regular",
												id: "topNavigationCustomization.create.text",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
											{
												type: "Regular",
												id: "topNavigationCustomization.create.link",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
										],
									},
								},
								{
									type: "Regular",
									id: "topNavigationCustomization.robux",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: "show",
											},
											{
												value: "hide",
											},
										],
										defaultValue: "show",
										toggleDefaultValue: false,
									},
									subfeatures: {
										showAsList: true,
										items: [
											{
												type: "Regular",
												id: "topNavigationCustomization.robux.text",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
											{
												type: "Regular",
												id: "topNavigationCustomization.robux.link",
												component: {
													type: "InputWithToggle",
													toggleDefaultValue: false,
												},
											},
										],
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "customRobuxPrecision",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "customRobuxPrecision.decimalPoints",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: 1,
											},
											{
												value: 2,
											},
											{
												value: 3,
											},
										],
										defaultValue: 1,
										toggleDefaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "customRobuxPrecision.abbreviateAfter",
									component: {
										type: "DropdownWithToggle",
										values: [
											{
												value: 100_000,
											},
											{
												value: 1_000_000,
											},
											{
												value: 10_000_000,
											},
											{
												value: 100_000_000,
											},
											{
												value: 1_000_000_000,
											},
											{
												value: Number.MAX_SAFE_INTEGER,
											},
										],
										defaultValue: 100_000,
										toggleDefaultValue: false,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "robuxNavigationDevExCurrencyAmount",
						component: {
							type: "DropdownWithToggle",
							values: devexDropdownValues,
							defaultValue: "USD",
							toggleDefaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "disableSearchLandingNav",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "fastUserSearchNav",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "changeVoiceOptInNavbar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						deprecated: true,
					},
					{
						type: "Regular",
						id: "changeAvatarChatOptInNavbar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "changeJoinPrivacyNavbar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "changeOnlineStatusPrivacyNavbar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "premiumStatusNavbar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "slashToSearch",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "creatorDashboardNav",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "pendingRobuxNav",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "hideWalletInNav",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "rosealSettingsInDropdown",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "leftNavigation",
				features: [
					{
						type: "Regular",
						id: "favoritesNav",
						component: {
							type: "DropdownWithToggle",
							defaultValue: "accessories/face",
							toggleDefaultValue: true,
							values: favoriteItemCategories,
						},
					},
					{
						type: "Regular",
						id: "changeInventoryNav",
						component: {
							type: "DropdownWithToggle",
							defaultValue: "accessories/face",
							toggleDefaultValue: false,
							values: inventoryItemCategories,
						},
					},
					{
						type: "Regular",
						id: "changeFriendsNav",
						component: {
							type: "DropdownWithToggle",
							values: (
								[
									"friends",
									"trusted-friends",
									"following",
									"followers",
									"friend-requests",
								] as const
							).map((item) => ({
								value: item,
							})),
							toggleDefaultValue: false,
							defaultValue: "friend-requests",
						},
					},
					{
						type: "Regular",
						id: "changeMessagesNav",
						component: {
							type: "DropdownWithToggle",
							values: ["inbox", "sent", "notifications", "archive"].map((item) => ({
								value: item,
							})),
							toggleDefaultValue: false,
							defaultValue: "inbox",
						},
					},
					{
						type: "Regular",
						id: "openDesktopAppNav",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "hideFriendsNotificationsCount",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "showcaseExperienceEventsNav",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "hideMessagesNotificationsCount",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
				],
			},
		],
	},
	{
		id: "account",
		subsections: [
			{
				id: "transactions",
				features: [
					{
						type: "Regular",
						id: "betterPrivateServersSubscriptions",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "transactionsHideFreeItemsToggle",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "transactionsHidePrivateServersToggle",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "robuxHistoryChart",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						storageKeys: {
							main: [ROBUX_HISTORY_STORAGE_KEY],
						},
					},
					{
						type: "Regular",
						id: "communityTransactionsPageSize",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "transactionsDevExRate",
						component: {
							type: "DropdownWithToggle",
							values: devexDropdownValues,
							toggleDefaultValue: false,
							defaultValue: "USD",
						},
					},
					{
						type: "Regular",
						id: "myTransactionsHashNav",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "myTransactionsHashNav.persistTransactionsSelection",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
									storageKeys: {
										localStorage: [
											PERSIST_TRANSACTIONS_SELECTION_LOCALSTORAGE_KEY,
										],
									},
								},
							],
						},
					},
				],
			},
			{
				id: "misc",
				features: [
					{
						type: "Regular",
						id: "inExperienceBadgeVisibilityToggle",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					/*
					disabled due to constraints
					{
						type: "Regular",
						id: SYNC_ROSEAL_SETTINGS_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},*/
					{
						type: "Beta",
						id: ACCOUNT_TRACKING_PREVENTION_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						permissions: {
							optional: {
								permissions: ["cookies"],
							},
						},
						storageKeys: {
							main: [ACCOUNT_TRACKING_PREVENTION_STORAGE_KEY],
						},
					},
					{
						type: "Regular",
						id: ACCOUNTS_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									id: ACCOUNTS_DISCOVERY_FEATURE_ID,
									type: "Regular",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									id: ACCOUNTS_SHOW_AUTHENTICATED_USER_PILL_FEATURE_ID,
									type: "Regular",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
									hasCSS: true,
								},
								{
									id: ACCOUNTS_UPDATE_TABS_FEATURE_ID,
									type: "Regular",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									id: ACCOUNTS_BIGGER_GAP_FEATURE_ID,
									type: "Regular",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
									hasCSS: true,
								},
								{
									id: ACCOUNTS_SHOW_AGE_BRACKET_FEATURE_ID,
									type: "Regular",
									component: {
										type: "DropdownWithToggle",
										toggleDefaultValue: true,
										defaultValue: "regular",
										values: [
											{
												value: "regular",
											},
											{
												value: "expanded",
											},
										],
									},
								},
							],
						},
						permissions: {
							required: {
								permissions: ["cookies"],
							},
						},
						storageKeys: {
							main: [UNENCRYPTED_ACCOUNTS_STORAGE_KEY],
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "betterNotificationPreferences",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "showVoiceChatSuspension",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "showExperienceChatUsernameColor",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
		],
	},
	{
		id: "notifications",
		subsections: [
			{
				id: "general",
				features: [
					{
						type: "Regular",
						id: STARTUP_NOTIFICATIONS_FEATURE_ID,
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: "onVisit",
								},
								{
									value: "onOpen",
								},
							],
							defaultValue: "onVisit",
							toggleDefaultValue: false,
						},
						permissions: {
							required: {
								permissions: ["notifications"],
							},
						},
					},
					{
						type: "Regular",
						id: TRADING_NOTIFICATIONS_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						permissions: {
							required: {
								permissions: ["notifications"],
							},
						},
						storageKeys: {
							main: [TRADING_NOTIFICATIONS_STORAGE_KEY],
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						permissions: {
							required: {
								permissions: ["notifications"],
							},
						},
						storageKeys: {
							main: [FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY],
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								{
									type: "Regular",
									id: FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: COMMUNITY_SHOUT_NOTIFICATIONS_FEATURE_ID,
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						permissions: {
							required: {
								permissions: ["notifications"],
							},
						},
						storageKeys: {
							main: [COMMUNITY_SHOUT_NOTIFICATIONS_STORAGE_KEY],
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
					},
				],
			},
		],
	},
	{
		id: "misc",
		subsections: [
			{
				id: "general",
				features: [
					{
						type: "Regular",
						id: "customEmojis",
						component: {
							type: "DropdownWithToggle",
							defaultValue: "twemoji",
							values: [
								{
									value: "twemoji",
								},
								{
									value: "fluentuiFlat",
								},
								{
									value: "fluentuiColor",
								},
							],
							toggleDefaultValue: true,
						},
						variant: 1,
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "copyShareLinks",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "disableDesktopAppBanner",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Experimental",
						id: "prefetchRobloxPageData",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "clearRobloxCacheAutomatically",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "fixRobloxKingmakerAccountSwitching",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "trendingSearchesPage",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "formatItemMentions",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "chatSorts",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "blockedItems",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						storageKeys: {
							main: [BLOCKED_ITEMS_STORAGE_KEY, ALLOWED_ITEMS_STORAGE_KEY],
						},
					},
					{
						type: "Regular",
						id: "moveReportAbuse",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "times",
						component: {
							type: "Placeholder",
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "times.switchCreatedUpdated",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
								{
									type: "Regular",
									id: "times.clickSwitch",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
								...timesFeatures,
							],
						},
					},
					{
						type: "Regular",
						id: "scaredPlayButton",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
				],
			},
			{
				id: "fixes",
				features: [
					{
						type: "Regular",
						id: "cssFixes",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "profileFetchFixes",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
				],
			},
			{
				id: "rendering",
				features: [
					{
						type: "Regular",
						id: "userAvatarHeadshotOverride",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: "AvatarBust",
								},
								{
									value: "Avatar",
								},
							],
							toggleDefaultValue: false,
							defaultValue: "AvatarBust",
						},
					},
					{
						type: "Regular",
						id: "imageResolutionOverride",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: "lowest",
								},
								{
									value: "low",
								},
								{
									value: "high",
								},
								{
									value: "highest",
								},
								{
									value: "native",
								},
							],
							defaultValue: "high",
							toggleDefaultValue: false,
						},
						hasCSS: true,
					},
					{
						type: "Regular",
						id: "disableFontResizing",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						hasCSS: true,
					},
				],
			},
			{
				id: "animals",
				features: [
					{
						type: "Regular",
						id: "animalImages",
						component: {
							type: "DropdownWithToggle",
							values: (["seal", "kitty"] as const).map((item) => ({
								value: item,
							})),
							defaultValue: "seal",
							toggleDefaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "animalText",
						component: {
							type: "DropdownWithToggle",
							values: (["seal", "kitty"] as const).map((item) => ({
								value: item,
							})),
							defaultValue: "seal",
							toggleDefaultValue: false,
						},
					},
				],
			},
		],
	},
	{
		id: "dev",
		subsections: [
			{
				id: "experiences",
				features: [
					{
						type: "Regular",
						id: "experiencesUniverseRedirect",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "fixExperienceDeeplinks",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "fixExperienceDeeplinks.useMainPage",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
					{
						type: "Regular",
						id: "viewUniverseId",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewPlaceLatestVersions",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "launcherDisableEmptyChannelName",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
				],
			},
			{
				id: "items",
				features: [
					{
						type: "Regular",
						id: "viewAvatarAssetOwners",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "viewAvatarAssetDependencies",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewItemProductInfo",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "viewItemMedia",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "viewItemMedia.intlMedia",
									component: {
										type: "Toggle",
										defaultValue: true,
									},
								},
							],
						},
					},
				],
			},
			{
				id: "misc",
				features: [
					{
						type: "Regular",
						id: "userProfileDownload3DAvatar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "previewFilteredTextWidget",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "getUnreadR2EButton",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "switchThemeNavbar",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "robloxSessionMetadata",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "errorPageMachineId",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "customErrorPageImage",
						component: {
							type: "DropdownWithToggle",
							values: [
								{
									value: "bunny",
								},
								{
									value: "buildermanSleeping",
								},
							],
							defaultValue: "bunny",
							toggleDefaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "showGroupAgentId",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
					},
					{
						type: "Regular",
						id: "sealsPages",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "referencePages",
						component: {
							type: "Toggle",
							defaultValue: true,
						},
					},
					{
						type: "Regular",
						id: "overrideRobloxExperiments",
						component: {
							type: "Toggle",
							defaultValue: false,
						},
						storageKeys: {
							main: [EXPERIMENTS_DISCOVERED_STORAGE_KEY],
						},
						subfeatures: {
							items: [
								{
									type: "Regular",
									id: "overrideRobloxExperiments.discoverExperiments",
									component: {
										type: "Toggle",
										defaultValue: false,
									},
								},
							],
						},
					},
				],
			},
		],
	},
] as const satisfies Section[];

const features = {} as FeaturesIntoRecord<typeof sections>;

export type AnyFeature = (typeof features)[keyof typeof features];

function handleFeature(feature: Feature) {
	// @ts-expect-error: Blehhh
	features[feature.id] = feature;

	if (feature.subfeatures) {
		for (const subfeature of feature.subfeatures.items) {
			(subfeature as Feature)._isSubOf = feature;
			handleFeature(subfeature);
		}
	}
}

for (const section of sections) {
	for (const subsection of section.subsections) {
		for (const feature of subsection.features) {
			handleFeature(feature);
		}
	}
}

export { features };

/*
FOR ROSEAL WEBSITE
const featureSections: {
	id: string;
	name: string;
	features: {
		type: "Regular" | "Beta" | "Experimental";
		id: string;
		name: string;
		description?: string;
	}[];
}[] = [];

for (const section of sections) {
	for (const subsection of section.subsections) {
		featureSections.push({
			id: subsection.id,
			name: `${getMessage(`featureSections.${section.id}.title`)} | ${getMessage(`featureSections.${section.id}.${subsection.id}.title`)}`,
			features: subsection.features.map((feature) => {
				const descriptionKey = `features.${feature.id}.description`;
				return {
					type: feature.type,
					name: getMessage(`features.${feature.id}.name`),
					description: hasMessage(descriptionKey)
						? getMessage(descriptionKey)
						: undefined,
				};
			}),
		});
	}
}

console.log(featureSections);*/
