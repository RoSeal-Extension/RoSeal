import type { GeographiesProps } from "react-simple-maps";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getAvatarAssetLink } from "src/ts/utils/links";
import { httpClient } from "../main";
import type { MarketplaceItemType } from "./marketplace";
import type { OmniLayoutData, OmniTreatmentType, OmniUniverseLayoutData } from "./universes";

export type SearchPageType = "discover" | "home" | "all";

export type SearchVerticalType = "User" | "Game" | "Blended";

export type SearchRequest<T extends SearchVerticalType> = {
	searchQuery: string;
	sessionId: string;
	pageType: SearchPageType;
	retries?: number;
	genreId?: string;
	pageToken?: string;
	verticalType?: T;
};

export type SearchedExperience = {
	universeId: number;
	name: string;
	description: string;
	playerCount: number;
	totalUpVotes: number;
	totalDownVotes: number;
	emphasis: boolean;
	isSponsored: boolean;
	nativeAdData: string;
	creatorName: string;
	creatorHasVerifiedBadge: boolean;
	creatorId: number;
	rootPlaceId: number;
	minimumAge: number;
	ageRecommendationDisplayName?: string;
	contentType: "Game";
	contentId: number;
};

export type SearchedUser = {
	username: string;
	displayName: string;
	previousUsernames: string[] | null;
	contentType: "User";
	contentId: number;
};

export type SearchedGroup<T extends string, U> = {
	contentGroupType: T;
	contents: U[];
	topicId: string | null;
};

export type SearchResponse<T extends SearchVerticalType> = {
	searchResults: T extends "User"
		? SearchedGroup<"User", SearchedUser>[]
		: T extends "Blended"
			? (
					| SearchedGroup<"User" | "Game", SearchedUser>
					| SearchedGroup<"Game", SearchedExperience>
				)[]
			: SearchedGroup<"Game", SearchedExperience>[];
	nextPageToken: string;
	vertical: T;
	filteredSearchQuery: string | null;
};

export type GetAvatarItemPageDataRequest = {
	assetId?: number;
	name?: string;
};

export type SuccessResponse = {
	success: boolean;
};

type InternalFilterTextResponse = {
	filteredGameUpdateText: string;
	isFiltered: boolean;
	moderationLevel: 1 | 2 | 3; // 1 = None, 2 = Partial, 3 = Full
};

export type FilterTextResponse = {
	filteredText: string;
	isFiltered: boolean;
	moderationLevel: 1 | 2 | 3; // 1 = None, 2 = Partial, 3 = Full
};

export type FilterTextRequest = {
	text: string;
};

export type GetSearchLandingPageRequest = {
	sessionId: string;
};

export type SearchLandingPageSortExperience = {
	universeId: number;
	rootPlaceId: number;
	name: string;
	playerCount: number;
	totalUpVotes: number;
	totalDownVotes: number;
	ageRecommendationDisplayName: string;
	minimumAge?: number;
	itemLayoutData: OmniUniverseLayoutData;
};

export type SearchLandingPageSort = {
	contentType: "Game";
	sortId: string;
	sortDisplayName: string;
	topicLayoutData: OmniLayoutData;
	treatmentType: OmniTreatmentType;
	nextPageToken: string;
	games: SearchLandingPageSortExperience[];
	feedItemKey?: string;
};

export type GetSearchLandingPageResponse = {
	sorts: SearchLandingPageSort[];
	nextSortsPageToken: string;
	globalLayoutData: OmniLayoutData;
};

export type ProfileComponentType =
	| "UserProfileHeader"
	| "Actions"
	| "About"
	| "Store"
	| "SocialLinks"
	| "CurrentlyWearing"
	| "ViewFullProfile"
	| "ContentPosts"
	| "ContactDescription"
	| "ContactProfileHeader"
	| "CommunityProfileHeader"
	| "Experiences"
	| "FavoriteExperiences"
	| "Inventory"
	| "QuickLinks"
	| "Friends"
	| "Collections"
	| "Communities"
	| "RobloxBadges"
	| "PlayerBadges"
	| "Statistics"
	| "CreationsModels"
	| "Clothing"
	| "ProfileBackground";
export type ProfileComponentsProfileType = "User" | "Contact" | "Community";

export type ProfileComponent = {
	component: ProfileComponentType;
};

export type GetProfileComponentsDataRequest = {
	profileType: ProfileComponentsProfileType;
	profileId: string;
	components: ProfileComponent[];
	includeComponentOrdering?: boolean;
	includeCredentials?: boolean;
};

export type UserProfileHeaderProfileComponent = {
	userId: number;
	isPremium: boolean;
	isVerified: boolean;
	isRobloxAdmin: boolean;
	counts: {
		friendsCount: number;
		followersCount: number;
		followingsCount: number;
		mutualFriendsCount: number;
		isFriendsCountEnabled: boolean;
		isFollowersCountEnabled: boolean;
		isFollowingsCountEnabled: boolean;
		isMutualFriendsCountEnabled: boolean;
	} | null;
	names: {
		primaryName: string;
		username: string;
	};
	contextualInformation: {
		context:
			| "None"
			| "AccountDeleted"
			| "Presence"
			| "FollowsYou"
			| "YouAreFollowing"
			| "MutualFriends"
			| "PlayedTogether";
	};
	editName: {
		field: "Alias" | "DisplayName";
		value: string | null;
		isEdited: boolean;
	} | null;
};

export type AboutProfileComponent = {
	description: string;
	socialLinks: SocialLinksProfileComponent | null;
	nameHistory: string[] | null;
	joinDateTime?: string;
};

export type SocialLinkComponent = {
	url: string;
	target: string;
	title: string | null;
};

export type SocialLinksProfileComponent = {
	facebook: SocialLinkComponent | null;
	twitter: SocialLinkComponent | null;
	youtube: SocialLinkComponent | null;
	twitch: SocialLinkComponent | null;
	guilded: SocialLinkComponent | null;
	discord: SocialLinkComponent | null;
};

export type ViewFullProfileProfileComponent = {
	userId: number;
	type: "Profile";
};

export type ProfileComponentItem = {
	assetId: number;
	itemType: MarketplaceItemType;
};

export type CurrentlyWearingProfileComponent = {
	assets: ProfileComponentItem[];
};

export type ProfileComponentAction =
	| "EditProfile"
	| "Unfriend"
	| "AcceptFriendRequest"
	| "AcceptOffNetworkFriendRequest"
	| "AddFriend"
	| "AddFriendFromContacts"
	| "AddFriendFromContactsSent"
	| "Block"
	| "QrCode"
	| "CannotAddFriend"
	| "Chat"
	| "EditAlias"
	| "IgnoreFriendRequest"
	| "JoinExperience"
	| "PendingFriendRequest"
	| "Report"
	| "Unblock"
	| "CopyLink"
	| "JoinCommunity"
	| "CancelJoinCommunityRequest"
	| "ViewCommunity"
	| "LeaveCommunity"
	| "MakePrimaryCommunity"
	| "RemovePrimaryCommunity";

export type ProfileComponentButton = {
	type: string;
	disabledReason: string | null;
};

export type ActionsProfileComponent = {
	primary: ProfileComponentAction;
	secondary: ProfileComponentAction[] | null;
	contextual: ProfileComponentAction[] | null;
	buttons: ProfileComponentButton[];
};

export type ContentPostsProfileComponentContentPost = {
	postId: string;
	thumbnailId: string;
};

export type ContentPostsProfileComponent = {
	contentPosts: ContentPostsProfileComponentContentPost[];
	previousCursor: string | null;
	nextCursor: string | null;
};

export type StoreProfileComponent = {
	name: string | null;
	assets: ProfileComponentItem[];
};

export type ContactProfileHeaderProfileComponent = {
	contactName: string;
};

export type CommunityProfileHeaderProfileComponent = {
	name: string;
	isVerified: boolean;
	ownerName: string;
	ownerIsVerified: boolean;
	counts: {
		membersCount: number;
	} | null;
	roleName: string | null;
	hasSocialModules: boolean;
};

export type ProfileComponentExperience = {
	universeId: number;
};

export type ExperiencesProfileComponent = {
	experiences: ProfileComponentExperience[];
	previousCursor?: string | null;
	nextCursor?: string | null;
};

export type CommunityTabsComponent = {
	tabs: string[];
};

export type CommunitySearchComponent = {
	discoveryType: "Community";
};

export type CommunityCoverPhotoComponent = {
	coverPhotoId: number | null;
};

export type FriendsProfileComponentFriendPresence = {
	userId: number;
	isOnline: boolean;
	presenceType: string;
	placeId: number | null;
	universeId: number | null;
	gameId: string | null;
	lastLocation: string;
	lastOnlineTime?: {
		seconds: number;
		nanos: number;
	} | null;
	locationType: string;
};

export type FriendsProfileComponent = {
	friends: number[];
};

export type CommunitiesProfileComponent = {
	groupsIds: number[];
};

export type RobloxBadgesProfileComponentBadge = {
	id: number;
	type: {
		id: number;
		value: string;
		description: string;
		imageName: string;
	};
	userId: number;
	createdTime?: {
		seconds: number;
		nanos: number;
	};
};

export type RobloxBadgesProfileComponent = {
	robloxBadgeList: RobloxBadgesProfileComponentBadge[];
};

export type RobloxStatisticsProfileComponent = {
	userJoinedDate: string;
	numberOfVisits: number;
};

export type FavoriteExperiencesProfileComponent = {
	experiences: ProfileComponentExperience[];
};

export type ProfileBackgroundProfileComponent = {
	assetId?: number;
};

export type CollectionsProfileComponent = {
	assets: ProfileComponentItem[];
};

export type CreationsModelsProfileComponent = {
	assets: ProfileComponentItem[];
};

export type PlayerBadgesProfileComponent = {
	badges: number[];
};

export type GetProfileComponentsDataResponse = {
	profileType: ProfileComponentsProfileType;
	profileId: string;
	componentOrdering: ProfileComponentType[];
	components: {
		UserProfileHeader?: UserProfileHeaderProfileComponent;
		About?: AboutProfileComponent;
		SocialLinks?: SocialLinksProfileComponent;
		ViewFullProfile?: ViewFullProfileProfileComponent;
		CurrentlyWearing?: CurrentlyWearingProfileComponent;
		Actions?: ActionsProfileComponent;
		ContentPosts?: ContentPostsProfileComponent;
		Store?: StoreProfileComponent;
		ContactProfileHeader?: ContactProfileHeaderProfileComponent;
		ContactDescription?: ContactProfileHeaderProfileComponent;
		CommunityProfileHeader?: CommunityProfileHeaderProfileComponent;
		Experiences?: ExperiencesProfileComponent;
		FavoriteExperiences?: FavoriteExperiencesProfileComponent;
		Inventory?: CurrentlyWearingProfileComponent;
		CommunityTabs?: CommunityTabsComponent;
		CommunitySearch?: CommunitySearchComponent;
		Announcements?: unknown;
		Shout?: unknown;
		Events?: unknown;
		ForumsDiscovery?: unknown;
		Members?: unknown;
		CoverPhoto?: CommunityCoverPhotoComponent;
		Friends?: FriendsProfileComponent;
		Communities?: CommunitiesProfileComponent;
		RobloxBadges?: RobloxBadgesProfileComponent;
		PlayerBadges?: PlayerBadgesProfileComponent;
		Collections?: CollectionsProfileComponent;
		Statistics?: RobloxStatisticsProfileComponent;
		CreationsModels?: CreationsModelsProfileComponent;
		Clothing?: unknown;
		ProfileBackground?: ProfileBackgroundProfileComponent;
	};
	onlyEssentialComponents: boolean;
};
export type ListExperienceSearchSuggestionsRequest = {
	type: 0;
	language: string;
	cursor?: number;
};

export type ExperienceSearchSuggestionPrefix = {
	prefix: string;
	position: number;
};

export type ExperienceSearchSuggestionItem = {
	searchQuery: string;
	type: 1;
	universeId: number;
	canonicalTitle: string | null;
	matchedPrefixes: ExperienceSearchSuggestionPrefix[];
};

export type ListExperienceSearchSuggestionsResponse = {
	algorithName: string;
	pageNumber: number;
	hasNextPage: boolean;
	entries: ExperienceSearchSuggestionItem[];
};

export type RobloxSupportedLocaleLanguage = {
	id: number;
	name: string;
	nativeName: string;
	languageCode: string;
	isRightToLeft: boolean;
};

export type RobloxSupportedLocaleItem = {
	id: number;
	locale: string;
	name: string;
	nativeName: string;
	language: RobloxSupportedLocaleLanguage;
};

export type ListRobloxSupportedLocalesResponse = {
	supportedLocales: RobloxSupportedLocaleItem[];
};

export type MarketplaceAutocompleteSuggestionInternalArgs = {
	Prefix: string;
	Limit: number;
	Algo: string | null;
};

export type MarketplaceAutocompleteSuggestionInternalEntry = {
	Query: string;
	Score: number;
	Meta: null;
};

export type ListMarketplaceAutocompleteSuggestionsInternalResponse = {
	Args: MarketplaceAutocompleteSuggestionInternalArgs;
	Data: MarketplaceAutocompleteSuggestionInternalEntry[];
};

export type ExperiencesAutocompleteSuggestion = {
	type: number;
	score: number;
	universeId: number;
	canonicalTitle: string | null;
	thumbnailUrl: string | null;
	searchQuery: string | null;
	trendingSearchStartDateTime: string | null;
};

export type ListExperiencesAutocompleteSuggestionsResponse = {
	prefix: string;
	algorithmName: string;
	entries: ExperiencesAutocompleteSuggestion[];
};

export type ListExperienceRecommendationsResponse = {
	games: UniverseRecommendationDetail[];
	nextPaginationKey?: string | null;
};

export type UniverseRecommendationDetail = {
	creatorId: number;
	creatorName: string;
	creatorType: string;
	creatorHasVerifiedBadge: true;
	totalUpVotes: number;
	totalDownVotes: number;
	universeId: number;
	name: string;
	placeId: number;
	playerCount: number;
	imageToken: string;
	isSponsored: boolean;
	nativeAdData: string;
	isShowSponsoredLabel: boolean;
	price: number | null;
	analyticsIdentifier: null;
	gameDescription: string;
	genre: string;
	minimumAge: number;
	ageRecommendationDisplayName: string;
};

export type QueryAnalyticsResourceType = "RESOURCE_TYPE_GROUP" | "RESOURCE_TYPE_CREATOR";
export type QueryAnalyticsGranularityType =
	| "METRIC_GRANULARITY_DEFAULT_GRANULARITY"
	| "METRIC_GRANULARITY_ONE_MINUTE"
	| "METRIC_GRANULARITY_ONE_HOUR"
	| "METRIC_GRANULARITY_ONE_DAY"
	| "METRIC_GRANULARITY_ONE_WEEK"
	| "METRIC_GRANULARITY_NONE"
	| "METRIC_GRANULARITY_HALF_HOUR"
	| "METRIC_GRANULARITY_ONE_MONTH";

export type QueryAnalyticsMetric =
	| "ItemTotalTransactionCount"
	| "ItemTotalCreatorEarning"
	| "ItemTotalRobuxSpent"
	| "ItemLifetimeCreatorEarning"
	| "ItemLifetimeRebateAmount"
	| "ItemLifetimeRobuxSpent"
	| "ItemLifetimeTransactionCount"
	| "ItemPublishAdvance"
	| "ItemPublishAdvanceRecoupedPercentage";

export type QueryAnalyticsBreakdownDimension = "AgeGroup";

export type QueryAnalyticsBreakdown = {
	dimensions: QueryAnalyticsBreakdownDimension[];
};

export type QueryAnalyticsFilterDimension = "AvatarItemId" | "AvatarItemTargetType";

export type QueryAnalyticsFilter = {
	dimension: QueryAnalyticsFilterDimension;
	values: string[];
};

export type QueryAnalyticsQuery = {
	metric: QueryAnalyticsMetric;
	granularity: QueryAnalyticsGranularityType;
	breakdown: QueryAnalyticsBreakdown[];
	filter: QueryAnalyticsFilter[];
	startTime: string;
	endTime: string;
	limit?: number;
};

export type QueryCreatorAnalyticsRequest = {
	resourceType: QueryAnalyticsResourceType;
	resourceId: string;
	query: QueryAnalyticsQuery;
};

export type CreatorAnalyticsOperationMetadata = {
	createdTime: string;
};

export type CreatorAnalyticsResultBreakdownValue = {
	dimension: string;
	value: string;
	displayValue: string;
};

export type CreatorAnalyticsResultDataPoint = {
	time: string;
	value: number;
	stringValues: string[];
	status: "DATA_STATUS_INVALID";
};

export type CreatorAnalyticsResult = {
	breakdownValue: CreatorAnalyticsResultBreakdownValue[];
	dataPoints: CreatorAnalyticsResultDataPoint[];
};

export type CreatorAnalyticsOperationQueryResult = {
	values: CreatorAnalyticsResult[];
};

export type CreatorAnalyticsOperation = {
	path: string;
	metadata: CreatorAnalyticsOperationMetadata;
	done: boolean;
	queryResult?: CreatorAnalyticsOperationQueryResult;
	error?: unknown;
};

export type QueryCreatorAnalyticsResponse = {
	operation: CreatorAnalyticsOperation;
};

export type USDCurrencyConversions = {
	date: string;
	usd: Record<string, number>;
};

export async function getUserProfileDocument(): Promise<Document> {
	return (
		await httpClient.httpRequest<Document>({
			url: getRobloxUrl("www", "/users/1/profile"),
			credentials: {
				type: "cookies",
				value: true,
			},
			expect: "dom",
		})
	).body;
}

export async function getHomePageDocument(): Promise<Document> {
	return (
		await httpClient.httpRequest<Document>({
			url: getRobloxUrl("www", "/home"),
			credentials: {
				type: "cookies",
				value: true,
			},
			expect: "dom",
		})
	).body;
}

export async function search<T extends SearchVerticalType>(
	request: SearchRequest<T>,
): Promise<SearchResponse<T>> {
	return (
		await httpClient.httpRequest<SearchResponse<T>>({
			url: getRobloxUrl("apis", "/search-api/omni-search"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getSearchLandingPage(request: GetSearchLandingPageRequest) {
	return (
		await httpClient.httpRequest<GetSearchLandingPageResponse>({
			url: getRobloxUrl("apis", "/search-api/search-landing-page"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
			overridePlatformType: "Desktop",
			errorHandling: "BEDEV2",
		})
	).body;
}

export async function getAvatarItemPageData({
	assetId = 12434120493,
	name = "test",
}: GetAvatarItemPageDataRequest): Promise<Document> {
	return (
		await httpClient.httpRequest<Document>({
			url: getAvatarAssetLink(assetId, name),
			credentials: {
				type: "cookies",
				value: true,
			},
			expect: "dom",
		})
	).body;
}

export async function filterText({ text }: FilterTextRequest): Promise<FilterTextResponse> {
	const data = (
		await httpClient.httpRequest<InternalFilterTextResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/game-update-notifications/v1/filter"),
			body: {
				type: "json",
				value: text,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
	).body;

	return {
		filteredText: data.filteredGameUpdateText,
		isFiltered: data.isFiltered,
		moderationLevel: data.moderationLevel,
	};
}

export async function getProfileComponentsData({
	includeCredentials = true,
	...request
}: GetProfileComponentsDataRequest) {
	return (
		await httpClient.httpRequest<GetProfileComponentsDataResponse>({
			method: "POST",
			url: getRobloxUrl("apis", "/profile-platform-api/v1/profiles/get"),
			body: {
				type: "json",
				value: request,
			},
			credentials: {
				type: "cookies",
				value: includeCredentials,
			},
		})
	).body;
}

export async function getMapLakesWorldData() {
	return (
		await httpClient.httpRequest<GeographiesProps["geography"]>({
			url: import.meta.env.WORLD_MAPS_LAKES_DATA_URL,
			bypassCORS: true,
		})
	).body;
}

export async function getMapWorldData() {
	return (
		await httpClient.httpRequest<GeographiesProps["geography"]>({
			url: import.meta.env.WORLD_MAPS_DATA_URL,
			bypassCORS: true,
		})
	).body;
}

export async function listExperienceSearchSuggestions({
	type,
	...request
}: ListExperienceSearchSuggestionsRequest) {
	return (
		await httpClient.httpRequest<ListExperienceSearchSuggestionsResponse>({
			url: `${getRobloxUrl("apis")}/games-autocomplete/v1/request-local-cache/${type}`,
			search: request,
		})
	).body;
}

export async function listRobloxSupportedLocales() {
	return (
		await httpClient.httpRequest<ListRobloxSupportedLocalesResponse>({
			url: getRobloxUrl("locale", "/v1/locales/supported-locales"),
			credentials: {
				type: "cookies",
				value: true,
			},
		})
	).body;
}

export async function queryCreatorAnalytics(request: QueryCreatorAnalyticsRequest) {
	return (
		await httpClient.httpRequest<QueryCreatorAnalyticsResponse>({
			method: "POST",
			url: `${getRobloxUrl("apis")}/analytics-query-gateway/v1/metrics/resource/${request.resourceType}/id/${request.resourceId}`,
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

export async function getUSDCurrencyConversions() {
	return (
		await httpClient.httpRequest<USDCurrencyConversions>({
			url: import.meta.env.CURRENCY_CONVERSION_DATA_URL,
			bypassCORS: true,
		})
	).body;
}
