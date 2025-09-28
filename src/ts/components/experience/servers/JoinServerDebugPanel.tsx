import { useMemo, useState } from "preact/hooks";
import { DEFAULT_RELEASE_CHANNEL_NAME, TEST_RCC_CHANNEL_NAME } from "src/ts/constants/misc";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import {
	getMatchmadeServerData,
	getServerInstanceData,
	JoinServerStatusCode,
	JoinServerStatusMessage,
} from "src/ts/helpers/requests/services/join";
import { shutdownExperienceServer } from "src/ts/helpers/requests/services/universes";
import { getDeviceMeta } from "src/ts/utils/context";
import { sendJoinGameInstance } from "src/ts/utils/gameLauncher";
import { type MinimalServerJoinData, tryGetServerJoinData } from "src/ts/utils/joinData";
import Button from "../../core/Button";
import CountryFlag from "../../core/CountryFlag";
import TextInput from "../../core/TextInput";
import usePromise from "../../hooks/usePromise";
import { useServersTabContext } from "./ServersTabProvider";
import { getLocalizedRegionName } from "./utils";

export default function JoinServerDebugPanel() {
	const [deviceMeta] = usePromise(getDeviceMeta, []);
	const { canManagePlace, dataCenters, placeId } = useServersTabContext();
	const [canViewDebugChannelName] = usePromise(() => {
		if (!deviceMeta?.platformType) return;

		return tryGetServerJoinData(getMatchmadeServerData, {
			placeId,
			channelName: TEST_RCC_CHANNEL_NAME,
			overridePlatformType: deviceMeta.platformType,
			gameJoinAttemptId: crypto.randomUUID(),
			joinOrigin: "RoSealFetchInfo",
		}).then((data) => {
			return data.statusCode === JoinServerStatusCode.ChannelMismatch;
		});
	}, [deviceMeta?.platformType]);
	const [serverId, setServerId] = useState("");
	const [channelName, setChannelName] = useState("");
	const [loading, setLoading] = useState(false);

	const [serverData, setServerData] = useState<MinimalServerJoinData>();

	const placeHolderServerId = useMemo(() => crypto.randomUUID(), []);

	const canJoinServer =
		serverData?.data !== undefined || serverData?.statusCode === JoinServerStatusCode.InQueue;

	const isChannelMismatch =
		channelName !== "" && serverData?.statusCode === JoinServerStatusCode.ChannelMismatch;
	const isServerIdInvalid = serverData?.status === JoinServerStatusMessage.InvalidServer;
	const isInQueue = serverData?.statusCode === JoinServerStatusCode.InQueue;

	const errorMessage = useMemo(() => {
		if (!serverData || serverData.data || isChannelMismatch || isServerIdInvalid || isInQueue)
			return;

		switch (serverData.status) {
			case JoinServerStatusMessage.RequestDenied:
			case JoinServerStatusMessage.NotAuthenticated: {
				return getMessage("experience.servers.joinDebug.errors.notAuthenticated");
			}

			case JoinServerStatusMessage.PlaceHasNoPublishedVersion:
			case JoinServerStatusMessage.PlaceHasNoUniverse:
			case JoinServerStatusMessage.ExperienceFriendsOnly:
			case JoinServerStatusMessage.ExperienceGroupOnly:
			case JoinServerStatusMessage.ExperiencePrivate:
			case JoinServerStatusMessage.ExperienceUnderReview: {
				return getMessage("experience.servers.joinDebug.errors.noPermissions");
			}

			case JoinServerStatusMessage.DeviceNotSupported: {
				return getMessage("experience.servers.joinDebug.errors.deviceNotSupported");
			}

			case JoinServerStatusMessage.CantJoinNonRootPlace: {
				return getMessage("experience.servers.joinDebug.errors.cantJoinNonRootPlace");
			}

			case JoinServerStatusMessage.BlockedByParent:
			case JoinServerStatusMessage.ExperienceUnrated:
			case JoinServerStatusMessage.MatureExperienceAndUserNotVerified:
			case JoinServerStatusMessage.SocialHangoutNotAllowed:
			case JoinServerStatusMessage.UnavailableDueToCompliance:
			case JoinServerStatusMessage.UserContentRestricted: {
				return getMessage("experience.servers.joinDebug.errors.notAllowed");
			}

			case JoinServerStatusMessage.CantJoinPrivateServer: {
				return getMessage("experience.servers.joinDebug.errors.cantJoinPrivateServer");
			}

			case JoinServerStatusMessage.CantJoinReservedServer: {
				return getMessage("experience.servers.joinDebug.errors.cantJoinReservedServer");
			}

			case JoinServerStatusMessage.PurchaseRequired: {
				return getMessage("experience.servers.joinDebug.errors.purchaseRequired");
			}

			case JoinServerStatusMessage.UserBanned: {
				return getMessage("experience.servers.joinDebug.errors.userBanned");
			}
		}

		switch (serverData.statusCode) {
			case JoinServerStatusCode.ExperienceDisabled: {
				return getMessage("experience.servers.joinDebug.errors.experienceDisabled");
			}

			case JoinServerStatusCode.HashException: {
				return getMessage("experience.servers.joinDebug.errors.hashException");
			}

			case JoinServerStatusCode.HTTPError: {
				return getMessage("experience.servers.joinDebug.errors.httpError");
			}

			case JoinServerStatusCode.HashExpired: {
				return getMessage("experience.servers.joinDebug.errors.hashExpired");
			}

			case JoinServerStatusCode.ServerBusy: {
				return getMessage("experience.servers.joinDebug.errors.serverBusy");
			}

			case JoinServerStatusCode.ServerFull: {
				return getMessage("experience.servers.joinDebug.errors.serverFull");
			}

			case JoinServerStatusCode.ServerUnavailable:
			case JoinServerStatusCode.ServerUnavailableUnexpectedly: {
				return getMessage("experience.servers.joinDebug.errors.serverUnavailable");
			}

			case JoinServerStatusCode.UnauthorizedPrivacySettings: {
				return getMessage(
					"experience.servers.joinDebug.errors.unauthorizedPrivacySettings",
				);
			}

			case JoinServerStatusCode.ChannelMismatch: {
				return getMessage("experience.servers.joinDebug.errors.channelMismatch");
			}
		}

		return `Unknown error ${serverData?.statusCode}: ${serverData?.status}`;
	}, [serverData?.statusCode, serverData?.status]);

	const dataCenter = useMemo(() => {
		if (!serverData?.data || !dataCenters) return;

		for (const datacenter of dataCenters) {
			if (datacenter.dataCenterIds.includes(serverData.data.datacenter.id)) {
				return datacenter;
			}
		}
	}, [serverData?.data?.datacenter.id, dataCenters]);

	return (
		<div className="section debug-join-panel">
			<div className="container-header">
				<h3>{getMessage("experience.servers.joinDebug.title")}</h3>
			</div>
			<ul className="debug-join-options">
				{!channelName && (
					<li className="debug-option server-id-option">
						<label className="small text">
							{getMessage("experience.servers.joinDebug.options.serverId")}
						</label>
						<TextInput
							value={serverId}
							onType={setServerId}
							placeholder={placeHolderServerId}
							disabled={loading}
						/>
						{isServerIdInvalid && (
							<div className="server-id-invalid-message text-error">
								{getMessage("experience.servers.joinDebug.errors.invalidServerId")}
							</div>
						)}
					</li>
				)}
				{!serverId && canViewDebugChannelName && (
					<li className="debug-option channel-name-option">
						<label className="small text">
							{getMessage("experience.servers.joinDebug.options.channelName")}
						</label>
						<TextInput
							value={channelName}
							onType={setChannelName}
							placeholder={TEST_RCC_CHANNEL_NAME}
							disabled={loading}
						/>
						{isChannelMismatch && (
							<div className="channel-Mismatch-message text-error">
								{getMessage("experience.servers.joinDebug.errors.channelMismatch")}
							</div>
						)}
					</li>
				)}
			</ul>
			{errorMessage && (
				<div className="get-data-error-message text-error">{errorMessage}</div>
			)}
			<div className="server-data-btns-container">
				<Button
					type="primary"
					className="get-server-data-debug-btn"
					disabled={loading || (!serverId && !channelName)}
					onClick={() => {
						setLoading(true);
						setServerData(undefined);
						if (serverId) {
							tryGetServerJoinData(
								getServerInstanceData,
								{
									placeId,
									gameId: serverId,
									overridePlatformType: deviceMeta?.platformType,
									joinOrigin: "RoSealFetchInfo",
									gameJoinAttemptId: crypto.randomUUID(),
								},
								100,
							)
								.then(setServerData)
								.finally(() => {
									setLoading(false);
								});
						} else {
							tryGetServerJoinData(
								getMatchmadeServerData,
								{
									placeId,
									channelName,
									overridePlatformType: deviceMeta?.platformType,
									joinOrigin: "RoSealFetchInfo",
									gameJoinAttemptId: crypto.randomUUID(),
								},
								100,
							)
								.then(setServerData)
								.finally(() => {
									setLoading(false);
								});
						}
					}}
				>
					{getMessage("experience.servers.joinDebug.buttons.getData")}
				</Button>
				{serverId && canManagePlace && (
					<Button
						type="alert"
						onClick={() => {
							shutdownExperienceServer({
								placeId,
								gameId: serverId,
							});
							setServerId("");
						}}
					>
						{getMessage("experience.servers.joinDebug.buttons.shutdown")}
					</Button>
				)}
			</div>
			{(serverData?.data || isInQueue) && (
				<div className="server-data-container">
					<div className="container-header">
						<h3>{getMessage("experience.servers.joinDebug.data.title")}</h3>
					</div>
					{serverData?.data && (
						<ul className="roseal-server-info">
							<li className="server-id-info server-info">
								<span className="info-label">
									{getMessage("experience.servers.joinDebug.data.serverId")}
								</span>
								<span className="info-text">
									{serverData?.data?.sessionInfo?.gameId}
								</span>
							</li>
							{dataCenter && (
								<li className="server-location-info server-info">
									<span className="info-label">
										{getMessage("experience.servers.joinDebug.data.location")}
									</span>
									<span className="info-icon">
										<CountryFlag code={dataCenter.location.country} />
									</span>
									<span className="info-text">
										{getLocalizedRegionName(dataCenter.location)}
									</span>
								</li>
							)}
							{serverData.data.rcc.placeVersion && (
								<li className="server-location-info server-info">
									<span className="info-label">
										{getMessage(
											"experience.servers.joinDebug.data.placeVersion",
										)}
									</span>
									<span className="info-text">
										{asLocaleString(serverData.data.rcc.placeVersion)}
									</span>
								</li>
							)}
							{serverData?.data?.rcc?.likelyCreatedByRobloxStaff && (
								<li className="server-created-by-staff-info server-info">
									<span className="info-label">
										{getMessage(
											"experience.servers.joinDebug.data.createdByStaff",
										)}
									</span>
									<span className="info-text">
										{getMessage(
											"experience.servers.joinDebug.data.createdByStaff.yes",
										)}
									</span>
								</li>
							)}
							{serverData?.data?.rcc?.channelName !==
								DEFAULT_RELEASE_CHANNEL_NAME && (
								<li className="server-channel-name-info server-info">
									<span className="info-label">
										{getMessage(
											"experience.servers.joinDebug.data.channelName",
										)}
									</span>
									<span className="info-text">
										{serverData.data.rcc.channelName}
									</span>
								</li>
							)}
							<li className="server-rcc-version-info server-info">
								<span className="info-label">
									{getMessage("experience.servers.joinDebug.data.rccVersion")}
								</span>
								<span className="info-text">{serverData.data.rcc.version}</span>
							</li>
						</ul>
					)}
					<div className="server-btns-container">
						{canJoinServer && (
							<Button
								type="growth"
								className="join-server-debug-btn"
								disabled={!canJoinServer || loading}
								onClick={() => {
									sendJoinGameInstance({
										placeId,
										gameId: serverData?.data?.sessionInfo?.gameId ?? serverId,
										joinAttemptOrigin: "PlayButton",
										joinAttemptId: crypto.randomUUID(),
									});
								}}
							>
								{serverData.queuePosition
									? getMessage(
											"experience.servers.joinDebug.buttons.joinWithQueue",
											{
												queueLength: asLocaleString(
													serverData.queuePosition,
												),
											},
										)
									: getMessage("experience.servers.joinDebug.buttons.join")}
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
