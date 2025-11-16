import type { PlatformType } from "scripts/build/constants";
import { DEFAULT_RELEASE_CHANNEL_NAME } from "../constants/misc";
import { getOrSetCache, removeCache } from "../helpers/cache";
import { getMessage } from "../helpers/i18n/getMessage";
import { presenceProcessor } from "../helpers/processors/presenceProcessor";
import {
	getMatchmadeServerData,
	getUserServerData,
	JoinServerStatusCode,
	JoinServerStatusMessage,
	parseJoinServerStatusMessage,
	type FollowUserIntoExperienceRequest,
	type GetMatchmadeServerDataReqeust,
	type GetServerDataResponse,
	type ServerJoinStatusData,
} from "../helpers/requests/services/join";
import {
	getOpenCloudUniverse,
	getOpenCloudUniversePlace,
} from "../helpers/requests/services/universes";
import { sleep } from "./misc";
import { tryOpenCloudAuthRequest } from "./cloudAuth";

/*
NewGame_NoAvailableSlots = 1
NewGame_SinglePlayer = 2
NewGame_PrivateGame = 4
Specific = 5
Specific_PrivateGame = 6
MatchMade = 10
*/
export type SessionJoinType =
	| "NewGame_NoAvailableSlots"
	| "NewGame_SinglePlayer"
	| "NewGame_PrivateGame"
	| "Specific"
	| "Specific_PrivateGame"
	| "MatchMade";

export type MinimalServerJoinData = {
	success: boolean;
	statusCode: JoinServerStatusCode;
	statusData?: ServerJoinStatusData;
	status?: JoinServerStatusMessage;
	queuePosition?: number;
	data?: {
		joinType?: SessionJoinType;
		connection: {
			address: string;
			port: number;
			isUdmuxProtected: boolean;
		};
		internalConnection?: {
			address: string;
			port: number;
		};
		datacenter: {
			id: number;
		};
		privateServer?: {
			ownerUserId: number;
			privateServerId: string;
		};
		rcc: {
			minorVersion: number;
			version: string;
			channelName: string;
			placeVersion?: number;
			likelyCreatedByRobloxStaff: boolean;
		};
		sessionInfo: {
			placeId: number;
			gameId: string;
			userLatLong?: [number, number];
		};
	};
};

type SessionInfoRaw = {
	Longitude: number;
	Latitude: number;
	JoinType?: SessionJoinType;
};

export const RETRY_JOIN_STATUS = [
	JoinServerStatusCode.Retry,
	JoinServerStatusCode.ServerDataLoaded,
	JoinServerStatusCode.InQueue,
];

export async function tryGetServerJoinData<
	T extends (props: Parameters<T>[0]) => Promise<GetServerDataResponse>,
>(fn: T, props: Parameters<T>[0], maxAttempts = 20): Promise<MinimalServerJoinData> {
	let attempt = 0;
	while (attempt < maxAttempts) {
		const response = await fn(props);
		const statusEnum = response.message
			? parseJoinServerStatusMessage(response.message)
			: undefined;
		if (
			response.joinScript ||
			response.statusData ||
			response.status === JoinServerStatusCode.InQueue
		) {
			if (response.joinScript) {
				const internalConnection = response?.joinScript.serverConnections?.[0];
				const connection = response.joinScript?.udmuxEndpoints?.[0] ?? internalConnection;

				const sessionInfoRaw = response.joinScript.sessionId
					? (JSON.parse(response.joinScript.sessionId) as SessionInfoRaw)
					: undefined;

				return {
					success: true,
					statusCode: response.status,
					statusData: response.statusData,
					status: statusEnum,
					queuePosition: response.queuePosition,
					data: {
						joinType: sessionInfoRaw?.JoinType,
						connection: {
							address: connection.address,
							port: connection.port,
							isUdmuxProtected: !!response.joinScript.udmuxEndpoints?.length,
						},
						internalConnection: internalConnection && {
							address: internalConnection.address,
							port: internalConnection.port,
						},
						datacenter: {
							id: response.joinScript.dataCenterId,
						},
						rcc: {
							minorVersion: Number.parseInt(
								response.joinScript.rccVersion.split(".")[1],
								10,
							),
							version: response.joinScript.rccVersion,
							channelName:
								response.joinScript.channelName?.toLowerCase() ||
								DEFAULT_RELEASE_CHANNEL_NAME,
							// if channel includes any uppercase letters
							placeVersion: response.joinScript.placeVersion,
							likelyCreatedByRobloxStaff: /[A-Z]/.test(
								response.joinScript.channelName,
							),
						},
						privateServer:
							response.joinScript.privateServerID &&
							response.joinScript.privateServerOwnerID
								? {
										ownerUserId: response.joinScript.privateServerOwnerID,
										privateServerId: response.joinScript.privateServerID,
									}
								: undefined,
						sessionInfo: {
							placeId: response.joinScript.placeId,
							gameId: response.joinScript.gameId,
							userLatLong: sessionInfoRaw && [
								sessionInfoRaw.Latitude,
								sessionInfoRaw.Longitude,
							],
						},
					},
				};
			}
			return {
				success: false,
				statusCode: response.status,
				statusData: response.statusData,
				status: statusEnum,
				queuePosition: response.queuePosition,
			};
		}

		if (RETRY_JOIN_STATUS.includes(response.status) && attempt < maxAttempts - 1) {
			attempt++;
			await sleep(1_250);
		} else {
			return {
				success: false,
				statusCode: response.status,
				statusData: response.statusData,
				status: statusEnum,
				queuePosition: response.queuePosition,
			};
		}
	}

	throw new Error("Failed to get join server data");
}

export function getPlaceJoinData({
	maxAttempts,
	requireSuccessful = true,
	...props
}: GetMatchmadeServerDataReqeust & {
	maxAttempts?: number;
	requireSuccessful?: boolean;
}): Promise<MinimalServerJoinData | undefined> {
	return getOrSetCache({
		key: ["places", props.placeId, "joinData", props.overridePlatformType],
		fn: () => tryGetServerJoinData(getMatchmadeServerData, props, maxAttempts),
		requireSuccessful,
	});
}

export function clearFollowUserJoinData(props: FollowUserIntoExperienceRequest) {
	return removeCache(["users", props.userIdToFollow, "joinData", props.overridePlatformType]);
}

export function getFollowUserJoinData(props: FollowUserIntoExperienceRequest) {
	return getOrSetCache({
		key: ["users", props.userIdToFollow, "joinData", props.overridePlatformType],
		fn: () => tryGetServerJoinData(getUserServerData, props, 1),
	});
}

export type CanJoinUserDetermination = {
	message?: string | undefined;
	disabled: boolean;
};

export async function determineCanJoinUser(
	props: FollowUserIntoExperienceRequest,
	viewerUserId?: number,
	viewerIsUnder13?: boolean,
): Promise<CanJoinUserDetermination> {
	/*
	const presenceData = presenceProcessor.request({
		userId: props.userIdToFollow,
	});*/
	const data = await getFollowUserJoinData(props);

	let disabled = false;
	let message: string | undefined;
	//const asyncMessage: MaybePromise<string | undefined> = undefined;

	// unknown error message
	if (data.status === JoinServerStatusMessage.RequestDenied) {
		return {
			disabled,
		};
	}

	if (data.statusCode === JoinServerStatusCode.ServerFull || data.queuePosition) {
		const presence = await presenceProcessor.request({
			userId: props.userIdToFollow,
		});
		if (presence.universeId && presence.placeId && viewerUserId) {
			const openCloudPlaceData = await tryOpenCloudAuthRequest(
				viewerUserId,
				viewerIsUnder13 === false,
				(credentials) =>
					getOpenCloudUniversePlace({
						credentials,
						universeId: presence.universeId!,
						placeId: presence.placeId!,
					}),
			);

			if (openCloudPlaceData.serverSize === 1) {
				disabled = true;
				message = getMessage("userJoin.inSingleplayer");

				return {
					disabled,
					message,
				};
			}
		}

		if (data.statusCode === JoinServerStatusCode.ServerFull) {
			message = getMessage("userJoin.serverFull");

			return {
				disabled,
				message,
			};
		}

		message = getMessage("userJoin.joinQueue", {
			queueLength: data.queuePosition,
		});

		return {
			disabled,
			message,
		};
	}

	if (
		data.statusCode === JoinServerStatusCode.Retry ||
		data.statusCode === JoinServerStatusCode.ServerBusy ||
		data.statusCode === JoinServerStatusCode.ServerDataLoaded
	) {
		if (data?.data?.joinType) {
			switch (data.data.joinType) {
				case "Specific_PrivateGame": {
					message = getMessage("userJoin.inPrivateServer");
					break;
				}
				// sent into a different server :(
				case "MatchMade": {
					message = getMessage("userJoin.inRestrictedServer");
					break;
				}
			}
		}

		/*
		const awaitedPresenceData = await presenceData;
		if (
			data.data &&
			awaitedPresenceData.gameId &&
			awaitedPresenceData.placeId &&
			data.data?.sessionInfo?.gameId !== awaitedPresenceData.gameId
		) {
			message = getMessage("userJoin.inRestrictedServer");
		}*/

		/*
		asyncMessage = presenceProcessor
			.request({
				userId: props.userIdToFollow,
			})
			.then((presence) => {
				if (presence.gameId && presence.placeId) {
					return listPlaceServers({
						serverType: "Public",
						placeId: presence.placeId,
						limit: 100,
						excludeFullGames: data.queuePosition !== 0,
					}).then((data) => {
						if (
							!data.data.some((server) => server.id === presence.gameId) &&
							data.data.length < 100
						) {
							return getMessage("userJoin.joinReservedServer");
						}
					});
				}
			});*/
		return {
			disabled,
			message,
			//asyncMessage,
		};
	}

	disabled = true;
	if (data.statusCode === JoinServerStatusCode.NoPermission) {
		switch (data.status) {
			case JoinServerStatusMessage.CantJoinPrivateServer:
				message = getMessage("userJoin.inPrivateServer");
				break;
			case JoinServerStatusMessage.CantJoinReservedServer:
				message = getMessage("userJoin.inReservedServer");
				break;
			default:
				message = getMessage("userJoin.cantJoin");
		}
	} else if (
		data.statusCode === JoinServerStatusCode.ChannelMismatch ||
		data.statusCode === JoinServerStatusCode.SetChannelInternalOnly
	) {
		message = getMessage("userJoin.inInternalServer");
	}

	if (!message)
		message = getMessage(
			data.statusData?.creatorExperienceBan ? "userJoin.userBanned" : "userJoin.cantJoin",
		);

	return {
		disabled,
		message,
	};
}

export function getUniversePlayableDevices(universeId: number, userId: number, isUnder13: boolean) {
	return getOrSetCache<PlatformType[]>({
		key: ["universes", universeId, "playableDevices"],
		fn: () =>
			tryOpenCloudAuthRequest(userId, isUnder13 === false, (credentials) =>
				getOpenCloudUniverse({
					credentials,
					universeId,
				})
					.then((data) => {
						const PlatformTypes: PlatformType[] = [];
						if (data.desktopEnabled) {
							PlatformTypes.push("Desktop");
						}
						if (data.mobileEnabled) {
							PlatformTypes.push("Phone");
						}
						if (data.tabletEnabled) {
							PlatformTypes.push("Tablet");
						}
						if (data.consoleEnabled) {
							PlatformTypes.push("Console");
						}
						if (data.vrEnabled) {
							PlatformTypes.push("VR");
						}

						return PlatformTypes;
					})
					.catch(() => []),
			),
	});
}
