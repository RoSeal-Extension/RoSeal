import { JoinServerStatusCode, JoinServerStatusMessage } from "../helpers/requests/services/join";

export const MAX_SERVER_NAME_LENGTH = 50;

export const SLOW_GAME_FPS_THRESHOLD = 15;

export const USER_CHANNEL_DATA_SESSION_CACHE_STORAGE_KEY = "cache.userChannelData";
//export const PREFERRED_SERVER_REGION_STORAGE_KEY = "preferredServerRegion";

export const FAST_SERVER_CONNECTION_KM_THRESHOLD = 1_500;
export const SLOW_SERVER_CONNECTION_KM_THRESHOLD = 5_000;

export const MAX_SERVER_FPS = 60;
export const MAX_PUBLIC_SERVER_PLAYER_THUMBNAILS = 6;

export const FILTER_PUBLIC_SERVER_STATUS_CODES = [
	JoinServerStatusCode.ChannelMismatch,
	JoinServerStatusCode.ServerUnavailableUnexpectedly,
	JoinServerStatusCode.ServerUnavailable,
	JoinServerStatusCode.NoPermission,
	JoinServerStatusCode.ServerUnavailable,
	JoinServerStatusCode.ServerUnavailableUnexpectedly,
];

export const UNFILTER_PUBLIC_SERVER_STATUS_MESSAGES = [
	JoinServerStatusMessage.NotAuthenticated,
	JoinServerStatusMessage.RequestDenied,
	JoinServerStatusMessage.CantJoinNonRootPlace,
	JoinServerStatusMessage.PurchaseRequired,
	JoinServerStatusMessage.ExperienceUnrated,
	JoinServerStatusMessage.ExperiencePrivate,
	JoinServerStatusMessage.MatureExperienceAndUserNotVerified,
	JoinServerStatusMessage.UserContentRestricted,
	JoinServerStatusMessage.BlockedByParent,
];
