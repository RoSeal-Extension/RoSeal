import type { GameJoinAttemptOrigin } from "../helpers/requests/services/join";
import { getRobloxUrl } from "./baseUrls" with { type: "macro" };

type LaunchMode = "edit" | "plugin" | "play" | "build" | "app" | "asset";

type ProtocolType = "roblox-player" | "roblox-studio";

type LaunchExp = "InApp" | "PreferInApp" | "InBrowser";

type StudioTask =
	| "EditFile"
	| "EditPlace"
	| "EditPlaceRevision"
	| "StartClient"
	| "StartTeamTest"
	| "InstallPlugin"
	| "TryAsset"
	| "RemoteDebug"
	| "StartServer";

export type DistributorType = "Global" | "ChinaJoinVenture";

type OtherParams = {
	browsertrackerid?: number;
	robloxLocale?: string;
	gameLocale?: string;
	channel?: string;
	LaunchExp?: LaunchExp;
	avatar?: string;
	assetid?: number;
	pluginid?: number;
	placeid?: number;
	universeid?: number;
	script?: string;
	placelauncherurl?: string;
	task?: StudioTask;
	traceId?: string;
	userId?: number;
	browser?: string;
	distributorType?: DistributorType;
	[key: string]: string | number | undefined;
};

type BuildProtocolUrlV1Request = {
	type: ProtocolType;
	launchMode?: LaunchMode;
	gameInfo?: string;
	launchTime?: string;
	baseUrl?: string;
	otherParams?: OtherParams;
};

type PlaceLauncherRequest =
	| "RequestGame"
	| "RequestCloudEdit"
	| "RequestGameJob"
	| "RequestFollowUser"
	| "RequestPrivateGame"
	| "RequestPlayTogetherGame"
	| "RequestGameApp"
	| "RequestInvalid"
	| "RequestPlayWithParty"
	| "CheckGameJobStatus"
	| "RequestReservedGame"
	| "RequestCrossExpVoice";

type PrivateGameMode = "ReservedServer";

type PlaceLauncherURLParameters = {
	request: PlaceLauncherRequest;
	placeId?: number;
	jobId?: string;
	gameId?: string;
	gender?: string;
	genderId?: number;
	accessCode?: string;
	linkCode?: string;
	launchData?: string;
	privateGameMode?: PrivateGameMode;
	teleportType?: string;
	reservedServerAccessCode?: string;
	referralPage?: string;
	referredByPlayerId?: number;
	conversationId?: number;
	isPartyLeader?: boolean;
	isTeleport?: boolean;
	partyGuid?: string;
	isPlayTogetherGame?: boolean;
	joinAttemptId?: string;
	joinAttemptOrigin?: GameJoinAttemptOrigin;
	callId?: string;
	browserTrackerId?: number;
	eventId?: string;
	isolationContext?: string;
	gameJoinContext?: string;
	userId?: number;
};

export function _buildRobloxProtocolUrlV1(request: BuildProtocolUrlV1Request): string {
	const params: string[] = ["1"];
	if (request.launchMode) params.push(`launchmode:${request.launchMode}`);
	if (request.gameInfo) params.push(`gameinfo:${request.gameInfo}`);
	if (request.launchTime) params.push(`launchtime:${request.launchTime}`);
	if (request.baseUrl) params.push(`baseUrl:${request.baseUrl}`);

	if (request.otherParams) {
		for (const key in request.otherParams) {
			const value = request.otherParams[key];
			if (key === value) {
				params.push(key);
			} else if (value !== undefined && value !== null) {
				params.push(`${key}:${encodeURIComponent(value)}`);
			}
		}
	}

	return `${request.type}:${params.join("+")}`;
}

export function _buildPlaceLauncherUrl(parameters: PlaceLauncherURLParameters): string {
	const url = new URL(`https://${getRobloxUrl("assetgame", "/game/PlaceLauncher.ashx")}`);
	const stringifiedParameters: Record<string, string> = {};
	for (const [key, value] of Object.entries(parameters)) {
		if (value !== undefined && value !== null) {
			stringifiedParameters[key] = String(value);
		}
	}
	url.search = new URLSearchParams(stringifiedParameters).toString();

	return url.toString();
}
