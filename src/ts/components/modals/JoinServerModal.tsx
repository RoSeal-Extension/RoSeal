import MdOutlineHistory from "@material-symbols/svg-400/outlined/history-fill.svg";
import MdOutlineProgressActivity from "@material-symbols/svg-400/outlined/progress_activity-fill.svg";
import MdOutlineTVRemote from "@material-symbols/svg-400/outlined/tv_remote-fill.svg";
import MdOutlineComputer from "@material-symbols/svg-400/outlined/computer-fill.svg";
import MdOutlineCloud from "@material-symbols/svg-400/outlined/cloud-fill.svg";
import { type Signal, useSignal } from "@preact/signals";
import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import { DEFAULT_RELEASE_CHANNEL_NAME } from "src/ts/constants/misc";
import { getMessage, getMessageKeysWithPrefix } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { onNotificationType } from "src/ts/helpers/notifications";
import { profileProcessor } from "src/ts/helpers/processors/profileProcessor";
import {
	getMatchmadeServerData,
	getPrivateServerData,
	getServerInstanceData,
} from "src/ts/helpers/requests/services/join";
import { multigetPlacesByIds } from "src/ts/helpers/requests/services/places";
import { getRobloxDataCenters } from "src/ts/helpers/requests/services/roseal";
import { getRobloxCDNUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getDeviceMeta, getPlaceLauncherData } from "src/ts/utils/context";
import {
	buildRobloxDeeplinkProtocolUrl,
	buildRobloxProtocolUrl,
	type CurrentServerJoinMetadata,
} from "src/ts/utils/gameLauncher";
import { getFollowUserJoinData, tryGetServerJoinData } from "src/ts/utils/joinData";
import { getDownloadClientLink, getExperienceLink } from "src/ts/utils/links";
import { sleep } from "src/ts/utils/misc";
import Button from "../core/Button";
import CountryFlag from "../core/CountryFlag";
import AgentMentionContainer from "../core/items/AgentMentionContainer";
import SimpleModal from "../core/modal/SimpleModal";
import Thumbnail from "../core/Thumbnail";
import { getLocalizedRegionName } from "../experience/servers/utils";
import useFeatureValue from "../hooks/useFeatureValue";
import usePromise from "../hooks/usePromise";
import { randomArrItem } from "src/ts/utils/random";

export type JoinServerModalProps = {
	data: Signal<CurrentServerJoinMetadata | undefined | null>;
	resolveOnJoin: Signal<(() => void) | undefined>;
};

export default function JoinServerModal({ data, resolveOnJoin }: JoinServerModalProps) {
	const [shouldGetMatchmadeServer] = useFeatureValue(
		"improvedServerJoinModal.tryGetMatchmadeServer",
		false,
	);
	const [shouldShowClientChannelName] = useFeatureValue(
		"improvedServerJoinModal.showChannelName",
		true,
	);
	const [shouldDelayJoin] = useFeatureValue("improvedServerJoinModal.delayServerJoin", false);
	const [shouldShowRCCServerInfo] = useFeatureValue(
		"improvedServerJoinModal.showRCCServerInfo",
		false,
	);
	const [shouldAlwaysUseDeepLinkProtocol] = useFeatureValue(
		"improvedServerJoinModal.useDeepLinkProtocol",
		false,
	);
	const [shouldShowSillyText] = useFeatureValue("improvedServerJoinModal.sillyText", false);
	const [sillyTextCustomParticiple] = useFeatureValue(
		"improvedServerJoinModal.sillyText.customParticiple",
		[false, ""],
	);
	const [sillyTextCustomModifier] = useFeatureValue(
		"improvedServerJoinModal.sillyText.customModifier",
		[false, ""],
	);
	const [sillyTextCustomSubject] = useFeatureValue(
		"improvedServerJoinModal.sillyText.customSubject",
		[false, ""],
	);

	const [showDownload, setShowDownload] = useState(false);
	const [showDownloadInstructions, setShowDownloadInstructions] = useState(false);
	const [hasAuthenticationError, setHasAuthenticationError] = useState(false);
	const showModal = useSignal(false);
	const hasJoinedServer = useSignal(false);

	const [placeLauncherData] = usePromise(getPlaceLauncherData);
	const [deviceMeta] = usePromise(getDeviceMeta);
	const [joinData, joinDataFetched] = usePromise(() => {
		if (!data.value || !deviceMeta) return;

		switch (data.value.type) {
			case "playWithUser": {
				return getFollowUserJoinData({
					userIdToFollow: data.value.userId,
					gameJoinAttemptId: crypto.randomUUID(),
					joinOrigin: "RoSealFetchInfo",
					overridePlatformType: deviceMeta?.platformType,
				});
			}
			case "privateServer": {
				return tryGetServerJoinData(getPrivateServerData, {
					placeId: data.value.placeId,
					linkCode: data.value.linkCode,
					accessCode: data.value.accessCode,
					gameJoinAttemptId: crypto.randomUUID(),
					joinOrigin: "RoSealFetchInfo",
					overridePlatformType: deviceMeta.platformType,
				});
			}
			case "specific": {
				return tryGetServerJoinData(getServerInstanceData, {
					placeId: data.value.placeId,
					gameId: data.value.gameId,
					gameJoinAttemptId: crypto.randomUUID(),
					joinOrigin: "RoSealFetchInfo",
					overridePlatformType: deviceMeta.platformType,
				});
			}
			case "matchmade": {
				if (shouldGetMatchmadeServer)
					return tryGetServerJoinData(getMatchmadeServerData, {
						placeId: data.value.placeId,
						gameJoinAttemptId: crypto.randomUUID(),
						joinOrigin: "RoSealFetchInfo",
						overridePlatformType: deviceMeta.platformType,
					});
			}
		}
	}, [data.value, deviceMeta?.platformType, shouldGetMatchmadeServer]);
	const [dataCenter] = usePromise(async () => {
		const dataCenterId = joinData?.data?.datacenter.id;
		if (!dataCenterId) return;

		const dataCenters = await getRobloxDataCenters();
		for (const dataCenter of dataCenters) {
			if (dataCenter.dataCenterIds.includes(dataCenterId)) {
				return dataCenter;
			}
		}
	}, [joinData?.data?.datacenter.id]);
	const [privateServerOwner] = usePromise(() => {
		const userId = joinData?.data?.privateServer?.ownerUserId;
		if (!userId) return;

		return profileProcessor.request({
			userId,
		});
	}, [joinData?.data?.privateServer?.ownerUserId]);

	const experiencePlaceId =
		joinData?.data?.sessionInfo.placeId ??
		(data.value && "placeId" in data.value ? data.value.placeId : undefined);
	const [placeDetails] = usePromise(() => {
		if (experiencePlaceId)
			return multigetPlacesByIds({
				placeIds: [experiencePlaceId],
			}).then((data) => data[0]);
	}, [experiencePlaceId]);
	const sillyTextVariables = useMemo(() => {
		if (!shouldShowSillyText) return;

		const participles: string[] = [];
		const subjects: string[] = [];
		const modifiers: string[] = [];

		if (sillyTextCustomParticiple?.[0] && sillyTextCustomParticiple[1]) {
			for (const item of sillyTextCustomParticiple[1].split(";")) {
				participles.push(item);
			}
		}

		if (sillyTextCustomModifier?.[0] && sillyTextCustomModifier[1]) {
			for (const item of sillyTextCustomModifier[1].split(";")) {
				modifiers.push(item);
			}
		}

		if (sillyTextCustomSubject?.[0] && sillyTextCustomSubject[1]) {
			for (const item of sillyTextCustomSubject[1].split(";")) {
				subjects.push(item);
			}
		}

		for (const key of getMessageKeysWithPrefix("joinModal.startup.sillyText.")) {
			const data = key.split(".");
			const type = data.at(-2)!;

			switch (type) {
				case "participle": {
					if (!sillyTextCustomParticiple?.[0]) participles.push(getMessage(key));
					break;
				}
				case "modifier": {
					if (!sillyTextCustomModifier?.[0]) modifiers.push(getMessage(key));
					break;
				}
				case "subject": {
					if (!sillyTextCustomSubject?.[0]) subjects.push(getMessage(key));
					break;
				}
			}
		}

		return { participles, subjects, modifiers };
	}, [
		shouldShowSillyText,
		sillyTextCustomParticiple?.[0],
		sillyTextCustomParticiple?.[1],
		sillyTextCustomModifier?.[0],
		sillyTextCustomModifier?.[1],
		sillyTextCustomSubject?.[0],
		sillyTextCustomSubject?.[1],
	]);
	const [sillyText, setSillyText] = useState<string>();

	useEffect(() => {
		if (
			showDownload ||
			showDownloadInstructions ||
			hasJoinedServer.value ||
			!shouldShowSillyText ||
			!sillyTextVariables ||
			data.value === undefined
		)
			return setSillyText(undefined);

		const makeSillyText = () =>
			setSillyText(
				`${randomArrItem(sillyTextVariables.participles)} ${randomArrItem(sillyTextVariables.modifiers)} ${randomArrItem(sillyTextVariables.subjects)}`,
			);
		makeSillyText();

		const interval = setInterval(makeSillyText, 1_500);

		return () => clearInterval(interval);
	}, [
		showDownload,
		showDownloadInstructions,
		hasJoinedServer.value,
		sillyTextVariables,
		data.value,
	]);

	useEffect(() => {
		setShowDownload(false);
		setShowDownloadInstructions(false);
		hasJoinedServer.value = false;
		setHasAuthenticationError(false);

		showModal.value = data.value !== undefined;
	}, [data.value]);

	useEffect(() => {
		if (!data.value) return;

		const handleJoin = async (data: CurrentServerJoinMetadata) => {
			if (shouldAlwaysUseDeepLinkProtocol) {
				if (shouldDelayJoin) {
					await sleep(3_000);
				}

				if (!showModal.value || cancelled) return resolveOnJoin.value?.();
				location.href = buildRobloxDeeplinkProtocolUrl(data)!;
				resolveOnJoin.value?.();

				return;
			}

			buildRobloxProtocolUrl(data)
				.then(async (url) => {
					if (shouldDelayJoin) {
						await sleep(3_000);
					}
					if (!showModal.value || cancelled) return resolveOnJoin.value?.();
					location.href = url;
					resolveOnJoin.value?.();
				})
				.catch(async () => {
					if (shouldDelayJoin) {
						await sleep(3_000);
					}

					if (!showModal.value || cancelled) return resolveOnJoin.value?.();
					location.href = buildRobloxDeeplinkProtocolUrl(data)!;
					resolveOnJoin.value?.();
				});
		};

		let hasHandled = false;
		let cancelled = false;
		if (shouldGetMatchmadeServer && data.value.type === "matchmade") {
			if (!joinDataFetched) return;

			const gameId = joinData?.data?.sessionInfo.gameId;
			if (gameId) {
				handleJoin({
					...data.value,
					type: "specific",
					gameId,
				});

				hasHandled = true;
			}
		}

		if (!hasHandled) handleJoin(data.value);

		const timeout = setTimeout(
			() => {
				if (!hasJoinedServer.value) {
					setShowDownload(true);
				}
			},
			shouldDelayJoin ? 8_000 : 5_000,
		);

		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	}, [
		data.value?.type === "matchmade" && shouldGetMatchmadeServer && joinData,
		data.value?.type === "matchmade" && shouldGetMatchmadeServer && joinDataFetched,
		data.value,
	]);

	useEffect(
		() =>
			onNotificationType("GameCloseNotifications", (data) => {
				if (data.Type === "Close") {
					hasJoinedServer.value = true;
				}
			}),
		[],
	);

	const onClose = useCallback(() => {
		showModal.value = false;
	}, []);

	const onDownloadBtnClick = useCallback(() => {
		if (!showDownload) return;

		setShowDownloadInstructions(true);
	}, [showDownload]);

	const onRetryJoinBtnClick = useCallback(() => {
		if (data.value)
			data.value = {
				...data.value,
			};
	}, [data]);

	const joinedServerType = useMemo(() => {
		if (
			joinData?.data?.joinType === "Specific_PrivateGame" ||
			data.value?.type === "privateServer"
		) {
			return "privateServer";
		}

		if (joinData?.data?.joinType === "MatchMade" && data.value?.type === "playWithUser") {
			return "restrictedServer";
		}

		if (data.value?.type === "matchmade") {
			return "matchmade";
		}

		return "specific";
	}, [joinData?.data?.joinType, data.value?.type]);

	const dataServerInfo = useMemo(() => {
		if (joinData?.data)
			return JSON.stringify({
				...joinData.data,
				sessionInfo: {
					...joinData.data.sessionInfo,
					playtime: undefined,
					userLatLong: undefined,
				},
			});
	}, [joinData?.data]);

	const dataJoinInfo = useMemo(() => {
		if (data.value) return JSON.stringify(data.value);
	}, [data.value]);

	const placeVersion = joinData?.data?.rcc.placeVersion;

	return (
		<SimpleModal
			show={showModal.value}
			size={showDownloadInstructions ? "lg" : "sm"}
			className={classNames("roseal-join-modal", {
				"is-instructions": showDownloadInstructions,
			})}
			data-join-type={data.value?.type}
			data-join-info={dataJoinInfo}
			data-server-info={dataServerInfo}
			onClose={onClose}
		>
			{showDownloadInstructions ? (
				<div className="install-instructions-container">
					<div className="thanks-container">
						<h2 className="thanks-header">
							{getMessage("joinModal.installInstructions.title")}
						</h2>
						<p className="thanks-text">
							{getMessage("joinModal.installInstructions.description", {
								restartLink: (contents: string) => (
									<a
										href={getDownloadClientLink()}
										className="text-underline"
										download
									>
										{contents}
									</a>
								),
							})}
						</p>
					</div>
					<div className="split-container">
						<div className="split-item">
							<h5 className="split-header">
								{getMessage("joinModal.installInstructions.section.title")}
							</h5>
							<ul className="split-list">
								<li className="split-list-item">
									{getMessage("joinModal.installInstructions.section.steps.1", {
										boldText: (contents: string) => <b>{contents}</b>,
										fileExtension:
											placeLauncherData?.osName === "OSX" ? ".dmg" : ".exe",
									})}
								</li>
								<li className="split-list-item">
									{getMessage("joinModal.installInstructions.section.steps.2", {
										boldText: (contents: string) => <b>{contents}</b>,
									})}
								</li>
								<li className="split-list-item">
									{getMessage("joinModal.installInstructions.section.steps.3")}
								</li>
								<li className="split-list-item">
									{getMessage("joinModal.installInstructions.section.steps.4", {
										joinButtonText: (contents: string) => (
											<button
												type="button"
												className="roseal-btn text-underline"
												onClick={onRetryJoinBtnClick}
											>
												{contents}
											</button>
										),
									})}
								</li>
							</ul>
						</div>
						<div className="split-item">
							<h5 className="split-header">
								{getMessage("joinModal.installInstructions.mobileSection.title")}
							</h5>
							<p className="split-text">
								{getMessage(
									"joinModal.installInstructions.mobileSection.description",
								)}
							</p>
							<div className="qr-code-container">
								<img
									className="qr-code"
									src={`https://${getRobloxCDNUrl("images", "/857bde3fc0a3d53af7a1967f8f9d74c2-install-app-qr-code.webp")}`}
									alt="QR"
								/>
							</div>
						</div>
					</div>
				</div>
			) : (
				<div className="startup-info-container">
					{joinData?.data && data.value && (
						<div className="server-info-container">
							<div className="game-card-container roseal-game-card-container">
								<a
									className="game-card-link"
									href={
										placeDetails
											? getExperienceLink(
													placeDetails.placeId,
													placeDetails.name,
												)
											: undefined
									}
								>
									<Thumbnail
										containerClassName="game-card-thumb-container"
										request={
											placeDetails
												? {
														type: "PlaceIcon",
														targetId: placeDetails.placeId,
														size: "256x256",
													}
												: null
										}
									/>
									<div
										className={classNames("game-card-name game-name-title", {
											"placeholder shimmer": !placeDetails,
										})}
									>
										{placeDetails?.name}
									</div>
								</a>
							</div>

							<div className="server-info">
								<ul className="server-info-stats">
									<li className="stat-item">
										<span className="stat-icon">
											<MdOutlineCloud className="roseal-icon" />
										</span>
										<span className="stat-text">
											{getMessage(
												`joinModal.serverInfo.title.${joinedServerType}`,
											)}
										</span>
									</li>
									{privateServerOwner && (
										<li className="stat-item private-server-owner">
											<span className="stat-text">
												{getMessage(
													"joinModal.serverInfo.privateServer.text",
												)}
											</span>
											<AgentMentionContainer
												targetType="User"
												targetId={privateServerOwner.userId}
												name={privateServerOwner.names.username}
												hasVerifiedBadge={privateServerOwner.isVerified}
											/>
										</li>
									)}
									{dataCenter && (
										<li className="stat-item">
											<span className="stat-icon">
												<CountryFlag
													code={dataCenter.location.country}
													className="roseal-icon"
												/>
											</span>
											<span className="stat-text">
												{getLocalizedRegionName(dataCenter.location)}
											</span>
										</li>
									)}
									{placeVersion !== undefined && (
										<li className="stat-item">
											<span className="stat-icon">
												<MdOutlineHistory className="roseal-icon" />
											</span>
											<span className="stat-text">
												{getMessage(
													"joinModal.serverInfo.placeVersion.text",
													{
														placeVersion: asLocaleString(placeVersion),
													},
												)}
											</span>
										</li>
									)}
									{joinData.data?.rcc.channelName &&
										joinData.data?.rcc.channelName !==
											DEFAULT_RELEASE_CHANNEL_NAME &&
										shouldShowRCCServerInfo && (
											<li className="stat-item">
												<span className="stat-icon">
													<MdOutlineTVRemote className="roseal-icon" />
												</span>
												<span className="stat-text">
													{getMessage(
														"joinModal.serverInfo.rccChannel.text",
														{
															channelName:
																joinData.data.rcc.channelName,
														},
													)}
												</span>
											</li>
										)}
									{joinData.data?.rcc.version && shouldShowRCCServerInfo && (
										<li className="stat-item">
											<li className="stat-item">
												<span className="stat-icon">
													<MdOutlineComputer className="roseal-icon" />
												</span>
												<span className="stat-text">
													{getMessage(
														"joinModal.serverInfo.rccVersion.text",
														{
															version: joinData.data.rcc.version,
														},
													)}
												</span>
											</li>
										</li>
									)}
								</ul>
							</div>
						</div>
					)}
					<div className="startup-container">
						<div className="text-container">
							<span className="app-icon-windows app-icon-bluebg" />
							<span className="startup-text">
								{sillyText ||
									getMessage(
										`joinModal.startup.text.${hasJoinedServer.value ? "loaded" : showDownload ? "download" : hasAuthenticationError ? "authError" : "loading"}`,
									)}
							</span>
						</div>
						{shouldShowClientChannelName &&
							placeLauncherData?.playerChannelName &&
							placeLauncherData.playerChannelName !== "LIVE" && (
								<span className="player-channel-name-text text xsmall text-center">
									{getMessage("joinModal.startup.clientChannel", {
										channelName: placeLauncherData.playerChannelName,
									})}
								</span>
							)}

						{!hasJoinedServer.value && (
							<div className="btns-container">
								<Button
									type="growth"
									width="full"
									className="startup-progress-container"
									as="a"
									href={showDownload ? getDownloadClientLink() : undefined}
									download
									onClick={onDownloadBtnClick}
								>
									{showDownload ? (
										getMessage("joinModal.startup.button.download")
									) : (
										<MdOutlineProgressActivity className="roseal-icon" />
									)}
								</Button>
							</div>
						)}
					</div>
				</div>
			)}
		</SimpleModal>
	);
}
