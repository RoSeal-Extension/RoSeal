import { DEFAULT_RELEASE_CHANNEL_NAME } from "../constants/misc";
import { blankInjectCall } from "../helpers/domInvokes";
import {
	generateAuthenticationTicket,
	generateClientAssertion,
	updateClientStatus,
} from "../helpers/requests/services/auth";
import type { GameJoinAttemptOrigin } from "../helpers/requests/services/join";
import { getDeviceMeta, getPlaceLauncherData } from "./context";
import { getUserAccountIdBTID, getUserReferralPlayerId } from "./cookies";
import { authedProtocolParser, type AuthedProtocolType, deepLinksParser } from "./deepLinks";

export type CurrentServerJoinMetadata =
	| ({
			type: "specific";
	  } & SendJoinGameInstanceRequest)
	| ({
			type: "playWithUser";
	  } & SendFollowPlayerIntoGameRequest)
	| ({
			type: "privateServer";
	  } & SendJoinPrivateGameRequest)
	| ({
			type: "matchmade";
	  } & SendJoinMultiplayerGameRequest);

export type SendServerJoinData = {
	launchData?: string;
	eventId?: string;
};

export type SendJoinMultiplayerGameRequest = {
	placeId: number;
	joinAttemptId?: string;
	joinAttemptOrigin?: GameJoinAttemptOrigin;
	joinData?: SendServerJoinData;
	referredByPlayerId?: number;
};

export type SendJoinPrivateGameRequest = {
	placeId: number;
	accessCode?: string;
	linkCode?: string;
	joinAttemptId?: string;
	joinAttemptOrigin?: GameJoinAttemptOrigin;
};

export type SendJoinGameInstanceRequest = SendJoinMultiplayerGameRequest & {
	gameId: string;
};

export type SendFollowPlayerIntoGameRequest = {
	userId: number;
	joinAttemptId?: string;
	joinAttemptOrigin?: GameJoinAttemptOrigin;
};

export async function buildRobloxProtocolUrl(data: CurrentServerJoinMetadata) {
	updateClientStatus({
		status: "Unknown",
	});

	const [authTicket, placeLauncherData] = await Promise.all([
		generateClientAssertion().then(({ clientAssertion }) =>
			generateAuthenticationTicket({ clientAssertion }),
		),
		getPlaceLauncherData(),
	]);

	let placeLauncherUrl: string | undefined;
	const cookiesData = getUserAccountIdBTID();
	const referredByPlayerId =
		"placeId" in data ? getUserReferralPlayerId(data.placeId) : undefined;

	const browserTrackerId = cookiesData?.[1];
	switch (data.type) {
		case "privateServer": {
			placeLauncherUrl = authedProtocolParser().buildAuthedPlaceLauncherUrl({
				request: "RequestPrivateGame",
				browserTrackerId,
				placeId: data.placeId,
				accessCode: data.accessCode,
				linkCode: data.linkCode,
				referredByPlayerId,
				joinAttemptId: data.joinAttemptId,
				joinAttemptOrigin: data.joinAttemptOrigin,
			});
			break;
		}
		case "playWithUser": {
			placeLauncherUrl = authedProtocolParser().buildAuthedPlaceLauncherUrl({
				request: "RequestFollowUser",
				browserTrackerId,
				userId: data.userId,
				referredByPlayerId,
				joinAttemptId: data.joinAttemptId,
				joinAttemptOrigin: data.joinAttemptOrigin,
			});
			break;
		}
		case "specific": {
			placeLauncherUrl = authedProtocolParser().buildAuthedPlaceLauncherUrl({
				request: "RequestGameJob",
				browserTrackerId,
				placeId: data.placeId,
				gameId: data.gameId,
				eventId: data.joinData?.eventId,
				launchData: data.joinData?.launchData,
				referredByPlayerId,
				joinAttemptId: data.joinAttemptId,
				joinAttemptOrigin: data.joinAttemptOrigin,
			});
			break;
		}
		case "matchmade": {
			placeLauncherUrl = authedProtocolParser().buildAuthedPlaceLauncherUrl({
				request: "RequestGame",
				browserTrackerId,
				placeId: data.placeId,
				eventId: data.joinData?.eventId,
				launchData: data.joinData?.launchData,
				referredByPlayerId,
				joinAttemptId: data.joinAttemptId,
				joinAttemptOrigin: data.joinAttemptOrigin,
			});
		}
	}

	return authedProtocolParser().buildAuthedProtocolUrl({
		type: import.meta.env.ROBLOX_PLAYER_PROTOCOL as AuthedProtocolType,
		launchMode: "play",
		launchTime: Date.now().toString(),
		gameInfo: authTicket.code ?? undefined,
		otherParams: {
			LaunchExp: "InApp",
			gameLocale: placeLauncherData?.gameLocale ?? undefined,
			robloxLocale: placeLauncherData?.robloxLocale ?? undefined,
			browsertrackerid: browserTrackerId,
			channel:
				placeLauncherData?.playerChannelName &&
				placeLauncherData?.playerChannelName.toLowerCase() !== DEFAULT_RELEASE_CHANNEL_NAME
					? placeLauncherData.playerChannelName
					: undefined,
			placelauncherurl: placeLauncherUrl,
		},
	});
}

export function buildRobloxDeeplinkProtocolUrl(data: CurrentServerJoinMetadata) {
	switch (data.type) {
		case "matchmade": {
			return deepLinksParser()
				.createDeepLink("joinPlace", {
					placeId: data.placeId.toString(),
					joinAttemptId: data.joinAttemptId,
					joinAttemptOrigin: data.joinAttemptOrigin,
					launchData: data.joinData?.launchData,
					eventId: data.joinData?.eventId,
					referredByPlayerId: data.referredByPlayerId?.toString(),
				})
				?.toProtocolUrl();
		}
		case "privateServer": {
			return deepLinksParser()
				.createDeepLink("joinPlace", {
					placeId: data.placeId.toString(),
					accessCode: data.accessCode,
					linkCode: data.linkCode,
					joinAttemptId: data.joinAttemptId,
					joinAttemptOrigin: data.joinAttemptOrigin,
				})
				?.toProtocolUrl();
		}
		case "playWithUser": {
			return deepLinksParser()
				.createDeepLink("joinUser", {
					userId: data.userId.toString(),
					joinAttemptId: data.joinAttemptId,
					joinAttemptOrigin: data.joinAttemptId,
				})
				?.toProtocolUrl();
		}
		case "specific": {
			return deepLinksParser()
				.createDeepLink("joinPlace", {
					placeId: data.placeId.toString(),
					gameInstanceId: data.gameId,
					joinAttemptId: data.joinAttemptId,
					joinAttemptOrigin: data.joinAttemptOrigin,
					launchData: data.joinData?.launchData,
					eventId: data.joinData?.eventId,
					referredByPlayerId: data.referredByPlayerId?.toString(),
				})
				?.toProtocolUrl();
		}
	}
}

export async function shouldUseGameLaunchInterface() {
	const meta = await getDeviceMeta();
	if (!meta) return true;

	const { deviceType, isUWPApp, isChromeOS } = meta;

	return (
		(deviceType === "Desktop" && !isUWPApp && !isChromeOS) ||
		deviceType === "Tablet" ||
		isUWPApp
	);
}

export async function sendJoinMultiplayerGame(request: SendJoinMultiplayerGameRequest) {
	if (await shouldUseGameLaunchInterface())
		return blankInjectCall(
			["Roblox", "GameLauncher", "joinMultiplayerGame"],
			[
				request.placeId,
				undefined,
				undefined,
				request.joinAttemptId,
				request.joinAttemptOrigin,
				request.joinData,
				request.referredByPlayerId,
			],
		);

	const deepLink = buildRobloxDeeplinkProtocolUrl({
		type: "matchmade",
		...request,
	});

	if (deepLink) {
		location.href = deepLink;
	}
}

export async function sendFollowPlayerIntoGame(request: SendFollowPlayerIntoGameRequest) {
	if (await shouldUseGameLaunchInterface())
		return blankInjectCall(
			["Roblox", "GameLauncher", "followPlayerIntoGame"],
			[request.userId, request.joinAttemptId, request.joinAttemptOrigin],
		);

	const deepLink = buildRobloxDeeplinkProtocolUrl({
		type: "playWithUser",
		...request,
	});

	if (deepLink) {
		location.href = deepLink;
	}
}

export async function sendJoinGameInstance(request: SendJoinGameInstanceRequest) {
	if (await shouldUseGameLaunchInterface())
		return blankInjectCall(
			["Roblox", "GameLauncher", "joinGameInstance"],
			[
				request.placeId,
				request.gameId,
				undefined,
				undefined,
				request.joinAttemptId,
				request.joinAttemptOrigin,
				request.joinData,
				request.referredByPlayerId,
			],
		);

	const deepLink = buildRobloxDeeplinkProtocolUrl({
		type: "specific",
		...request,
	});

	if (deepLink) {
		location.href = deepLink;
	}
}

export async function sendJoinPrivateGame(request: SendJoinPrivateGameRequest) {
	if (await shouldUseGameLaunchInterface())
		return blankInjectCall(
			["Roblox", "GameLauncher", "joinPrivateGame"],
			[
				request.placeId,
				request.accessCode,
				request.linkCode,
				request.joinAttemptId,
				request.joinAttemptOrigin,
			],
		);

	const deepLink = buildRobloxDeeplinkProtocolUrl({
		type: "privateServer",
		...request,
	});

	if (deepLink) {
		location.href = deepLink;
	}
}
