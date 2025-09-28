import { useEffect, useMemo, useState } from "preact/hooks";
import { DEFAULT_RELEASE_CHANNEL_NAME } from "src/ts/constants/misc";
import {
	FAST_SERVER_CONNECTION_KM_THRESHOLD,
	SLOW_SERVER_CONNECTION_KM_THRESHOLD,
	USER_CHANNEL_DATA_SESSION_CACHE_STORAGE_KEY,
} from "src/ts/constants/servers";
import { watchAttributes, watchOnce } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	getRobuxUpsellPackage,
	getUserRobuxAmount,
} from "src/ts/helpers/requests/services/account";
import { multigetLatestAssetsVersions } from "src/ts/helpers/requests/services/assets";
import { getRobloxDataCenters } from "src/ts/helpers/requests/services/roseal";
import {
	getClientVersion,
	getUserEnrollmentChannel,
} from "src/ts/helpers/requests/services/testService";
import { getTimedStorage } from "src/ts/helpers/storage";
import { getPlaceLauncherData } from "src/ts/utils/context";
import { crossSort } from "src/ts/utils/objects";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import useOnlineFriends from "../../hooks/useOnlineFriends";
import usePromise from "../../hooks/usePromise";
import ChannelVersionWarning from "./ChannelVersionWarning";
import JoinServerDebugPanel from "./JoinServerDebugPanel";
import PrivateServerLinkList from "./privateServerLinks/PrivateServerLinkList";
import ServerList from "./ServerList";
import {
	type RobloxGroupedDataCenterWithDistance,
	ServersTabContext,
	type ServersTabContextData,
} from "./ServersTabProvider";
import { getDistanceLatLong } from "./utils";

export type ServersTabContentProps = Omit<
	ServersTabContextData,
	| "dataCenters"
	| "userRobuxAmount"
	| "robuxUpsellPackage"
	| "productionVersion"
	| "userChannelVersion"
	| "userLatLong"
	| "setUserLatLong"
	| "thumbnailHashToPlayerTokens"
	| "excludeFullServersDefaultEnabled"
	| "tryGetServerInfoEnabled"
	| "pageSize"
	| "pagingType"
	| "setThumbnailHashToPlayerTokens"
	| "authenticatedUser"
	| "promptLocationPermission"
	| "setPromptLocationPermission"
	| "onlineFriends"
	| "preCreatePrivateServersEnabled"
	| "showServerLikelyBotted"
	| "regionFiltersEnabled"
	| "showServerDistance"
	| "showServerDebugInfo"
	| "showServerPerformanceEnabled"
	| "showServerUpdateDelayEnabled"
	| "showCopyGenerateLinkEnabled"
	| "showConnectionsInServerEnabled"
	| "showServerLocationEnabled"
	| "showServerShareLinkEnabled"
	| "showServerPlaceVersionEnabled"
	| "showServerExpiringDateEnabled"
	| "showServerConnectionSpeedEnabled"
	| "privateServerRowsEnabled"
	| "setCalculateServerDistance"
	| "preferredServerButtonEnabled"
>;

export default function ServersTabContent(data: ServersTabContentProps) {
	const [privateServerLinksEnabled] = useFeatureValue("privateServerLinksSection", false);
	const [excludeFullServersDefaultEnabled] = useFeatureValue(
		"improvedExperienceServersTab.excludeFullServersDefault",
		false,
	);
	const [tryGetServerInfoEnabled] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo",
		[false, "allServers"],
	);
	const [pagingType] = useFeatureValue("improvedExperienceServersTab.paginationType", "loadMore");
	const [pageSize] = useFeatureValue("improvedExperienceServersTab.paginationSize", 8);
	const [joinServerDebugEnabled] = useFeatureValue(
		"improvedExperienceServersTab.joinServerDebug",
		false,
	);
	const [calculateServerDistance, setCalculateServerDistance] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.calculateServerDistance",
		[true, "fromAPI"],
	);

	const [showServerDistance] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.showServerDistance",
		false,
	);
	const [showServerLikelyBotted] = useFeatureValue(
		"improvedExperienceServersTab.showServerLikelyBotted",
		false,
	);
	const [showServerDebugInfo] = useFeatureValue(
		"improvedExperienceServersTab.showDebugInfo",
		true,
	);
	const [showServerUpdateDelayEnabled] = useFeatureValue(
		"improvedExperienceServersTab.showServerUpdateDelay",
		false,
	);
	const [showServerPerformanceEnabled] = useFeatureValue(
		"improvedExperienceServersTab.showServerPerformance",
		false,
	);
	const [showServerPlaceVersionEnabled] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.showServerPlaceVersion",
		false,
	);
	const [showCopyGenerateLinkEnabled] = useFeatureValue(
		"improvedExperienceServersTab.showCopyGenerateLink",
		false,
	);
	const [showServerExpiringDateEnabled] = useFeatureValue(
		"improvedExperienceServersTab.showExpiringDate",
		false,
	);
	const [showServerShareLinkEnabled] = useFeatureValue(
		"improvedExperienceServersTab.showShareLink",
		false,
	);
	const [showConnectionsInServerEnabled] = useFeatureValue(
		"improvedExperienceServersTab.showConnectionsInServer",
		false,
	);
	const [showServerLocationEnabled] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.showServerLocation",
		false,
	);
	const [showServerConnectionSpeedEnabled] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.showServerConnectionSpeed",
		false,
	);
	const [regionFiltersEnabled] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.regionFilters",
		false,
	);
	const [preCreatePrivateServersEnabled] = useFeatureValue(
		"precreateExperiencePrivateServers",
		false,
	);
	const [privateServerRowsEnabled] = useFeatureValue(
		"improvedExperienceServersTab.privateServerRows",
		false,
	);
	const [preferredServerButtonEnabled] = useFeatureValue(
		"improvedExperienceServersTab.tryGetServerInfo.preferredServerButton",
		false,
	);

	const [promptLocationPermission, setPromptLocationPermission] = useState(false);

	const [onlineFriends] = useOnlineFriends();
	const [authenticatedUser] = useAuthenticatedUser();
	const [dataCentersWithoutDistance] = usePromise(getRobloxDataCenters, []);
	const [channelData] = usePromise(
		() =>
			authenticatedUser &&
			getTimedStorage(
				USER_CHANNEL_DATA_SESSION_CACHE_STORAGE_KEY,
				"session",
				600_000,
				async () => {
					const deviceMeta = await getPlaceLauncherData();
					const binaryType = deviceMeta?.osName === "OSX" ? "MacPlayer" : "WindowsPlayer";

					const [liveVersion, userChannelVersion] = await Promise.all([
						getClientVersion({
							binaryType,
						}).then((data) => {
							return Number.parseInt(data.version.split(".")[1], 10);
						}),
						getUserEnrollmentChannel({
							binaryType,
						}).then((data) => {
							if (data.channelName.toLowerCase() === DEFAULT_RELEASE_CHANNEL_NAME)
								return;

							return getClientVersion({
								binaryType,
								channelName: data.channelName,
								channelToken: data.token,
							}).then((data) => {
								return Number.parseInt(data.version.split(".")[1], 10);
							});
						}),
					]);

					return [liveVersion, userChannelVersion ?? liveVersion];
				},
				authenticatedUser.userId,
			),
		[authenticatedUser?.userId],
	);
	const [latestPlaceVersion] = usePromise(
		() =>
			multigetLatestAssetsVersions({
				assetIds: [data.placeId],
				versionStatus: "Published",
			}).then((data) => data.results[0].versionNumber),
		[],
	);
	const [robuxAndPackage] = usePromise(async () => {
		if (!data.privateServerPrice) return;

		const { robux } = await getUserRobuxAmount();
		if (robux >= data.privateServerPrice) return [robux, undefined] as const;

		try {
			const robuxPackage = await getRobuxUpsellPackage({
				attemptRobuxAmount: data.privateServerPrice,
				upsellPlatform: "WEB",
				userRobuxBalance: robux,
			});

			return [robux, robuxPackage] as const;
		} catch {
			return [robux, undefined] as const;
		}
	}, [data.privateServerPrice]);

	const [userLatLong, setUserLatLong] = useState<[number, number] | undefined>(undefined);
	const dataCenters = useMemo(() => {
		if (!dataCentersWithoutDistance) return;

		if (!userLatLong) return dataCentersWithoutDistance;

		const sorted = dataCentersWithoutDistance.map((datacenter) => {
			const distance = getDistanceLatLong(userLatLong, datacenter.location.latLong);
			return {
				...datacenter,
				distance,
				speed:
					distance <= FAST_SERVER_CONNECTION_KM_THRESHOLD
						? "fast"
						: distance > SLOW_SERVER_CONNECTION_KM_THRESHOLD
							? "slow"
							: "average",
			};
		}) as RobloxGroupedDataCenterWithDistance[];
		crossSort(sorted, (a, b) => a.distance! - b.distance!);

		const fastest = sorted[0].distance!;
		const slowest = sorted[sorted.length - 1].distance!;
		for (const item of sorted) {
			if (item.distance === fastest) {
				item.speed = "fastest";
			} else if (item.distance === slowest) {
				item.speed = "slowest";
			}
		}

		return sorted;
	}, [dataCentersWithoutDistance, userLatLong]);

	const [thumbnailHashToPlayerTokens, setThumbnailHashToPlayerTokens] = useState<
		Record<string, Set<string>>
	>({});

	const [hasSeenTab, setHasSeenTab] = useState(false);

	useEffect(() => {
		watchOnce("#tab-game-instances").then((el) => {
			if (el.classList.contains("active")) return setHasSeenTab(true);

			return watchAttributes(
				el,
				(_, __, ___, ____, kill) => {
					if (el.classList.contains("active")) {
						kill?.();
						return setHasSeenTab(true);
					}
				},
				["class"],
			);
		});
	}, []);

	useEffect(() => {
		if (data.activatePreferredServer.value) {
			setHasSeenTab(true);
		}
	}, [data.activatePreferredServer.value]);

	useEffect(() => {
		setPromptLocationPermission(false);

		if (!calculateServerDistance?.[0] || calculateServerDistance?.[1] !== "fromGeolocation")
			return;

		navigator.permissions
			.query({
				name: "geolocation",
			})
			.then((permission) => {
				setPromptLocationPermission(permission.state === "prompt");
				if (permission.state === "granted") {
					navigator.geolocation.getCurrentPosition((position) => {
						setUserLatLong([position.coords.latitude, position.coords.longitude]);
					});
				}
			});
	}, [calculateServerDistance]);

	return (
		<ServersTabContext.Provider
			value={{
				...data,
				dataCenters: dataCenters ?? undefined,
				userRobuxAmount: robuxAndPackage?.[0],
				robuxUpsellPackage: robuxAndPackage?.[1],
				productionVersion: channelData?.[0],
				userChannelVersion: channelData?.[1],
				userLatLong,
				thumbnailHashToPlayerTokens,
				excludeFullServersDefaultEnabled: excludeFullServersDefaultEnabled === true,
				tryGetServerInfoEnabled:
					tryGetServerInfoEnabled?.[0] === true && tryGetServerInfoEnabled[1],
				pagingType: pagingType || "loadMore",
				pageSize: pageSize || 8,
				authenticatedUser,
				promptLocationPermission,
				onlineFriends,
				latestPlaceVersion: latestPlaceVersion ?? undefined,
				preCreatePrivateServersEnabled: preCreatePrivateServersEnabled === true,
				regionFiltersEnabled: regionFiltersEnabled === true,
				showServerDebugInfo: showServerDebugInfo === true,
				showServerDistance: showServerDistance === true,
				showServerLikelyBotted: showServerLikelyBotted === true,
				showServerUpdateDelayEnabled: showServerUpdateDelayEnabled === true,
				showServerPerformanceEnabled: showServerPerformanceEnabled === true,
				showServerPlaceVersionEnabled: showServerPlaceVersionEnabled === true,
				showCopyGenerateLinkEnabled: showCopyGenerateLinkEnabled === true,
				showServerExpiringDateEnabled: showServerExpiringDateEnabled === true,
				showServerShareLinkEnabled: showServerShareLinkEnabled === true,
				showConnectionsInServerEnabled: showConnectionsInServerEnabled === true,
				showServerLocationEnabled: showServerLocationEnabled === true,
				showServerConnectionSpeedEnabled: showServerConnectionSpeedEnabled === true,
				privateServerRowsEnabled: privateServerRowsEnabled === true,
				preferredServerButtonEnabled: preferredServerButtonEnabled === true,
				setCalculateServerDistance,
				setPromptLocationPermission,
				setUserLatLong: (latLong) => {
					if (!calculateServerDistance?.[0]) return;

					setUserLatLong(latLong);
				},
				setThumbnailHashToPlayerTokens,
			}}
		>
			{hasSeenTab && (
				<div id="roseal-running-game-instances-container">
					{authenticatedUser ? (
						<>
							<ChannelVersionWarning />
							{joinServerDebugEnabled && <JoinServerDebugPanel />}
							<ServerList
								type="private"
								id="rbx-private-servers"
								innerId="rbx-private-running-games"
							/>
							{privateServerLinksEnabled &&
								(data.canCreatePrivateServer || data.canPreCreatePrivateServer) && (
									<PrivateServerLinkList
										universeId={data.universeId}
										placeId={data.placeId}
										placeName={data.universeName}
										startLinkCode={data.privateServerLinkCode}
									/>
								)}
							<ServerList type="friends" id="rbx-friends-running-games" />
							<ServerList type="public" id="rbx-public-running-games" />
						</>
					) : (
						<div className="col-xs-12 section-content-off">
							{getMessage("experience.servers.loginToView")}
						</div>
					)}
				</div>
			)}
		</ServersTabContext.Provider>
	);
}
