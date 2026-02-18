import type { PlatformType } from "scripts/build/constants";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getOrSetCache, getOrSetCaches } from "../../cache";
import { httpClient } from "../main";
import type { Agent } from "./assets";
import type { AvatarScales } from "./avatar";
import type { SortOrder } from "./badges";
import type { HTTPRequestCredentials } from "@roseal/http-client";

export type MultigetUniversesPlayabilityStatusesRequest = {
	overridePlatformType?: PlatformType;
	overrideCache?: boolean;
	universeIds: number[];
};

export type PlayabilityReason =
	| "UnplayableOtherReason"
	| "Playable"
	| "GuestProhibited"
	| "GameUnapproved"
	| "IncorrectConfiguration"
	| "UniverseRootPlaceIsPrivate"
	| "InsufficientPermissionFriendsOnly"
	| "InsufficientPermissionGroupOnly"
	| "DeviceRestricted"
	| "UnderReview"
	| "PurchaseRequired"
	| "AccountRestricted"
	| "TemporarilyUnavailable"
	| "PlaceHasNoPublishedVersion"
	| "ComplianceBlocked"
	| "ContextualPlayabilityRegionalAvailability"
	| "ContextualPlayabilityRegionalCompliance"
	| "ContextualPlayabilityAgeRecommendationParentalControls"
	| "ContextualPlayabilityAgeGated"
	| "ContextualPlayabilityUnverifiedSeventeenPlusUser"
	| "FiatPurchaseRequired"
	| "FiatPurchaseDeviceRestricted"
	| "ContextualPlayabilityUnrated"
	| "ContextualPlayabilityAgeGatedByDescriptor"
	| "ContextualPlayabilityGeneral"
	| "ContextualPlayabilityExperienceBlockedParentalControls";

export type UniversePlayabilityStatus = {
	playabilityStatus: PlayabilityReason;
	isPlayable: boolean;
	universeId: number;
	unplayableDisplayText?: string;
};

export type OmniPageType = "Home";
export type OmniTreatmentType =
	| "SortlessGrid"
	| "Carousel"
	| "FriendCarousel"
	| "InterestGrid"
	| "AvatarCarousel"
	| "sdui"
	| "InterestGrid"
	| "SongCarousel"
	| "HeroUnit";
export type OmniContentType = "Game" | "User";
export type OmniUniversePrimaryMediaAsset = {
	// Remove?
	wideImageAssetid?: string | null;
	wideImageAssetId?: string | null;
	wideImageListId?: string | null;
};

export type OmniUniverseLayoutData = {
	primaryMediaAsset?: OmniUniversePrimaryMediaAsset;
	wideImageAssetId?: string;
	wideImageListId?: string;
};

export type OmniUniverse = {
	ageRecommendationDisplayName: string;
	description: string | null;
	friendVisitedString: string | null;
	friendVisits: number[] | null;
	minimumAge: number;
	name: string;
	playerCount: number;
	primaryMediaAsset: OmniUniversePrimaryMediaAsset | null;
	rootPlaceId: number;
	totalDownVotes: number;
	totalUpVotes: number;
	under9: boolean;
	under13: boolean;
	universeId: number;
	layoutDataBySort: Record<string, OmniUniverseLayoutData>;
};

export type OmniContentMetadata = {
	Game: Record<string, OmniUniverse>;
	CatalogAsset: Record<string, unknown>;
	CatalogBundle: Record<string, unknown>;
	GameCoPlay: Record<string, unknown>;
	RecommendedFriend: Record<string, unknown>;
};
export type OmniItemMetadata = {
	Score?: string;
	EncryptedAdTrackingData?: string;
	PrimaryWideImageListLastServedTimestamp?: string;
};
export type OmniItem = {
	contentType: OmniContentType;
	contentId: number;
	contentStringId?: string;
	contentMetadata?: OmniItemMetadata;
};
export type OmniComponentType =
	| "AppGameTileNoMetadata"
	| "GridTile"
	| "EventTile"
	| "InterestTile"
	| "ExperienceEventsTile";
export type OmniPlayerCountStyle = "Always" | "Hover" | "Footer";
export type OmniPlayButtonStyle = "Disabled" | "Enabled";
export type OmniHoverStyle = "imageOverlay";

export type OmniLayoutData = {
	layout?: string | null;
	isSponsoredFooterAllowed?: "false" | "true";
	navigationRootPlaceId?: number;
	infoText?: string;
	hideSeeAll?: "true" | "false";
	subtitle?: string;
	componentType?: OmniComponentType;
	playerCountStyle?: OmniPlayerCountStyle;
	playButtonStyle?: OmniPlayButtonStyle;
	hoverStyle?: OmniHoverStyle;
	linkPath?: string;
	endTimestamp?: string;
	countdownString?: string;
	backgroundImageAssetId?: string;
	enableExplicitFeedback?: "false" | "true";
	hideTileMetadata?: "false" | "true";
};
export type OmniSort = {
	nextPageTokenForTopic: string | null;
	numberOfRows?: number;
	recommendationList?: OmniItem[];
	topic?: string | null;
	subtitle?: string;
	topicId: number | string;
	topicLayoutData?: OmniLayoutData;
	treatmentType: OmniTreatmentType;
	feedItemKey?: string;
};

export type GetOmniRecommendationsResponse = {
	contentMetadata: OmniContentMetadata;
	contentMetadataByStringId: unknown;
	globalLayoutData: Record<string, unknown>;
	isPartialFeed: boolean;
	isSessionExpired: boolean;
	nextPageToken: string | null;
	pageType: OmniPageType;
	requestId: string;
	sorts: OmniSort[];
	sortsRefreshInterval: number;
};

export type GetOmniRecommendationsRequest = {
	pageType: "Home";
	sessionId: string;
	supportedTreatmentTypes?: OmniTreatmentType[];
	sduiTreatmentTypes?: OmniTreatmentType[];
	inputUniverseIds?: {
		interestCatcher: string[];
	};
	cpuCores?: number;
	maxMemory?: number;
	maxResolution?: string;
	networkType?: string;
	authIntentData?: unknown;
	topicIds?: number[];
};

export type MultigetOmniRecommendationsMetadataRequest = {
	sessionId: string;
	contents: OmniItem[];
	overrideCache?: boolean;
};

export type MultigetOmniRecommendationsMetadataResponse = {
	contentMetadata: OmniContentMetadata;
};

export type GetUniverseIconRequest = {
	universeId: number;
};

export type GetUniverseIconResponse = {
	imageId: number | null;
};

export type GetUniverseMediaRequest = {
	universeId: number;
	fetchAllExperienceRelatedMedia?: boolean;
};

export type UniverseMedia = {
	assetTypeId: number;
	assetType: string;
	imageId: number | null;
	videoHash: string | null;
	videoTitle: string | null;
	approved: boolean;
	altText: string | null;
	wideVideoAssetId?: number;
	videoId?: string | null;
};

export type GetUniverseMediaResponse = {
	data: UniverseMedia[];
};

export type GetUniverseStartInfoRequest = {
	universeId: number;
};

export type UniverseAvatarAssetOverride = {
	assetID: number;
	assetTypeID: number;
	isPlayerChoice: boolean;
};

export type GetUniverseStartInfoResponse = {
	gameAvatarType: UniverseAvatarType;
	allowCustomAnimations: string;
	universeAvatarCollisionType: string;
	universeAvatarBodyType: string;
	jointPositioningType: string;
	message: string;
	universeAvatarMinScales: AvatarScales;
	universeAvatarMaxScales: AvatarScales;
	universeAvatarAssetOverrides: UniverseAvatarAssetOverride[];
	moderationStatus: string;
};

export type MultigetUniversesAgeRecommendationsRequest = {
	universeIds: number[];
};

export type AgeRecommendation = {
	displayName: string;
	minimumAge: number;
};

export type AgeRecommendationSummary = {
	ageRecommendation?: AgeRecommendation;
};

export type DescriptorDetails = {
	name: string;
	displayName: string;
	complianceApiSupported: boolean;
	iconUrl?: string;
};

export type DescriptorDimension = {
	dimensionName: string;
	dimensionValue: string;
};

export type DescriptorAgeRange = {
	minAgeInclusive: number;
	maxAgeInclusive: number;
};

export type DescriptorUsage = {
	name: string;
	followsComplianceApiNull: boolean;
	followsComplianceApiValue?: boolean;
	experienceDescriptor: DescriptorDetails;
	experienceDescriptorDimensionUsages: DescriptorDimension[];
	contains: boolean;
	ageRange?: DescriptorAgeRange;
	descriptorDisplayName: string;
	ageRangeDisplayName: string;
};

export type DescriptorUsages = {
	items: DescriptorUsage[];
};

export type UniverseAgeRecommendationDetails = {
	ageRecommendationSummary: AgeRecommendationSummary;
	experienceDescriptorUsages?: DescriptorUsages;
};

export type UniverseAgeRecommendationDetailsContainer = {
	ageRecommendationDetails: UniverseAgeRecommendationDetails;
	universeId: number;
};

export type MultigetUniversesAgeRecommendationsResponse = {
	ageRecommendationDetailsByUniverse: UniverseAgeRecommendationDetailsContainer[];
};

export type ListExperiencesSortContentRequest = {
	sessionId: string;
	sortId: string;
	pageToken?: string;
} & ExperienceSortsFilters;

export type ExperienceEventFilterBy = "upcoming";

export type ExperienceEventSortBy = "startUtc";

export type ListMyExperienceEventsRequest = {
	filterBy?: ExperienceEventFilterBy;
	sortBy?: ExperienceEventSortBy;
	sortOrder?: SortOrder;
	groupId?: number;
	fromUtc?: string;
};

export type ListExperienceEventsRequest = {
	universeId: number;
	startsAfter?: string;
	endsAfter?: string;
	endsBefore?: string;
	visibility?: ExperienceEventVisibility;
	reverse?: boolean;
	limit?: boolean;
	cursor?: string;
	includeCredentials?: boolean;
};

export type ExperienceEventTime = {
	startUtc: string;
	endUtc: string;
};

export type ExperienceEventHostType = "user" | "group";

export type ExperienceEventHost = {
	hostName: string;
	hasVerifiedBadge: boolean;
	hostType: ExperienceEventHostType;
	hostId: number;
};

export type ExperienceEventStatus = "active" | "unpublished" | "cancelled" | "moderated";

export type ExperienceEventRSVPStatus = "none" | "notGoing" | "maybeGoing" | "going";

export type ExperienceEventActivityType =
	| "contentUpdate"
	| "locationUpdate"
	| "systemUpdate"
	| "activity"
	| "newUpdate"
	| "challenge"
	| "itemDrop"
	| "newSeason"
	| "newLocation"
	| "newMap"
	| "moreLevels"
	| "newFeature"
	| "earlyAccess"
	| "expansion"
	| "festival"
	| "newContent";

export type ExperienceEventCategory = {
	category: ExperienceEventActivityType;
	rank: number;
};

export type ExperienceEventThumbnail = {
	mediaId: number;
	rank: number;
};

export type ExperienceEventVisibility = "public" | "private";

export type ExperienceEvent = {
	id: string;
	title: string;
	displayTitle: string | null;
	subtitle: string;
	displaySubtitle: string | null;
	description: string;
	displayDescription: string;
	eventTime: ExperienceEventTime;
	host: ExperienceEventHost;
	universeId: number;
	placeId: number;
	eventStatus: ExperienceEventStatus;
	eventVisibility: ExperienceEventVisibility;
	createdUtc: string;
	updatedUtc: string;
	eventCategories: ExperienceEventCategory[];
	thumbnails: ExperienceEventThumbnail[] | null;
	allThumbnailsCreated: boolean;
	userRsvpStatus: ExperienceEventRSVPStatus;
};
export type ListExperienceEventsResponse = {
	nextPageCursor: string;
	previousPageCursor: string;
	data: ExperienceEvent[];
};

export type ExperienceSortsFilters = {
	device?: string;
	country?: string;
	age?: string;

	cpuCores?: number;
	maxMemory?: number;
	maxResolution?: string;
	networkType?: string;
};

export type ListExperienceSortsRequest = {
	sessionId: string;
	sortsPageToken?: string;
} & ExperienceSortsFilters;

export type ListedExperience = {
	universeId: number;
	rootPlaceId: number;
	name: string;
	playerCount: number;
	totalUpVotes: number;
	totalDownVotes: number;
	isSponsored: boolean;
	nativeAdData: string;
	minimumAge: number;
	ageRecommendationDisplayName: string;
};

export type ExperienceSort = {
	gameSetTypeId: number;
	gameSetTargetId?: number;
	primarySortId: number;
	secondarySortId?: number;
	sortId: string;
	appliedFilters?: string;
	sortDisplayName: string;
	games: ListedExperience[];
	subtitle?: string;
	nextPageToken?: string;
	contentType?: "Games";
	treatmentType?: OmniTreatmentType;
	topicLayoutData?: OmniLayoutData;
};

export type ExperienceSortFilterTreatmentType = "Pills";

export type ExperienceSortFilter = {
	contentType: "Filters";
	gameSetTypeId: number;
	gameSetTargetId: number;
	primarySortId: number;
	secondarySortId: number;
	sortId: string;
	sortDisplayName: string;
	topicLayoutData?: OmniLayoutData;
	treatmentType: ExperienceSortFilterTreatmentType;
	filters: {
		filterId: string;
		filterType: string;
		filterDisplayName: string;
		filterOptions: {
			optionId: string;
			optionDisplayName: string;
		}[];
		selectedOptionId?: string;
		filterLayoutData: Record<string, unknown>;
	}[];
};

export type ListExperienceSortsResponse = {
	sorts: (ExperienceSort | ExperienceSortFilter)[];
	nextSortsPageToken?: string;
};

export type MultigetUniversesByIdsRequest = {
	universeIds: number[];
	overrideCache?: boolean;
};

export type MultigetDevelopUniversesByIdsRequest = {
	ids: number[];
};

export type DevelopUniversePrivacyType = "Public" | "Private";

export type DevelopUniverse = {
	id: number;
	name: string;
	description: string | null;
	isArchived: boolean;
	rootPlaceId: number;
	isActive: boolean;
	privacyType: DevelopUniversePrivacyType;
	creatorType: Agent;
	creatorTargetId: number;
	creatorName: string;
	created: string;
	updated: string;
};

export type MultigetDevelopUniversesByIdsResponse = {
	data: DevelopUniverse[];
};

export type UniverseCreator = {
	id: number;
	name: string;
	type: Agent;
	isRNVAccount?: number;
	hasVerifiedBadge: boolean;
};

export type UniverseAvatarType = "MorphToR6" | "PlayerChoice" | "MorphToR15";

export type UniverseFIATRefundPolicy = {
	policyText?: string;
	learnMoreBaseUrl?: string;
	locale?: string;
	articleId?: string;
};

export type UniverseDetail = {
	id: number;
	rootPlaceId: number;
	name: string;
	description: string;
	sourceName: string;
	sourceDescription: string;
	creator: UniverseCreator;
	price: number;
	allowedGearGenres: string[];
	allowedGearCategories: string[];
	isGenreEnforced: boolean;
	copyingAllowed: boolean;
	playing: number;
	visits: number;
	maxPlayers: number;
	created: string;
	updated: string;
	studioAccessToApisAllowed: boolean;
	createVipServersAllowed: boolean;
	universeAvatarType: UniverseAvatarType;
	genre: string;
	isAllGenre: boolean;
	isFavoritedByUser: boolean;
	genre_l1?: string;
	genre_l2?: string;
	untranslated_genre_l1?: string;
	favoritedCount: number;
	licenseDescription?: string;
	refundLink?: string;
	localizedFiatPrice?: string;
	refundPolicy?: UniverseFIATRefundPolicy;
};

export type MultigetUniversesByIdsResponse = {
	data: UniverseDetail[];
};

export type ListAgentUniversesRequest = {
	agentType: Agent;
	agentId: number;
	sortOrder?: SortOrder;
	limit?: number;
	cursor?: string;
	accessFilter?: "Public" | "Private" | "All";
};

export type AgentUniverseCreator = {
	id: number;
	type: Agent;
};

export type AgentUniverseRootPlace = {
	id: number;
	type: "Place";
};

export type ListedAgentUniverse = {
	id: number;
	name: string;
	description: string;
	creator: AgentUniverseCreator;
	rootPlace: AgentUniverseRootPlace;
	created: string;
	updated: string;
	placeVisits: number;
};

export type ListAgentUniversesResponse = {
	data: ListedAgentUniverse[];
	nextPageCursor?: string | null;
	previousPageCursor?: string | null;
};

export type GetOpenCloudUniverseRequest = {
	credentials: HTTPRequestCredentials;
	universeId: number;
};

export type OpenCloudUniverseVisibility = "PUBLIC" | "PRIVATE" | "VISIBILITY_UNSPECIFIED";

export type OpenCloudUniverseSocialLink = {
	title: string;
	uri: string;
};

export type OpenCloudUniverseAgeRating =
	| "AGE_RATING_UNSPECIFIED"
	| "AGE_RATING_ALL"
	| "AGE_RATING_9_PLUS"
	| "AGE_RATING_13_PLUS"
	| "AGE_RATING_17_PLUS";

export type OpenCloudUniverse = {
	path: string;
	createTime: string;
	updateTime: string;
	displayName: string;
	description: string;
	group?: string;
	user?: string;
	visibility: OpenCloudUniverseVisibility;
	twitterSocialLink?: OpenCloudUniverseSocialLink;
	youtubeSocialLink?: OpenCloudUniverseSocialLink;
	discordSocialLink?: OpenCloudUniverseSocialLink;
	facebookSocialLink?: OpenCloudUniverseSocialLink;
	twitchSocialLink?: OpenCloudUniverseSocialLink;
	robloxGroupSocialLink?: OpenCloudUniverseSocialLink;
	guildedSocialLink?: OpenCloudUniverseSocialLink;
	voiceChatEnabled: boolean;
	ageRating: OpenCloudUniverseAgeRating;
	privateServerPriceRobux?: number;
	desktopEnabled: boolean;
	mobileEnabled: boolean;
	tabletEnabled: boolean;
	consoleEnabled: boolean;
	vrEnabled: boolean;
};

export type ExperienceNotificationPreferences = {
	groupName: string;
	localizedGroupName: string;
	groupIcon: string;
	notificationTypePreferences: null;
	localizedGroupDescription: string;
	notificationsEnabledExperiences: number[];
	notificationsEnabledGroups: null;
	restrictedAccess: boolean;
};

export type GetExperienceNotificationPreferencesResponse = {
	experiencePreferences: ExperienceNotificationPreferences[];
};

export type ListUniversePlacesRequest = {
	universeId: number;
	sortOrder?: SortOrder;
	limit?: number;
	cursor?: string;
	extendedSettings?: boolean;
};

export type UniversePlaceSocialSlotType = "Empty" | "Automatic" | "Custom";

export type UniversePlace = {
	maxPlayerCount: number | null;
	socialSlotType: UniversePlaceSocialSlotType | null;
	customSocialSlotsCount: number | null;
	allowCopying: boolean | null;
	currentSavedVersion: number | null;
	isAllGenresAllowed: boolean | null;
	allowedGearTypes: string[] | null;
	maxPlayersAllowed: number | null;
	id: number;
	universeId: number;
	name: string;
	description: string;
	isRootPlace: boolean;
};

export type ListUniversePlacesResponse = {
	data: UniversePlace[];
	nextPageCursor?: string | null;
	previousPageCursor?: string | null;
};

export type GetExperienceDetailedGuidelinesRequest = {
	universeId: number;
};

export type ExperienceRestrictedCountry = {
	countryCode: string;
	experienceDescriptorUsages: DescriptorUsage[];
};

export type DetailedGuidelinesModeration = {
	moderationStatus: string;
	creatorUsages: DescriptorUsages;
	moderatorUsages: DescriptorUsages;
	moderatorReasoning: unknown[];
};

export type GetExperienceDetailedGuidelinesResponse = {
	ageRecommendationDetails: UniverseAgeRecommendationDetails;
	restrictedCountries: ExperienceRestrictedCountry[];
	contentLanguage: string;
	moderation: DetailedGuidelinesModeration;
};

export type ExperienceMonetizationType = "DevProduct" | "GamePass" | "AvatarCommission";

export type QueryAnalyticsPagination = {
	pageSize: number;
	paginationToken?: string;
};

export type ExperienceTopMonetizationItem = {
	name: string;
	targetIdString: string;
	targetId: number;
	productId: number;
	targetType: null;
	price: number;
	salesCount: number;
	revenue: number;
	isOnSale: boolean;
};

export type QueryExperienceTopItemsResponse = {
	values: ExperienceTopMonetizationItem[];
	total: number;
	nextPaginationToken?: string | null;
};

export type QueryExperienceTopItemsRequest = {
	universeId: number;
	monetizationDetailType: ExperienceMonetizationType;
	startTime: string;
	endTime: string;
	pagination: QueryAnalyticsPagination;
};

export type GetExperienceEventByIdRequest = {
	eventId: string;
};

export type ListUniverseActiveSubscriptionsRequest = {
	subscriptionProductType: 1;
	subscriptionProviderId: number;
};

export type SubscriptionProductInfo = {
	name: string;
	description: string;
	iconImageAssetId: number | null;
	subscriptionPeriod: string;
	priceTier: number;
	displayPrice: string;
	subscriptionProviderName: string;
	subscriptionProviderId: string;
	isForSale: boolean;
	subscriptionTargetId: string;
};

export type ListUniverseActiveSubscriptionsResponse = {
	subscriptionProductsInfo: SubscriptionProductInfo[];
};

export type ShutdownExperienceServerRequestResponse = {
	placeId: number;
	gameId: string;
	privateServerId?: number;
};

export type ConfigurableUniverseAgent = Agent | "Team";

export type SearchConfigurableUniversesRequest = {
	search?: string;
	creatorType: ConfigurableUniverseAgent;
	creatorTargetId: number;
	isArchived?: boolean;
	isPublic?: boolean;
	isTeamCreateEnabled?: boolean;
	pageIndex?: number;
	pageSize?: number;
	sortParam?: "GameCreated" | "GameName" | "LastUpdated";
	sortOrder?: SortOrder;
};

export type ConfigurableUniversePrivacyType = "Public" | "Private";

export type ConfigurableUniverse = {
	id: number;
	name: string;
	description: string | null;
	isArchived: boolean;
	rootPlaceId: number;
	privacyType: ConfigurableUniversePrivacyType;
	creatorType: ConfigurableUniverseAgent;
	creatorTargetId: number;
	creatorName: string;
	created: string;
	updated: string;
};

export type SearchConfigurableUniversesResponse = {
	data: ConfigurableUniverse[];
	totalResults: number;
	totalHits: number;
	nextResultIndex: number | null;
};

export type GetExperienceEventRSVPCountersRequest = {
	eventId: string;
};

export type EventRSVPCounters = {
	going: number;
	maybeGoing: number;
	notGoing: number;
};

export type GetExperienceEventRSVPCountersResponse = {
	counters: EventRSVPCounters;
};

export type GetOpenCloudUniversePlaceRequest = {
	credentials: HTTPRequestCredentials;
	universeId: number;
	placeId: number;
};

export type OpenCloudPlace = {
	path: string;
	createTime: string;
	updateTime: string;
	displayName: string;
	description: string;
	serverSize: number;
};

export type ListExperienceTopSongsRequest = {
	universeId: number;
	limit: number;
	pageToken?: string;
};

export type ListedExperienceSong = {
	assetId: number;
	album: string;
	artist: string;
	duration: number;
	title: string;
	albumArtAssetId: number;
};

export type ListExperienceTopSongsResponse = {
	songs?: ListedExperienceSong[];
	nextPageToken?: string;
};

export type SDUIConditionalPropSet = {
	propOverrides: Record<string, unknown>;
	conditions: Record<string, unknown>;
};

export type SDUIComponent<
	ComponentTypeName extends string,
	Props extends Record<string, unknown> | never = never,
	FeedItem = never,
	TemplateKey extends string | undefined = undefined,
	ConditionalProps extends Record<string, unknown> | never = never,
	AnalyticsData extends Record<string, unknown> | never = never,
> = {
	componentType: ComponentTypeName;
	templateKey: TemplateKey;
	props: Props;
	conditionalProps?: ConditionalProps[];
	analyticsData?: AnalyticsData;
	feedItems?: FeedItem[];
};

export type GetUniverseAgeRecommendationsRequest = {
	universeId: number;
};

export type GetUniverseAgeRecommendationsResponse = unknown;

export async function getGroupShoutPreferences() {
	return (
		await httpClient.httpRequest<GetExperienceNotificationPreferencesResponse>({
			url: getRobloxUrl("notifications", "/v2/notifications/experience-preferences"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function multigetUniversesPlayabilityStatuses({
	overridePlatformType,
	overrideCache,
	...request
}: MultigetUniversesPlayabilityStatusesRequest): Promise<UniversePlayabilityStatus[]> {
	return getOrSetCaches({
		baseKey: ["universes", "playability-statuses"],
		keys: request.universeIds.map((universeId) => ({
			id: `${universeId}/${overridePlatformType ?? ""}`,
			universeId,
		})),
		fn: (request) =>
			httpClient
				.httpRequest<UniversePlayabilityStatus[]>({
					url: getRobloxUrl("games", "/v1/games/multiget-playability-status"),
					search: {
						universeIds: request.map((key) => key.universeId),
					},
					credentials: {
						type: "cookies",
						value: true,
					},
					overridePlatformType,
				})
				.then((data) => {
					const items: Record<string, UniversePlayabilityStatus> = {};
					for (const item of data.body) {
						items[`${item.universeId}/${overridePlatformType ?? ""}`] = item;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 10,
	});
}

export async function getOmniRecommendations(
	request: GetOmniRecommendationsRequest,
): Promise<GetOmniRecommendationsResponse> {
	return (
		await httpClient.httpRequest<GetOmniRecommendationsResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/discovery-api/omni-recommendation"),
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

export async function multigetOmniRecommendationsMetadata({
	overrideCache,
	...request
}: MultigetOmniRecommendationsMetadataRequest) {
	return getOrSetCaches({
		baseKey: ["universes", "omni-metadata"],
		keys: request.contents.map((content) => ({
			id: content.contentId,
			contentType: content.contentType,
		})),
		fn: (data) =>
			httpClient
				.httpRequest<MultigetOmniRecommendationsMetadataResponse>({
					method: "POST",
					url: getRobloxUrl("apis", "/discovery-api/omni-recommendation-metadata"),
					body: {
						type: "json",
						value: {
							...request,
							contents: data.map((content) => ({
								contentId: content.id,
								contentType: content.contentType,
							})),
						},
					},
					credentials: {
						type: "cookies",
						value: true,
					},
					errorHandling: "BEDEV2",
				})
				.then((data) => data.body.contentMetadata.Game),
		overrideCache,
		batchLimit: 50,
	});
}

export async function getUniverseMedia({ universeId, ...request }: GetUniverseMediaRequest) {
	return (
		await httpClient.httpRequest<GetUniverseMediaResponse>({
			url: `${getRobloxUrl("games")}/v2/games/${universeId}/media`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getUniverseStartInfo(request: GetUniverseStartInfoRequest) {
	return (
		await httpClient.httpRequest<GetUniverseStartInfoResponse>({
			url: getRobloxUrl("avatar", "/v1/game-start-info"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function multigetUniversesAgeRecommendations(
	request: MultigetUniversesAgeRecommendationsRequest,
) {
	return (
		await httpClient.httpRequest<MultigetUniversesAgeRecommendationsResponse>({
			method: "POST",
			url: getRobloxUrl(
				"apis",
				"/experience-guidelines-service/v1beta1/multi-age-recommendation",
			),
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getUniverseAgeRecommendations(request: GetUniverseAgeRecommendationsRequest) {
	return (
		await httpClient.httpRequest<GetUniverseAgeRecommendationsResponse>({
			method: "POST",
			url: getRobloxUrl(
				"apis",
				"/experience-guidelines-api/experience-guidelines/get-age-recommendation",
			),
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getExperienceDetailedGuidelines(
	request: GetExperienceDetailedGuidelinesRequest,
) {
	return getOrSetCache({
		key: ["universes", request.universeId, "detailedGuidelines"],
		fn: async () =>
			await httpClient
				.httpRequest<GetExperienceDetailedGuidelinesResponse>({
					method: "POST",
					url: getRobloxUrl(
						"apis",
						"/experience-guidelines-service/v1beta1/detailed-guidelines",
					),
					body: {
						type: "json",
						value: request,
					},
					errorHandling: "BEDEV2",
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => res.body),
	});
}

export async function listExperienceSorts(request: ListExperienceSortsRequest) {
	return (
		await httpClient.httpRequest<ListExperienceSortsResponse>({
			url: getRobloxUrl("apis", "/explore-api/v1/get-sorts"),
			search: request,
			errorHandling: "BEDEV2",
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function listExperiencesSortContent(request: ListExperiencesSortContentRequest) {
	return (
		await httpClient.httpRequest<ExperienceSort>({
			url: getRobloxUrl("apis", "/explore-api/v1/get-sort-content"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listExperienceEvents({
	universeId,
	includeCredentials = true,
	...request
}: ListExperienceEventsRequest) {
	return (
		await httpClient.httpRequest<ListExperienceEventsResponse>({
			url: `${getRobloxUrl("apis")}/virtual-events/v2/universes/${universeId}/experience-events`,
			search: request,
			credentials: {
				type: "cookies",
				value: includeCredentials,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listMyExperienceEvents(request: ListMyExperienceEventsRequest) {
	return (
		await httpClient.httpRequest<ListExperienceEventsResponse>({
			url: getRobloxUrl("apis", "/virtual-events/v1/virtual-events/my-events"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getExperienceEventById(request: GetExperienceEventByIdRequest) {
	return (
		await httpClient.httpRequest<ExperienceEvent>({
			url: `${getRobloxUrl("apis")}/virtual-events/v1/virtual-events/${request.eventId}`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function shutdownExperienceServer(request: ShutdownExperienceServerRequestResponse) {
	await httpClient.httpRequest<ShutdownExperienceServerRequestResponse>({
		method: "POST",
		url: getRobloxUrl("apis", "/matchmaking-api/v1/game-instances/shutdown"),
		body: {
			type: "json",
			value: request,
		},
		credentials: {
			type: "cookies",
			value: true,
		},
		errorHandling: "BEDEV2",
		expect: "none",
	});
}

export function multigetUniversesByIds({
	overrideCache,
	universeIds,
}: MultigetUniversesByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["universes", "details"],
		keys: universeIds.map((id) => ({
			id,
		})),
		fn: (universeIds) =>
			httpClient
				.httpRequest<MultigetUniversesByIdsResponse>({
					url: getRobloxUrl("games", "/v1/games"),
					search: {
						universeIds: universeIds.map((id) => id.id),
					},
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => {
					const items: Record<string, UniverseDetail> = {};
					for (const game of res.body.data) {
						items[game.id] = game;
					}

					return items;
				}),
		overrideCache,
		batchLimit: 10,
	});
}

export async function listAgentUniverses({
	agentType,
	agentId,
	...request
}: ListAgentUniversesRequest) {
	return (
		await httpClient.httpRequest<ListAgentUniversesResponse>({
			url: `${getRobloxUrl("games")}/v2/${agentType.toLowerCase()}s/${agentId}/games`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function getOpenCloudUniverse({
	credentials,
	universeId,
}: GetOpenCloudUniverseRequest) {
	return (
		await httpClient.httpRequest<OpenCloudUniverse>({
			url: `${getRobloxUrl("apis")}/cloud/v2/universes/${universeId}`,
			credentials,
		})
	).body;
}

export async function getOpenCloudUniversePlace({
	credentials,
	universeId,
	placeId,
}: GetOpenCloudUniversePlaceRequest) {
	return (
		await httpClient.httpRequest<OpenCloudPlace>({
			url: `${getRobloxUrl("apis")}/cloud/v2/universes/${universeId}/places/${placeId}`,
			credentials,
		})
	).body;
}

export function multigetDevelopUniversesByIds({ ids }: MultigetDevelopUniversesByIdsRequest) {
	return getOrSetCaches({
		baseKey: ["universes", "developDetails"],
		keys: ids.map((id) => ({
			id,
		})),
		fn: (universeIds) => {
			const search = new URLSearchParams();
			for (const id of universeIds) {
				search.append("ids", id.id.toString());
			}

			return httpClient
				.httpRequest<MultigetDevelopUniversesByIdsResponse>({
					url: getRobloxUrl("develop", "/v1/universes/multiget"),
					search: search,
					credentials: {
						type: "cookies",
						value: true,
					},
				})
				.then((res) => {
					const items: Record<string, DevelopUniverse> = {};
					for (const game of res.body.data) {
						items[game.id] = game;
					}

					return items;
				});
		},
		batchLimit: 50,
	});
}

export async function listUniversePlaces({ universeId, ...request }: ListUniversePlacesRequest) {
	return (
		await httpClient.httpRequest<ListUniversePlacesResponse>({
			url: `${getRobloxUrl("develop")}/v2/universes/${universeId}/places`,
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function queryExperienceTopItems({
	universeId,
	...request
}: QueryExperienceTopItemsRequest) {
	return (
		await httpClient.httpRequest<QueryExperienceTopItemsResponse>({
			method: "POST",
			url: `${getRobloxUrl("apis")}/developer-analytics-aggregations/v1/details/monetization/topitems/universes/${universeId}`,
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

export async function listUniverseActiveSubscriptions(
	request: ListUniverseActiveSubscriptionsRequest,
) {
	return (
		await httpClient.httpRequest<ListUniverseActiveSubscriptionsResponse>({
			url: getRobloxUrl("apis", "/v1/subscriptions/active-subscription-products"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function searchConfigurableUniverses(request: SearchConfigurableUniversesRequest) {
	return (
		await httpClient.httpRequest<SearchConfigurableUniversesResponse>({
			url: getRobloxUrl("apis", "/universes/v1/search"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getExperienceEventRSVPCounters({
	eventId,
}: GetExperienceEventRSVPCountersRequest) {
	return (
		await httpClient.httpRequest<GetExperienceEventRSVPCountersResponse>({
			url: `${getRobloxUrl("apis")}/virtual-events/v1/virtual-events/${eventId}/rsvps/counters`,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function listExperienceTopSongs(request: ListExperienceTopSongsRequest) {
	return (
		await httpClient.httpRequest<ListExperienceTopSongsResponse>({
			url: getRobloxUrl("apis", "/music-discovery/v1/experience-songs"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}
