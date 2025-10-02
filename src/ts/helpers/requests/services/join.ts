import type { PlatformType } from "scripts/build/constants.ts";
import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { httpClient } from "../main.ts";

export type GameJoinAttemptOrigin =
	| "JoinUser"
	| "publicServerListJoin"
	| "friendServerListJoin"
	| "privateServerListJoin"
	| "PlayButton"
	| "RoSealFetchInfo"
	| "RoSealActivitydNotification";

export type GetPrivateServerDataRequest = {
	placeId: number;
	accessCode?: string;
	linkCode?: string;
	gameJoinAttemptId?: string;
	joinOrigin?: GameJoinAttemptOrigin;
	overridePlatformType?: PlatformType;
};

export type JoinReservedServerRequest = {
	placeId: number;
	accessCode: string;
	gameJoinAttemptId?: string;
	joinOrigin?: GameJoinAttemptOrigin;
	overridePlatformType?: PlatformType;
};

export type FollowUserIntoExperienceRequest = {
	userIdToFollow: number;
	gameJoinAttemptId?: string;
	joinOrigin?: GameJoinAttemptOrigin;
	overridePlatformType?: PlatformType;
};

export type ServerConnection = {
	address: string;
	port: number;
};

export type JoinMatchmakingAttributes = {
	serverAttributes: string;
};

export type JoinScript = {
	clientPort: number;
	machineAddress: string;
	serverPort: number;
	serverConnections: ServerConnection[];
	udmuxEndpoints: ServerConnection[];
	directServerReturn: boolean;
	tokenGenAlgorithm: number;
	pepperId: number;
	tokenValue: string;
	pingUrl: string;
	pingInterval: number;
	userName: string;
	displayName: string;
	hasVerifiedBadge: boolean;
	seleniumTestMode: boolean;
	userId: number;
	robloxLocale: string;
	gameLocale: string;
	superSafeChat: boolean;
	flexibleChatEnabled: boolean;
	characterAppearance: string;
	clientTicket: string;
	gameId: string;
	placeId: number;
	baseUrl: string;
	chatStyle: string;
	creatorId: number;
	creatorTypeEnum: string;
	membershipType: string;
	accountAge: number;
	cookieStoreFirstTimePlayKey: string;
	cookieStorFiveMinutePlayKey: string;
	cookieStoreEnabled: boolean;
	isUnknownOrUnder13: boolean;
	gameChatType: string;
	sessionId: string;
	analyticsSessionId: string;
	dataCenterId: number;
	universeId: number;
	followUserId: number;
	characterAppearanceId: number;
	countryCode: string;
	alternateName: string;
	randomSeed1: string;
	clientPublicKeyData: string;
	rccVersion: string;
	channelName: string;
	verifiedAMP: boolean;
	privateServerOwnerID?: number | null;
	privateServerID?: string | null;
	eventId?: string;
	ephemeralEarlyPubKey?: string;
	partyId?: string;
	showRobloxTranslations: boolean;
	matchmakingAttributes: JoinMatchmakingAttributes;
	translationDisplayMode?: string;
	placeVersion?: number;
};

export type CreatorBan = {
	startTime: string;
	durationSeconds: number | null;
	displayReason: string | null;
	displayReasonTextFilterStatus: number;
	isInherited: boolean;
};

export type ServerJoinStatusData = {
	creatorExperienceBan?: CreatorBan;
};

export type GetServerDataResponse = {
	jobId: string | null;
	status: JoinServerStatusCode;
	statusData?: ServerJoinStatusData;
	joinScriptUrl?: string | null;
	authenticationUrl?: string | null;
	authenticationTicket?: string | null;
	message: string | null;
	joinScript?: JoinScript;
	queuePosition: number;
};

export type GetMatchmadeServerDataReqeust = {
	placeId: number;
	channelName?: string;
	gameJoinAttemptId?: string;
	joinOrigin?: GameJoinAttemptOrigin;
	overridePlatformType?: PlatformType;
};

export type GetServerInstanceDataRequest = {
	placeId: number;
	gameId: string;
	gameJoinAttemptId?: string;
	joinOrigin?: GameJoinAttemptOrigin;
	overridePlatformType?: PlatformType;
};

export async function getUserServerData({
	overridePlatformType = "Desktop",
	...request
}: FollowUserIntoExperienceRequest): Promise<GetServerDataResponse> {
	return (
		await httpClient.httpRequest<GetServerDataResponse>({
			method: "POST",
			url: getRobloxUrl("gamejoin", "/v1/play-with-user"),
			overridePlatformType,
			body: {
				type: "json",
				value: request,
			},
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

export async function getReservedServerData({
	overridePlatformType = "Desktop",
	...request
}: JoinReservedServerRequest): Promise<GetServerDataResponse> {
	return (
		await httpClient.httpRequest<GetServerDataResponse>({
			method: "POST",
			url: getRobloxUrl("gamejoin", "/v1/join-reserved-game"),
			overridePlatformType,
			body: {
				type: "json",
				value: request,
			},
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

export async function getPrivateServerData({
	overridePlatformType = "Desktop",
	...request
}: GetPrivateServerDataRequest): Promise<GetServerDataResponse> {
	return (
		await httpClient.httpRequest<GetServerDataResponse>({
			method: "POST",
			url: getRobloxUrl("gamejoin", "/v1/join-private-game"),
			overridePlatformType,
			body: {
				type: "json",
				value: request,
			},
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

export async function getMatchmadeServerData({
	overridePlatformType = "Desktop",
	...request
}: GetMatchmadeServerDataReqeust): Promise<GetServerDataResponse> {
	return (
		await httpClient.httpRequest<GetServerDataResponse>({
			method: "POST",
			url: getRobloxUrl("gamejoin", "/v1/join-game"),
			overridePlatformType,
			body: {
				type: "json",
				value: request,
			},
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

export async function getServerInstanceData({
	overridePlatformType = "Desktop",
	...request
}: GetServerInstanceDataRequest): Promise<GetServerDataResponse> {
	return (
		await httpClient.httpRequest<GetServerDataResponse>({
			method: "POST",
			url: getRobloxUrl("gamejoin", "/v1/join-game-instance"),
			overridePlatformType,
			body: {
				type: "json",
				value: request,
			},
			camelizeResponse: true,
			includeCredentials: true,
		})
	).body;
}

// Please keep in sync with https://github.com/Sealstrap/Sealstrap/blob/main/src-tauri/src/http/services/join_service.rs#L146
export enum JoinServerStatusCode {
	Retry = 0,
	ServerFound = 1,
	ServerDataLoaded = 2,
	ExperienceDisabled = 3,
	ServerUnavailable = 4,
	ServerUnavailableUnexpectedly = 5,
	ServerFull = 6,
	// 7, 8, 9 = Unknown
	FollowedUserLeft = 10,
	ExperienceRestricted = 11,
	NoPermission = 12,
	ServerBusy = 13,
	HashExpired = 14,
	HashException = 15,
	PartyTooLarge = 16,
	HTTPError = 17,
	MalformedRequestBody = 18,
	ChannelMismatch = 19,
	SetChannelInternalOnly = 20,
	UnauthorizedPrivacySettings = 21,
	InQueue = 22,
	UserBanned = 23,
}

export enum JoinServerStatusMessage {
	BlockedByParent = 0,
	UserBanned = 1,
	CantJoinPrivateServer = 2,
	CantJoinReservedServer = 3,
	DeviceNotSupported = 4,
	UnavailableDueToCompliance = 5,
	ExperiencePrivate = 6,
	MatureExperienceAndUserNotVerified = 7,
	UserContentRestricted = 8,
	PlaceHasNoUniverse = 9,
	InvalidPlaceId = 10,
	InvalidServer = 11,
	InvalidPrivateServerAccessCode = 12,
	InvalidReservedServerAccessCode = 13,
	ExperienceUnderReview = 14,
	ExperienceFriendsOnly = 15,
	CantFollowUser = 16,
	UserToFollowDoesntExist = 17,
	RequestDenied = 18,
	NotAuthenticated = 19,
	PartyIdRequired = 20,
	UserNotInParty = 21,
	CantJoinServerWithPartyVoice = 22,
	CantJoinNonRootPlace = 23,
	UnexpectedPlayTogether = 24,
	CallIdInvalid = 25,
	UserNotInCall = 26,
	InvalidTeleport = 27,
	InvalidCreatorExperienceTeleport = 28,
	PurchaseRequired = 29,
	PlaceHasNoPublishedVersion = 30,
	CantJoinPrivateServerLinks = 31,
	ExperienceGroupOnly = 32,
	ExperienceUnrated = 33,
	SocialHangoutNotAllowed = 34,
	StudioAccessDenied = 35,
	CloudEditAccessDenied = 36,
	InternalError = 37,
	Unknown = 38,
}

export function parseJoinServerStatusMessage(value: string): JoinServerStatusMessage {
	switch (value) {
		case "<This text is not reviewed by UX because it is not displayed to users. Each client provides their own translation> This experience was blocked by your parent":
			return JoinServerStatusMessage.BlockedByParent;
		case "<This text is not reviewed by UX because it is not displayed to users. The client renders a message chosen by the creator when they banned the user.> You have been banned from this experience by its creators":
			return JoinServerStatusMessage.UserBanned;
		case "User lacks access to join private server":
			return JoinServerStatusMessage.CantJoinPrivateServer;
		case "User lacks permissions to join private server":
			return JoinServerStatusMessage.CantJoinReservedServer;
		case "Your device is not supported to play this game.":
			return JoinServerStatusMessage.DeviceNotSupported;
		case "This game is unavailable in your region to comply with regulations.":
			return JoinServerStatusMessage.UnavailableDueToCompliance;
		case "Game's root place is not active.":
			return JoinServerStatusMessage.ExperiencePrivate;
		case "<This text is not reviewed by UX because it is not displayed to users. Each client provides their own translation> This experience is rated 17+ and user is 17 years or older but it is not verified.":
			return JoinServerStatusMessage.MatureExperienceAndUserNotVerified;
		case "This game is unavailable due to your content controls setting.":
		case "To join this experience, update your content maturity setting.":
			return JoinServerStatusMessage.UserContentRestricted;
		case "Cannot join place without universe":
			return JoinServerStatusMessage.PlaceHasNoUniverse;
		case "Cannot join game without placeId.":
		case "Invalid place id for game join.":
			return JoinServerStatusMessage.InvalidPlaceId;
		case "Game instance cannot be joined":
		case "Could not find requested game instance":
			return JoinServerStatusMessage.InvalidServer;
		case "Access code for private server is not valid.":
			return JoinServerStatusMessage.InvalidPrivateServerAccessCode;
		case "Access code for reserved server is not valid.":
			return JoinServerStatusMessage.InvalidReservedServerAccessCode;
		case "This game has not been approved, yet.":
		case "The game is currently unavailable due to restrictions set by Roblox.":
			return JoinServerStatusMessage.ExperienceUnderReview;
		case "You are not allowed to play this game. (Friends Only)":
			return JoinServerStatusMessage.ExperienceFriendsOnly;
		case "Unauthorized to follow user.":
			return JoinServerStatusMessage.CantFollowUser;
		case "Unable to follow user.":
			return JoinServerStatusMessage.UserToFollowDoesntExist;
		case "Unable to join Game 211":
		case "Unable to join Game 311":
		case "Unable to join Game 411":
		case "Unable to join Game 511":
		case "Unable to join Game 611":
		case "Unable to join Game 711":
		case "Unable to join Game 811":
			return JoinServerStatusMessage.RequestDenied;
		case "Unable to join Game 212":
		case "Unable to join Game 312":
		case "Unable to join Game 412":
		case "Unable to join Game 512":
		case "Unable to join Game 612":
		case "Unable to join Game 712":
		case "Unable to join Game 812":
			return JoinServerStatusMessage.NotAuthenticated;
		case "JoinPartyVoice requires a partyId":
			return JoinServerStatusMessage.PartyIdRequired;
		case "User is not in the specified party":
			return JoinServerStatusMessage.UserNotInParty;
		case "Cannot join Communication server of non-Communication Place":
			return JoinServerStatusMessage.CantJoinServerWithPartyVoice;
		case "Cannot join non-root place or root of different universe":
		case "Cannot join this non-root place due to join restrictions":
			return JoinServerStatusMessage.CantJoinNonRootPlace;
		case "Unexpected game join request.":
			return JoinServerStatusMessage.UnexpectedPlayTogether;
		case "Unknown error.":
			return JoinServerStatusMessage.CallIdInvalid;
		case "User is not in a valid call invite":
			return JoinServerStatusMessage.UserNotInCall;
		case "Can't join private instance through specific joins":
			return JoinServerStatusMessage.CantJoinPrivateServer;
		case "Teleport validation failed":
			return JoinServerStatusMessage.InvalidTeleport;
		case "Cannot teleport from this universe to a universe owned by a different creator":
			return JoinServerStatusMessage.InvalidCreatorExperienceTeleport;
		case "You need to purchase access to this game before you can play.":
			return JoinServerStatusMessage.PurchaseRequired;
		case "This game is not published.":
			return JoinServerStatusMessage.PlaceHasNoPublishedVersion;
		case "User privacy does not allow join.":
			return JoinServerStatusMessage.CantJoinPrivateServerLinks;
		case "You are not allowed to play this game. (Group Only)":
			return JoinServerStatusMessage.ExperienceGroupOnly;
		case "<This text is not reviewed by UX because it is not displayed to users. Each client provides their own translation> This experience is unavailable to you as it is unrated.":
		case "This experience is not accessible because it is unrated":
			return JoinServerStatusMessage.ExperienceUnrated;
		case "<This text is not reviewed by UX because it is not displayed to users. Each client provides their own translation> This experience is unavailable to you as it is a Social Hangout and/or includes Freeform In-Game Creation.":
			return JoinServerStatusMessage.SocialHangoutNotAllowed;
		case "Cannot play games within the Roblox Studio":
			return JoinServerStatusMessage.StudioAccessDenied;
		case "User not authorized to CloudEdit this place":
			return JoinServerStatusMessage.CloudEditAccessDenied;
		case "Place does not have universe":
			return JoinServerStatusMessage.PlaceHasNoUniverse;
		case "Invalid Game.":
		case "One of the services required to determine game access is currently unavailable":
		case "Backend Exception":
			return JoinServerStatusMessage.InternalError;
		default:
			return JoinServerStatusMessage.Unknown;
	}
}
