import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import type { Agent } from "./assets.ts";
import type { AnyItemType } from "./marketplace.ts";
import { httpClient, RESTError } from "../main.ts";

export type GetPublicRolesResponse = {
	roles: string[];
};

export type UserBirthdate = {
	birthMonth: number | null;
	birthDay: number | null;
	birthYear: number | null;
};
export type GetUser2SVConfigurationRequest = {
	userId: number;
	challengeId?: string;
	actionType?: string;
};

export type Media2SV = {
	mediaType: string;
	enabled: boolean;
	updated: string;
};

export type User2SVConfiguration = {
	primaryMediaType: string;
	methods: Media2SV[];
};

export type Generate2SVChallengeResponse = {
	challengeId: string;
	actionType: string;
};

export type UserVerifiedAge = {
	isVerified: boolean;
	verifiedAge: number;
	isSeventeenPlus: boolean;
};

export type PhoneNumberDiscoverability = "Unset" | "NotDiscoverable" | "Discoverable";

export type ContentAgeRestriction =
	| "AllAges"
	| "NinePlus"
	| "ThirteenPlus"
	| "SeventeenPlus"
	| "EighteenPlus";

export type ThemeType = "Light" | "Dark";

export type UserPrivacyLevel =
	| "AllUsers"
	| "AllAuthenticatedUsers"
	| "Friends"
	| "FriendsAndFollowing"
	| "FriendsFollowingAndFollowers"
	| "NoOne";

export type CommunicationPrivacyLevel =
	| "All"
	| "TopFriends"
	| "Friends"
	| "Following"
	| "Followers"
	| "NoOne";

export type PrivateServerPrivacyLevel =
	| "AllUsers"
	| "Friends"
	| "FriendsAndFollowing"
	| "FriendsFollowingAndFollowers"
	| "NoOne";

export type TradeQualityFilter = "None" | "Low" | "Medium" | "High";

export type XboxCrossPlaySetting = {
	userId: number;
	isEnabled: boolean;
	created: string;
	updated: string;
};

export type EnabledDisabled = "Enabled" | "Disabled";
export type YesNo = "Yes" | "No";

export type AEPEnrollmentStatus = "Unenrolled" | "KeyPlanEnrolled";

export type DNDTimeWindow = {
	startTimeMinutes: number;
	endTimeMinutes: number;
};

export type UserSettings = {
	phoneNumberDiscoverability: PhoneNumberDiscoverability;
	contentAgeRestriction: ContentAgeRestriction;
	privateServerJoinRestriction: PrivateServerPrivacyLevel;
	themeType: ThemeType;
	canUploadContacts: boolean | null;
	whoCanWhisperChatWithMeInExperiences: UserPrivacyLevel;
	whoCanGroupChatWithMeInApp: UserPrivacyLevel;
	whoCanChatWithMe: UserPrivacyLevel;
	whoCanChatWithMeInApp: UserPrivacyLevel;
	whoCanJoinMeInExperiences: CommunicationPrivacyLevel;
	voiceChatOptIn: boolean;
	whoCanSeeMyInventory: UserPrivacyLevel;
	whoCanTradeWithMe: CommunicationPrivacyLevel;
	tradeQualityFilter: TradeQualityFilter;
	xboxCrossPlaySetting: XboxCrossPlaySetting;
	privateServerInvitePrivacy: PrivateServerPrivacyLevel;
	boundAuthTokenValidation: EnabledDisabled;
	friendSuggestions: EnabledDisabled;
	updateFriendsAboutMyActivity: YesNo;
	allowSellShareData: EnabledDisabled;
	allowPersonalizedAdvertising: EnabledDisabled;
	dailyScreenTimeLimit: number | null;
	enablePurchases: EnabledDisabled;
	whoCanSeeMySocialNetworks: UserPrivacyLevel;
	whoCanSeeMyOnlineStatus?: DefaultPrivacy;
	allowAnnouncementsEmailNotifications?: EnabledDisabled;
	allowMarketingEmailNotifications?: EnabledDisabled;
	allowVoiceDataUsage?: EnabledDisabled;
	doNotDisturb?: EnabledDisabled;
	doNotDisturbTimeWindow?: DNDTimeWindow;
	eppEnrollmentStatus?: AEPEnrollmentStatus;
	allowSensitiveIssues?: EnabledDisabled;
	allowFacialAgeEstimation?: EnabledDisabled;
};

export type UpdateUserSettingsRequest = {
	phoneNumberDiscoverability?: PhoneNumberDiscoverability;
	privateServerJoinRestriction?: PrivateServerJoinRestriction;
	themeType?: ThemeType;
	canUploadContacts?: boolean;
	whoCanChatWithMe?: ChatPrivacy;
	whoCanChatWithMeInExperiences?: ChatPrivacy;
	whoCanWhisperChatWithMeInExperiences?: ChatPrivacy;
	whoCanChatWithMeInApp?: AppChatPrivacy;
	whoCanGroupChatWithMeInApp?: AppChatPrivacy;
	whoCanJoinMeInExperiences?: JoinPrivacy;
	voiceChatOptIn?: boolean;
	isOptedInThroughUpsell?: boolean;
	whoCanSeeMyInventory?: DefaultPrivacy;
	whoCanSeeMySocialNetworks?: DefaultPrivacy;
	whoCanTradeWithMe?: DefaultPrivacy;
	tradeQualityFilter?: TradeQualityFilter;
	xboxCrossPlayStatusIsEnabled?: boolean;
	privateServerInvitePrivacy?: PrivateServerInvitePrivacy;
	privateServerPrivacy?: PrivateServerAddPrivacy;
	boundAuthTokenValidation?: EnabledDisabled;
	updateFriendsAboutMyActivity?: YesNo;
	friendSuggestions?: EnabledDisabled;
	allowSellShareData?: EnabledDisabled;
	allowPersonalizedAdvertising?: EnabledDisabled;
	dailyScreenTimeLimit?: number;
	enablePurchases?: EnabledDisabled;
	whoCanOneOnOnePartyWithMe?: PartyPrivacy;
	whoCanGroupPartyWithMe?: PartyPrivacy;
	whoCanSeeMyOnlineStatus?: DefaultPrivacy;
	allowAnnouncementsEmailNotifications?: EnabledDisabled;
	allowMarketingEmailNotifications?: EnabledDisabled;
	allowVoiceDataUsage?: EnabledDisabled;
	doNotDisturb?: EnabledDisabled;
	doNotDisturbTimeWindow?: DNDTimeWindow;
	eppEnrollmentStatus?: AEPEnrollmentStatus;
	allowSensitiveIssues?: EnabledDisabled;
	allowFacialAgeEstimation?: EnabledDisabled;
};

export type GetCurrentAuthenticatedUserResponse = {
	ageBracket: 0 | 1;
	countryCode: string;
	isPremium: boolean;
	id: number;
	name: string;
	displayName: string;
};

export type TransactionAgent = {
	id: number;
	type: Agent;
	name: string;
};

export type TransactionPlace = {
	placeId: number;
	universeId: number;
	name: string;
};

export type TransactionCurrency = {
	amount: number;
	type: "Robux";
};

export type TransactionItemType = AnyItemType | "PrivateServer";

export type TransactionPurchaseDetails = {
	id: number;
	name: string;
	type: TransactionItemType;
	place?: TransactionPlace;
};

export type Transaction<T extends "Purchase" | "Sale" | string = string> = {
	id: number;
	idHash: string;
	transactionType: T;
	created: string;
	isPending: boolean;
	agent: TransactionAgent;
	details: T extends "Purchase"
		? TransactionPurchaseDetails
		: T extends "Sale"
			? TransactionPurchaseDetails
			: Record<string, unknown>;
	currency: TransactionCurrency;
	purchaseToken: null;
};

export type HydratedPlayerInfoData = {
	lastPerformed: string;
	userId: string;
	ageBracket: "Age18OrOver" | "AgeUnder13To17" | "Age9To12" | "AgeUnder9";
	gender: "Male" | "Female" | "Unknown";
	platform: string;
	os: string;
	isOriginalUser: boolean;
	originalAccountCreationTimestampMs: string;
};

export type HydratedPlayerInfo = {
	playerInfo: HydratedPlayerInfoData;
	signature: string;
};

export type PlayStationCrossPlaySetting = {
	userId: number;
	isEnabled: boolean;
};

export type UserPlayStationSettings = {
	palisadesCrossPlaySetting: PlayStationCrossPlaySetting;
};

export type AllowedDisallowed = "Allowed" | "Disallowed";
export type AppChatPrivacy = "NoOne" | "Friends";
export type ChatPrivacy = "NoOne" | "AllUsers";
export type DefaultPrivacy =
	| "NoOne"
	| "Friends"
	| "FriendsAndFollowing"
	| "FriendsFollowingAndFollowers"
	| "AllUsers";
export type JoinPrivacy = "All" | "Friends" | "NoOne" | "Following" | "Followers";
export type PartyPrivacy = "NoOne" | "Friends" | "Unknown";
export type PrivateServerAddPrivacy =
	| "NoOne"
	| "Friends"
	| "FriendsAndFollowing"
	| "FriendsFollowingAndFollowers"
	| "AllUsers"
	| "Default";
export type PrivateServerInvitePrivacy = "Friends";
export type PrivateServerJoinRestriction = "Friends";

export type UserSetting<T> = {
	currentValue: T | null;
	options: Array<UserSettingOptionContainer<T>>;
};

export type UserSettingOption<T> = { optionValue: T };

export type UserSettingOptionChangeRequirement =
	| "None"
	| "SelfUpdateSetting"
	| "Inherited"
	| "ContentAgeRestrictionVerification"
	| "ParentConsentInherited"
	| "ParentalConsent";

export type UserSettingOptionContainer<T> = {
	option: UserSettingOption<T>;
	requirement: UserSettingOptionChangeRequirement | null;
};

export type UserSettingsOptions = {
	contentAgeRestriction: UserSetting<ContentAgeRestriction>;
	privateServerJoinRestriction: UserSetting<PrivateServerJoinRestriction>;
	themeType: UserSetting<ThemeType>;
	phoneNumberDiscoverability: UserSetting<PhoneNumberDiscoverability>;
	boundAuthTokenValidation: UserSetting<EnabledDisabled>;
	friendSuggestions: UserSetting<EnabledDisabled>;
	whoCanJoinMeInExperiences: UserSetting<JoinPrivacy>;
	privateServerPrivacy: UserSetting<PrivateServerAddPrivacy>;
	privateServerInvitePrivacy: UserSetting<PrivateServerInvitePrivacy>;
	whoCanChatWithMeInExperiences: UserSetting<ChatPrivacy>;
	whoCanWhisperChatWithMeInExperiences: UserSetting<ChatPrivacy>;
	whoCanChatWithMeInApp: UserSetting<AppChatPrivacy>;
	whoCanGroupChatWithMeInApp: UserSetting<AppChatPrivacy>;
	updateFriendsAboutMyActivity: UserSetting<YesNo>;
	dailyScreenTimeLimit: UserSetting<number>;
	enablePurchases: UserSetting<EnabledDisabled>;
	whoCanSeeMySocialNetworks: UserSetting<DefaultPrivacy>;
	whoCanSeeMyInventory: UserSetting<DefaultPrivacy>;
	whoCanTradeWithMe: UserSetting<DefaultPrivacy>;
	tradeQualityFilter: UserSetting<TradeQualityFilter>;
	allowEnableGroupNotifications: UserSetting<AllowedDisallowed>;
	allowEnableEmailNotifications: UserSetting<AllowedDisallowed>;
	allowEnablePushNotifications: UserSetting<AllowedDisallowed>;
	allowEnableExperienceNotifications: UserSetting<AllowedDisallowed>;
	allowThirdPartyAppPermissions: UserSetting<EnabledDisabled>;
	whoCanOneOnOnePartyWithMe: UserSetting<PartyPrivacy>;
	whoCanGroupPartyWithMe: UserSetting<PartyPrivacy>;
	whoCanSeeMyOnlineStatus?: UserSetting<DefaultPrivacy>;
	allowAnnouncementsEmailNotifications: UserSetting<EnabledDisabled>;
	allowMarketingEmailNotifications: UserSetting<EnabledDisabled>;
	allowVoiceDataUsage: UserSetting<EnabledDisabled>;
	doNotDisturb: UserSetting<EnabledDisabled>;
	doNotDisturbTimeWindow: UserSetting<DNDTimeWindow>;
	eppEnrollmentStatus: UserSetting<AEPEnrollmentStatus>;
	allowSensitiveIssues: UserSetting<EnabledDisabled>;
};

export type UserTransactionType = "Purchase";
export type UserTransactionPricingType = "All" | "PaidAndLimited";

export type ListUserTransactionsRequest = {
	userId: number;
	transactionType: UserTransactionType;
	itemPricingType?: UserTransactionPricingType;
	cursor?: string;
	limit?: number;
};

export type UserTransactionAgent = {
	id: number;
	type: Agent;
	name: string;
};

export type UserTransactionCurrencyType = "Robux" | "Tickets";
export type UserTransactionCurrency = {
	amount: number;
	type: UserTransactionCurrencyType;
};

export type UserPurchasePlace = {
	placeId: number;
	universeId: number;
	name: string;
};

export type UserPurchaseTransactionType =
	| "DeveloperProduct"
	| "PrivateServer"
	| "Asset"
	| "GamePass";

export type UserTransactionDetails = {
	id?: number;
	name: string;
	type: UserPurchaseTransactionType;
	place?: UserPurchasePlace;
};

export type UserTransaction = {
	id: number;
	idHash: string;
	transactionType: UserTransactionType;
	created: string;
	isPending: boolean;
	agent: UserTransactionAgent;
	details: UserTransactionDetails;
	currency: UserTransactionCurrency;
	purchaseToken: string | null;
};

export type ListUserTransactionsResponse = {
	previousPageCursor: string | null;
	nextPageCursor: string | null;
	data: UserTransaction[];
};

export type UserRobuxAmount = {
	robux: number;
};

export type GetRobuxUpsellPackageRequest = {
	attemptRobuxAmount: number;
	upsellPlatform: "WEB";
	userRobuxBalance: number;
};

export type RobuxUpsellPackage = {
	robloxProductId: number;
	providerProductId: string;
	robloxProductName: string;
	robuxAmount: number;
	price: string;
	robuxAmountBeforeBonus?: number;
	isEligibleForVng: boolean;
	badgeType: unknown | null;
};

export type GetUserSubscriptionsDetailsRequest = {
	userId: number;
};

export type PremiumSubscriptionModel = {
	premiumFeatureId: number;
	subscriptionTypeName:
		| "RobloxPremium450"
		| "RobloxPremium1000"
		| "RobloxPremium2200"
		| "RobloxPremium450OneMonth"
		| "RobloxPremium1000OneMonth"
		| "RobloxPremium2200OneMonth"
		| "RobloxPremium100012Months"
		| "Unknown";
	robuxStipendAmount: number;
	isLifetime: boolean;
	expiration: string;
	renewal: string | null;
	renewedSince: string;
	created: string;
	purchasePlatform:
		| "nonrecurring"
		| "isDesktop"
		| "isAmazonApp"
		| "isIosApp"
		| "isUwpApp"
		| "isXboxApp"
		| "isAndroidApp"
		| "isUniversalApp";
	subscriptionName: string;
};

export type PremiumSubscriptionPrice = {
	amount: number;
	usdAmount: number;
	currency: PremiumSubscriptionPriceCurrency;
};

export type PremiumSubscriptionPriceCurrency = {
	id: number;
	currencyType: number;
	currencyCode: string;
	currencyName: string | null;
	currencySymbol: string;
};

export type PremiumSubscriptionDetails = {
	subscriptionProductModel: PremiumSubscriptionModel;
	price: PremiumSubscriptionPrice | null;
};

export type HeartbeatSessionInfo = {
	sessionId: string;
};

export type HeartbeatUniversalAppDetails = {
	activeState: number;
	pageName: string;
};

export type HeartbeatStudioDetails = {
	placeId: number;
};

export type HeartbeatWebsiteLocation = {
	url: string;
};

export type HeartbeatWebsiteDetails = {
	robloxWebsiteLocationInfo: HeartbeatWebsiteLocation;
};

export type HeartbeatLocationInfo =
	| { universalAppLocationInfo: HeartbeatUniversalAppDetails }
	| { studioLocationInfo: HeartbeatStudioDetails }
	| { locationInfo: HeartbeatWebsiteDetails };

export type HeartbeatPulseRequest = {
	clientSideTimestampEpochMs: number;
	locationInfo: HeartbeatLocationInfo;
	sessionInfo: HeartbeatSessionInfo;
};

export type TopWeeklyScreentimeByUniverse = {
	universeId: number;
	weeklyMinutes: number;
};

export type GetTopWeeklyScreentimeByUniverseResponse = {
	universeWeeklyScreentimes: TopWeeklyScreentimeByUniverse[];
};

export type OAuthResponseType = "Code";

export type OAuthScope = {
	scopeType: string;
	operations: string[];
};

export type OAuthResourceInfo = {
	owner: {
		id: string;
		type: "User";
	};
	resources: unknown;
};

export type AuthorizeRobloxOAuthRequest = {
	clientId: string;
	responseTypes: OAuthResponseType[];
	redirectUri: string;
	scopes: OAuthScope[];
	resourceInfos: OAuthResourceInfo[];
	codeChallengeMethod?: "S256";
	codeChallenge?: string;
	state?: string;
};

export type AuthorizeRobloxOAuthResponse = {
	location: string;
};

export type RedeemRobloxOAuthTokenRequest = {
	grantType: "authorization_code" | "refresh_token";
	code?: string;
	refreshToken?: string;
	codeVerifier?: string;
	clientId: string;
};

export type RedeemRobloxOAuthTokenResponse = {
	accessToken: string;
	refreshToken: string;
	tokenType: "Bearer";
	expiresIn: number;
	idToken: string;
	scope: string;
};

export type GetAPIKeyRequest = {
	apiKey: string;
};

export type APIKeyScope = {
	scopeType: string;
	targetParts: string[];
	operations: string[];
	allowAllOperations?: boolean;
};

export type APIKeyOwnerType = "OWNER_TYPE_USER" | "OWNER_TYPE_GROUP";

export type APIKeyUserProperties = {
	name: string;
	description: string;
	expirationTime?: string;
	isEnabled: boolean;
	allowedCidrs: string[];
	scopes: APIKeyScope[];
};

export type APIKeyInfo = {
	id: string;
	createdTime: string;
	updatedTime: string;
	cloudAuthUserConfiguredProperties: APIKeyUserProperties;
	ownerId: number;
	ownerType: APIKeyOwnerType;
	lastGeneratedUserId: number;
	lastGeneratedTime: string;
	apikeySecretPreview: string;
	lastAccessedTime: string;
	cloudAuthBadStatus: unknown[];
};

export type APIKey = {
	cloudAuthInfo: APIKeyInfo;
};

export type APIKeyWithSecret = APIKey & {
	apikeySecret: string;
};

export type CreateAPIKeyRequest = {
	cloudAuthUserConfiguredProperties: APIKeyUserProperties;
};

export type DeleteAPIKeyRequest = {
	cloudAuthId: string;
};

export type UpdateAPIKeyRequest = {
	cloudAuthId: string;
	cloudAuthUserConfiguredProperties: APIKeyUserProperties;
};

export type RegenerateAPIKeyRequest = {
	cloudAuthId: string;
};

export type ListedTestPilotProgramStatus = "PROGRAM_ACTIVE_STATUS_ALLOWLIST";

export type ListedTestPilotProgramVisibility = "PROGRAM_VISIBILITY_ACTIVE_AND_ALLOWLIST";

export type ListedTestPilotProgramPlatform =
	| "PROGRAM_PLATFORM_MAC_PLAYER"
	| "PROGRAM_PLATFORM_MAC_STUDIO"
	| "PROGRAM_PLATFORM_RCC"
	| "PROGRAM_PLATFORM_WINDOWS_PLAYER"
	| "PROGRAM_PLATFORM_WINDOWS_STUDIO"
	| "PROGRAM_PLATFORM_AMAZON_ANDROID_APP"
	| "PROGRAM_PLATFORM_GOOGLE_ANDROID_APP"
	| "PROGRAM_PLATFORM_TENCENT_ANDROID_APP"
	| "PROGRAM_PLATFORM_QUEST_ANDROID_APP"
	| "PROGRAM_PLATFORM_IOS_APP"
	| "PROGRAM_PLATFORM_PS4_APP"
	| "PROGRAM_PLATFORM_PS5_APP"
	| "PROGRAM_PLATFORM_XBOX_APP";

export type ListedTestPilotProgram = {
	id: string;
	displayName: string;
	description: string;
	testingInstructions: string;
	activeStatus: ListedTestPilotProgramStatus;
	visibility: ListedTestPilotProgramVisibility;
	channelName: string;
	platforms: ListedTestPilotProgramPlatform[];
};

export type ListTestPilotProgramsResponse = {
	betaPrograms: ListedTestPilotProgram[];
};

export type SelectedTestPilotProgram = {
	userId: number;
	programId: string;
};

export type GetSelectedTestPilotProgramResponse = {
	optIn?: SelectedTestPilotProgram;
};

export type UpdateSelectedTestPilotProgramRequest = {
	programId: string;
};

export type ListTransactionTotalsRequest = {
	userId: number;
	timeFrame: "Month" | "Week" | "Day" | "Year";
	transactionType: "summary" | "pendingRobux";
};

export type ListTransactionTotalsResponse = {
	salesTotal: number;
	purchasesTotal: number;
	affiliateSalesTotal: number;
	groupPayoutsTotal: number;
	currencyPurchasesTotal: number;
	premiumStipendsTotal: number;
	tradeSystemEarningsTotal: number;
	tradeSystemCostsTotal: number;
	premiumPayoutsTotal: number;
	groupPremiumPayoutsTotal: number;
	adSpendTotal: number;
	developerExchangeTotal: number;
	pendingRobuxTotal: number;
	incomingRobuxTotal: number;
	outgoingRobuxTotal: number;
	individualToGroupTotal: number;
	csAdjustmentTotal: number;
	adsRevsharePayoutsTotal: number;
	groupAdsRevsharePayoutsTotal: number;
	subscriptionsRevshareTotal: number;
	groupSubscriptionsRevshareTotal: number;
	subscriptionsRevshareOutgoingTotal: number;
	groupSubscriptionsRevshareOutgoingTotal: number;
	publishingAdvanceRebatesTotal: number;
};

export type DeveloperExchangeMetadata = {
	hasCurrencyOperationError: boolean;
	currencyOperationErrorMessage: string;
	showOnlyExchangeRates: boolean;
	emailIsVerified: boolean;
	isImbursementBlacklistUser: boolean;
	canProceedToCashout: boolean;
	showProgressBar: boolean;
	percentRobux: number;
	minRobuxToCashOut: boolean;
	maxRobuxCanCashOut: boolean;
	lastImbursementStatus: string | null;
	lastImbursementSubmissionDate: string | null;
	conversionPercent: number;
};

export type UserDevExableRobuxAmount = {
	eligibleRobux: number;
	updatedUtc: string;
};

export async function getCurrentAuthenticatedUser() {
	return (
		await httpClient.httpRequest<GetCurrentAuthenticatedUserResponse>({
			url: getRobloxUrl("users", "/v1/users/authenticated/app-launch-info"),
			includeCredentials: true,
		})
	).body;
}

export async function getPublicRoles() {
	return (
		await httpClient.httpRequest<GetPublicRolesResponse>({
			url: getRobloxUrl("users", "/v1/users/authenticated/roles"),
			includeCredentials: true,
		})
	).body;
}

export async function getBirthdate() {
	return (
		await httpClient.httpRequest<UserBirthdate>({
			url: getRobloxUrl("users", "/v1/birthdate"),
			includeCredentials: true,
		})
	).body;
}

export async function getVerifiedAge() {
	return (
		await httpClient.httpRequest<UserVerifiedAge>({
			url: getRobloxUrl("apis", "/age-verification-service/v1/age-verification/verified-age"),
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function logout() {
	await httpClient.httpRequest({
		method: "POST",
		url: getRobloxUrl("auth", "/v1/logout"),
		expect: "none",
		includeCredentials: true,
	});
}

export async function getUser2SVConfiguration({ userId, ...data }: GetUser2SVConfigurationRequest) {
	return (
		await httpClient.httpRequest<User2SVConfiguration>({
			url: `${getRobloxUrl("twostepverification")}/v1/users/${userId}/configuration`,
			search: data,
			includeCredentials: true,
		})
	).body;
}

export async function generate2SVChallenge(): Promise<Generate2SVChallengeResponse> {
	return {
		challengeId: (
			await httpClient.httpRequest<string>({
				method: "POST",
				url: getRobloxUrl("economy", "/v2/spend-friction/two-step-verification/generate"),
				includeCredentials: true,
			})
		).body,
		actionType: "RobuxSpend",
	};
}

export async function getUserSettings(): Promise<UserSettings> {
	return (
		await httpClient.httpRequest<UserSettings>({
			url: getRobloxUrl("apis", "/user-settings-api/v1/user-settings"),
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getUserSettingsAndOptions(): Promise<UserSettingsOptions> {
	return (
		await httpClient.httpRequest<UserSettingsOptions>({
			url: getRobloxUrl("apis", "/user-settings-api/v1/user-settings/settings-and-options"),
			includeCredentials: true,
		})
	).body;
}

export async function getUserHydratedPlayerInfo(): Promise<HydratedPlayerInfo> {
	return (
		await httpClient.httpRequest<HydratedPlayerInfo>({
			url: getRobloxUrl("apis", "/player-hydration-service/v1/players/signed"),
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getUserPlayStationSettings(): Promise<UserPlayStationSettings> {
	return (
		await httpClient.httpRequest<UserPlayStationSettings>({
			url: getRobloxUrl("apis", "/user-settings-api/v1/user-settings/platform"),
			includeCredentials: true,
		})
	).body;
}

export async function listUserTransactions({ userId, ...request }: ListUserTransactionsRequest) {
	return (
		await httpClient.httpRequest<ListUserTransactionsResponse>({
			url: `${getRobloxUrl("apis")}/transaction-records/v1/users/${userId}/transactions`,
			search: request,
			includeCredentials: true,
		})
	).body;
}

export async function listUserTransactionTotals({
	userId,
	...request
}: ListTransactionTotalsRequest) {
	return (
		await httpClient.httpRequest<ListTransactionTotalsResponse>({
			url: `${getRobloxUrl("apis")}/transaction-records/v1/users/${userId}/transaction-totals`,
			search: request,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function updateUserSettings(request: UpdateUserSettingsRequest) {
	await httpClient.httpRequest({
		url: `${getRobloxUrl("apis", "/user-settings-api/v1/user-settings")}`,
		method: "POST",
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		errorHandling: "BEDEV2",
		includeCredentials: true,
	});
}

export async function getUserRobuxAmount(): Promise<UserRobuxAmount> {
	return (
		await httpClient.httpRequest<UserRobuxAmount>({
			url: getRobloxUrl("economy", "/v1/user/currency"),
			includeCredentials: true,
		})
	).body;
}

export async function getRobuxUpsellPackage(
	request: GetRobuxUpsellPackageRequest,
): Promise<RobuxUpsellPackage> {
	return (
		await httpClient.httpRequest<RobuxUpsellPackage>({
			method: "POST",
			url: getRobloxUrl("apis", "/payments-gateway/v1/products/get-upsell-product"),
			body: {
				type: "json",
				value: {
					upsell_platform: request.upsellPlatform,
					attempt_robux_amount: request.attemptRobuxAmount,
					user_robux_balance: request.userRobuxBalance,
				},
			},
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

export async function getUserSubscriptionsDetails({ userId }: GetUserSubscriptionsDetailsRequest) {
	try {
		return (
			await httpClient.httpRequest<PremiumSubscriptionDetails>({
				url: `${getRobloxUrl("premiumfeatures")}/v1/users/${userId}/subscriptions/details`,
				includeCredentials: true,
			})
		).body;
	} catch (err: unknown) {
		if (err instanceof RESTError && err.isHttpError && err.httpCode === 404) return null;

		throw err;
	}
}

export async function userHeartbeatPulse(request: HeartbeatPulseRequest) {
	await httpClient.httpRequest({
		url: getRobloxUrl("apis", "/user-heartbeats-api/pulse"),
		method: "POST",
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		errorHandling: "BEDEV2",
		includeCredentials: true,
	});
}

export async function getTopWeeklyScreentimeByUniverse() {
	return (
		await httpClient.httpRequest<GetTopWeeklyScreentimeByUniverseResponse>({
			url: getRobloxUrl(
				"apis",
				"/parental-controls-api/v1/parental-controls/get-top-weekly-screentime-by-universe",
			),
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function authorizeRobloxOAuth(request: AuthorizeRobloxOAuthRequest) {
	return (
		await httpClient.httpRequest<AuthorizeRobloxOAuthResponse>({
			url: getRobloxUrl("apis", "/oauth/v1/authorizations"),
			method: "POST",
			body: {
				type: "json",
				value: request,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function redeemRobloxOAuthToken(request: RedeemRobloxOAuthTokenRequest) {
	const params = new URLSearchParams();
	params.set("grant_type", request.grantType);
	if (request.code) params.set("code", request.code);
	params.set("client_id", request.clientId);
	if (request.refreshToken) params.set("refresh_token", request.refreshToken);

	if (request.codeVerifier) params.set("code_verifier", request.codeVerifier);

	return (
		await httpClient.httpRequest<RedeemRobloxOAuthTokenResponse>({
			url: getRobloxUrl("apis", "/oauth/v1/token"),
			method: "POST",
			body: {
				type: "urlencoded",
				value: params,
			},
			errorHandling: "BEDEV2",
			camelizeResponse: true,
			bypassCORS: true,
		})
	).body;
}

export async function getApiKey({ apiKey }: GetAPIKeyRequest): Promise<APIKey> {
	return (
		await httpClient.httpRequest<APIKey>({
			url: `${getRobloxUrl("apis")}/cloud-authentication/v1/apiKey/${apiKey}`,
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function createAPIKey(data: CreateAPIKeyRequest): Promise<APIKeyWithSecret> {
	return (
		await httpClient.httpRequest<APIKeyWithSecret>({
			url: getRobloxUrl("apis", "/cloud-authentication/v1/apiKey"),
			method: "POST",
			body: {
				type: "json",
				value: data,
			},
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function deleteAPIKey(data: DeleteAPIKeyRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		url: getRobloxUrl("apis", "/cloud-authentication/v1/apiKey"),
		method: "DELETE",
		body: {
			type: "json",
			value: data,
		},
		expect: "none",
		errorHandling: "BEDEV2",
		includeCredentials: true,
	});
}

export async function updateAPIKey(data: UpdateAPIKeyRequest): Promise<void> {
	await httpClient.httpRequest<void>({
		url: getRobloxUrl("apis", "/cloud-authentication/v1/apiKey"),
		method: "PATCH",
		body: {
			type: "json",
			value: data,
		},
		expect: "none",
		errorHandling: "BEDEV2",
		includeCredentials: true,
	});
}

export async function regenerateAPIKey({
	cloudAuthId,
}: RegenerateAPIKeyRequest): Promise<APIKeyWithSecret> {
	return (
		await httpClient.httpRequest<APIKeyWithSecret>({
			url: `${getRobloxUrl("apis")}/cloud-authentication/v1/apiKey/${cloudAuthId}/regenerate`,
			method: "POST",
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function listTestPilotPrograms(): Promise<ListTestPilotProgramsResponse> {
	return (
		await httpClient.httpRequest<ListTestPilotProgramsResponse>({
			url: getRobloxUrl("apis", "/test-pilot-api/v1/beta-programs"),
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function getSelectedTestPilotProgram(): Promise<GetSelectedTestPilotProgramResponse> {
	return (
		await httpClient.httpRequest<GetSelectedTestPilotProgramResponse>({
			url: getRobloxUrl("apis", "/test-pilot-api/v1/opt-in"),
			errorHandling: "BEDEV2",
			includeCredentials: true,
		})
	).body;
}

export async function updateSelectedTestPilotProgram(
	request: UpdateSelectedTestPilotProgramRequest,
): Promise<void> {
	await httpClient.httpRequest<void>({
		url: getRobloxUrl("apis", "/test-pilot-api/v1/opt-in"),
		method: "POST",
		body: {
			type: "json",
			value: request,
		},
		expect: "none",
		includeCredentials: true,
	});
}

export async function getDeveloperExchangeMetadata() {
	return (
		await httpClient.httpRequest<DeveloperExchangeMetadata>({
			url: getRobloxUrl("economy", "/v1/developer-exchange/info"),
			includeCredentials: true,
		})
	).body;
}

export async function getUserDevExableRobuxAmount() {
	return (
		await httpClient.httpRequest<UserDevExableRobuxAmount>({
			url: getRobloxUrl("apis", "/creator-devex-data-service/v1/devexEligibleRobux"),
			includeCredentials: true,
		})
	).body;
}
