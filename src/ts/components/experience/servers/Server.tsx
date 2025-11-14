import MdOutlineCloudSync from "@material-symbols/svg-400/outlined/cloud_sync-fill.svg";
import MdOutlineDns from "@material-symbols/svg-400/outlined/dns-fill.svg";
import MdOutlineHistory from "@material-symbols/svg-400/outlined/history-fill.svg";
import MdOutlinePolyline from "@material-symbols/svg-400/outlined/polyline-fill.svg";
import MdOutlineRobot from "@material-symbols/svg-400/outlined/robot-fill.svg";
import MdOutlineSchedule from "@material-symbols/svg-400/outlined/schedule-fill.svg";
import classNames from "classnames";
import { differenceInDays } from "date-fns";
import type { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import Button from "src/ts/components/core/Button";
import CountryFlag from "src/ts/components/core/CountryFlag";
import Icon from "src/ts/components/core/Icon";
import ItemContextMenu from "src/ts/components/core/ItemContextMenu";
import {
	success,
	warning,
} from "src/ts/components/core/systemFeedback/helpers/globalSystemFeedback";
import Thumbnail from "src/ts/components/core/Thumbnail";
import usePromise from "src/ts/components/hooks/usePromise";
import VerifiedBadge from "src/ts/components/icons/VerifiedBadge";
import { DEFAULT_RELEASE_CHANNEL_NAME } from "src/ts/constants/misc";
import {
	MAX_PUBLIC_SERVER_PLAYER_THUMBNAILS,
	MAX_SERVER_FPS,
	SLOW_GAME_FPS_THRESHOLD,
} from "src/ts/constants/servers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	asLocaleString,
	distanceFormat,
	getShortRelativeTime,
} from "src/ts/helpers/i18n/intlFormats";
import { RESTError } from "src/ts/helpers/requests/main";
import {
	getPrivateServerData,
	JoinServerStatusCode,
	JoinServerStatusMessage,
} from "src/ts/helpers/requests/services/join";
import {
	getPrivateServerOwnerDetailsById,
	updatePrivateServer,
} from "src/ts/helpers/requests/services/privateServers";
import type { PrivateServerInventoryItem } from "src/ts/helpers/requests/services/inventory";
import { shutdownExperienceServer } from "src/ts/helpers/requests/services/universes";
import {
	sendFollowPlayerIntoGame,
	sendJoinGameInstance,
	sendJoinPrivateGame,
} from "src/ts/utils/gameLauncher";
import { tryGetServerJoinData } from "src/ts/utils/joinData";
import {
	getConfigurePrivateServerLink,
	getRoSealServerJoinLink,
	getUserProfileLink,
} from "src/ts/utils/links";
import AgentMentionContainer from "../../core/items/AgentMentionContainer";
import ServerPlayerThumbnail from "./PlayerThumbnail";
import CancelPrivateServerModal from "./privateServers/CancelPrivateServerModal";
import RenewPrivateServerModal from "./privateServers/RenewPrivateServerModal";
import type { ServerWithJoinData } from "./ServerList";
import { useServersTabContext } from "./ServersTabProvider";
import { getLocalizedRegionName } from "./utils";

export type ServerListType = "private" | "public" | "friends";

export type ServerProps = {
	item: ServerWithJoinData;
	cssKey: string;
	privateServerInventoryItem?: PrivateServerInventoryItem;
	isExperienceUnderLoad?: boolean;
	showRegion?: boolean;
	shouldUseStack?: boolean;
	setShowDeactivatePrivateServersList: (show: boolean) => void;
	setShowBuyRobuxPackage: (show: boolean) => void;
	refreshServerList: () => void;
};

export default function Server({
	item,
	cssKey,
	privateServerInventoryItem,
	isExperienceUnderLoad,
	showRegion,
	shouldUseStack,
	setShowDeactivatePrivateServersList,
	setShowBuyRobuxPackage,
	refreshServerList,
}: ServerProps) {
	const {
		canManagePlace,
		dataCenters,
		placeId,
		privateServerPrice,
		userRobuxAmount,
		userLatLong,
		thumbnailHashToPlayerTokens,
		authenticatedUser,
		onlineFriends,
		latestPlaceVersion,
		showServerDistance,
		showServerLikelyBotted,
		showServerDebugInfo,
		showServerUpdateDelayEnabled,
		showServerPerformanceEnabled,
		showServerPlaceVersionEnabled,
		showCopyGenerateLinkEnabled,
		showServerExpiringDateEnabled,
		showServerShareLinkEnabled,
		showConnectionsInServerEnabled,
		showServerLocationEnabled,
		showServerConnectionSpeedEnabled,
		setUserLatLong,
	} = useServersTabContext();

	const canManageServer = item.type === "private" && authenticatedUser?.userId === item.owner?.id;
	const canShutdownServer = canManageServer || canManagePlace;
	const canJoinServer = item.type !== "private" || item.accessCode !== undefined;
	const isServerOnline = item.id !== undefined;

	const [showRenewPrivateServerModal, setShowRenewPrivateServerModal] = useState(false);
	const [showCancelPrivateServerModal, setShowCancelPrivateServerModal] = useState(false);
	const [nonPrivateDebugStatType, setNonPrivateDebugStatType] = useState<
		"id" | "version" | "channelName"
	>("id");

	const [joinLink, setJoinLink] = useState<string>();

	const dataCenter = useMemo(() => {
		if (!dataCenters || !showRegion) return;

		for (const datacenter of dataCenters) {
			if (
				item.joinData?.data?.datacenter &&
				datacenter.dataCenterIds.includes(item.joinData?.data?.datacenter.id)
			) {
				return datacenter;
			}
		}
	}, [item.joinData?.data?.datacenter.id, dataCenters, showRegion, showServerLocationEnabled]);
	const [ownerDetails] = usePromise(() => {
		if (!canManageServer) return;

		return getPrivateServerOwnerDetailsById({
			privateServerId: item.vipServerId,
		});
	}, [item.type === "private" && item.vipServerId, canManageServer]);

	const playerThumbnails = useMemo(() => {
		const playerThumbnails: JSX.Element[] = [];

		for (const player of item.players) {
			playerThumbnails.push(
				<ServerPlayerThumbnail key={player.id} userId={player.id} username={player.name} />,
			);
		}

		for (const token of item.playerTokens) {
			if (!item.players.find((player) => player.playerToken === token)) {
				playerThumbnails.push(<ServerPlayerThumbnail key={token} playerToken={token} />);
			}
		}

		if (shouldUseStack) {
			playerThumbnails.splice(MAX_PUBLIC_SERVER_PLAYER_THUMBNAILS - 1);
		}

		const extraPlayers = (item.playing || 0) - playerThumbnails.length;
		if (extraPlayers) {
			playerThumbnails.push(
				<span className="avatar avatar-headshot-md player-avatar hidden-players-placeholder">
					{getMessage("plusNumber", {
						number: extraPlayers,
					})}
				</span>,
			);
		}

		return playerThumbnails;
	}, [item.players, item.playerTokens, shouldUseStack]);

	const isSubscriptionExpired = ownerDetails?.subscription.expired === true;
	const isExpiredDueToInsufficientFunds = ownerDetails?.subscription.hasInsufficientFunds;
	const isExpiredDueToPriceChange = ownerDetails?.subscription.hasPriceChanged;
	const isInactive = item.type === "private" && !item.accessCode;
	const isFreeServer = privateServerPrice === 0;

	const canClickServerDebugInfo = showServerDebugInfo !== "idOnly" && !shouldUseStack;

	const showExperienceUnderLoad =
		!isServerOnline && canJoinServer && item.type === "private" && isExperienceUnderLoad;

	const isChannelMismatch = item.joinData?.statusCode === JoinServerStatusCode.ChannelMismatch;
	const isBannedFromExperience = item.joinData?.statusCode === JoinServerStatusCode.UserBanned;
	const isSecretlyJoinablePrivateServer =
		item.type !== "private" && item.joinData?.data?.joinType === "Specific_PrivateGame";
	const isSecretlyPrivateServer =
		item.joinData?.status === JoinServerStatusMessage.CantJoinPrivateServer;
	const isSecretlyReservedServer =
		item.joinData?.status === JoinServerStatusMessage.CantJoinReservedServer;

	const isSecretlyRestrictedServer =
		item.joinData?.data !== undefined && item.joinData?.data?.sessionInfo?.gameId !== item.id;

	const privateServerRenewalData = useMemo(() => {
		if (isFreeServer || !showServerExpiringDateEnabled) return;

		const expirationDate =
			privateServerInventoryItem?.expirationDate ?? ownerDetails?.subscription.expirationDate;
		const isRenewalActive =
			privateServerInventoryItem?.willRenew ?? ownerDetails?.subscription.active;

		return {
			expirationDate,
			isRenewalActive,
			isExpiringSoon:
				!isRenewalActive && expirationDate
					? differenceInDays(expirationDate, new Date()) <= 3
					: false,
		};
	}, [privateServerInventoryItem, ownerDetails, item, showServerExpiringDateEnabled]);

	const isLikelyBotted = useMemo(() => {
		if (item.type === "private" || !showServerLikelyBotted) return false;

		let results = 0;
		for (const token of item.playerTokens) {
			for (const key in thumbnailHashToPlayerTokens) {
				const item = thumbnailHashToPlayerTokens[key];

				if (item?.has(token) && item.size >= 2) {
					results++;
					break;
				}
			}
		}

		return results >= Math.min(2, item.playing || 0);
	}, [
		item.type,
		thumbnailHashToPlayerTokens,
		item.playerTokens,
		item.players,
		showServerLikelyBotted,
	]);

	useEffect(() => {
		if (ownerDetails?.link) {
			setJoinLink(ownerDetails.link);
		}
	}, [ownerDetails?.link]);

	useEffect(() => {
		if (userLatLong || !item.joinData?.data?.sessionInfo?.userLatLong) return;

		return setUserLatLong(item.joinData.data.sessionInfo.userLatLong);
	}, [item.joinData?.data?.sessionInfo?.userLatLong]);

	const placeVersion = item.joinData?.data?.rcc.placeVersion;

	const shutdownServer = () => {
		if (!item.id) return;

		shutdownExperienceServer({
			placeId,
			gameId: item.id,
			privateServerId: canManageServer ? item.vipServerId : undefined,
		});
	};
	const joinServer = () => {
		const joinAttemptOrigin =
			`${item.type === "friends" ? "friend" : item.type}ServerListJoin` as const;
		const oneFriend = onlineFriends?.find((friend) => friend.gameId === item.id);

		if (item.type === "private") {
			if (!isServerOnline) {
				tryGetServerJoinData(
					getPrivateServerData,
					{
						placeId,
						accessCode: item.accessCode,
						joinOrigin: joinAttemptOrigin,
						gameJoinAttemptId: crypto.randomUUID(),
					},
					1,
				);
			}
			return sendJoinPrivateGame({
				placeId,
				accessCode: item.accessCode,
				joinAttemptOrigin,
				joinAttemptId: crypto.randomUUID(),
			});
		}

		if (
			item.type === "friends" &&
			item.joinData?.data?.joinType === "Specific_PrivateGame" &&
			oneFriend
		)
			return sendFollowPlayerIntoGame({
				userId: oneFriend.userId,
				joinAttemptOrigin,
				joinAttemptId: crypto.randomUUID(),
			});

		return sendJoinGameInstance({
			placeId,
			gameId: item.id,
			joinAttemptOrigin,
			joinAttemptId: crypto.randomUUID(),
		});
	};

	const copyLinkToClipboard = (publicLink?: boolean) => {
		let linkToCopy: string | undefined;
		if (item.type === "private") {
			if (publicLink) {
				if (!joinLink) return;

				linkToCopy = joinLink;
			} else {
				linkToCopy = getRoSealServerJoinLink({
					placeId: placeId.toString(),
					accessCode: item.accessCode,
				});
			}
		} else {
			linkToCopy = getRoSealServerJoinLink({
				placeId: placeId.toString(),
				gameInstanceId: item.id,
			});
		}

		if (!linkToCopy) return;

		navigator.clipboard
			.writeText(linkToCopy)
			.then(() => {
				success(getMessage("experience.servers.server.buttons.copyLink.success"));
			})
			.catch(() => {
				warning(getMessage("experience.servers.server.buttons.copyLink.error"));
			});
	};

	const buttons = useMemo(() => {
		const buttons: JSX.Element[] = [];

		if (
			(!privateServerRenewalData?.isRenewalActive && ownerDetails?.subscription.canRenew) ||
			(isFreeServer && isInactive)
		) {
			buttons.push(
				<Button
					type="control"
					size="xs"
					width="full"
					className={classNames(`${cssKey}-server-renew renew-server-btn`, {
						"is-online": isServerOnline,
					})}
					onClick={() => {
						if (item.type !== "private") return;

						if (isFreeServer) {
							return updatePrivateServer({
								privateServerId: item.vipServerId,
								active: true,
							})
								.then(refreshServerList)
								.catch((err) => {
									if (err instanceof RESTError) {
										if (err.errors?.[0].code === 31) {
											setShowDeactivatePrivateServersList(true);
										} else if (err.errors?.[0]?.userFacingMessage) {
											warning(err.errors[0].userFacingMessage);
										}
									}
								});
						}
						if (
							(userRobuxAmount ?? 0) < (privateServerPrice ?? 0) &&
							isSubscriptionExpired
						) {
							setShowBuyRobuxPackage(true);
						} else {
							setShowRenewPrivateServerModal(true);
						}
					}}
				>
					{getMessage(
						`experience.servers.server.buttons.${isFreeServer ? "reactivate" : "renew"}`,
					)}
				</Button>,
			);
		} else if (!canJoinServer && !isInactive) {
			buttons.push(
				<Button
					type="control"
					size="xs"
					width="full"
					className={`${cssKey}-server-cant-join server-cant-join-btn`}
					disabled
				>
					{getMessage("experience.servers.server.buttons.join.cantJoin")}
				</Button>,
			);
		}

		if (isChannelMismatch || isSecretlyPrivateServer || isSecretlyReservedServer) {
			if (canShutdownServer)
				buttons.push(
					<Button
						type="alert"
						size="xs"
						width="full"
						className={`${cssKey}-shutdown-server shutdown-server-btn`}
						onClick={shutdownServer}
					>
						{getMessage("experience.servers.server.buttons.shutdown")}
					</Button>,
				);
		} else if (canJoinServer) {
			if (!isBannedFromExperience && !showExperienceUnderLoad) {
				buttons.push(
					<Button
						type="control"
						size="xs"
						width="full"
						className={`${cssKey}-game-server-join game-server-join-btn`}
						onClick={joinServer}
						disabled={isExperienceUnderLoad !== false && item.type === "private"}
					>
						{isServerOnline
							? item.joinData?.queuePosition
								? getMessage("experience.servers.server.buttons.join.joinQueue", {
										queuePosition: item.joinData.queuePosition,
									})
								: isSecretlyRestrictedServer
									? getMessage(
											"experience.servers.server.buttons.join.restrictedServer",
										)
									: isSecretlyJoinablePrivateServer
										? getMessage(
												"experience.servers.server.buttons.join.privateServer",
											)
										: getMessage("experience.servers.server.buttons.join")
							: getMessage("experience.servers.server.buttons.join.start")}
					</Button>,
				);
			}

			if (
				item.type !== "private" &&
				!isSecretlyJoinablePrivateServer &&
				showServerShareLinkEnabled
			)
				buttons.push(
					<Button
						type="control"
						size="xs"
						width="full"
						className={`${cssKey}-game-server-copy-link copy-server-link-btn`}
						onClick={() => copyLinkToClipboard(true)}
					>
						{getMessage("experience.servers.server.buttons.share")}
					</Button>,
				);
		}

		if (canManageServer && !isInactive && showCopyGenerateLinkEnabled) {
			buttons.push(
				<Button
					type="control"
					size="xs"
					width="full"
					className={`${cssKey}-game-server-copy-link copy-server-link-btn`}
					disabled={!joinLink}
					onClick={() => copyLinkToClipboard(true)}
				>
					{getMessage("experience.servers.server.buttons.copyLink")}
				</Button>,
			);
			buttons.push(
				<Button
					type="control"
					size="xs"
					width="full"
					className={`${cssKey}-game-server-regenerate-link regenerate-server-link-btn`}
					onClick={() => {
						updatePrivateServer({
							privateServerId: item.vipServerId,
							newJoinCode: true,
						})
							.then((data) => {
								setJoinLink(data.link!);
							})
							.catch((err) => {
								if (
									err instanceof RESTError &&
									err?.errors?.[0].userFacingMessage
								) {
									return warning(err.errors[0].userFacingMessage);
								}
							});
					}}
				>
					{getMessage(
						`experience.servers.server.buttons.${joinLink ? "regenerate" : "generate"}Link`,
					)}
				</Button>,
			);
		}

		return buttons;
	}, [
		isInactive,
		canJoinServer,
		joinLink,
		showCopyGenerateLinkEnabled,
		showServerShareLinkEnabled,
		showExperienceUnderLoad,
		isSubscriptionExpired,
		isServerOnline,
		ownerDetails,
		item.joinData,
	]);

	const connectionSpeed = showServerConnectionSpeedEnabled &&
		dataCenter?.speed !== undefined &&
		dataCenter?.speed !== "average" && (
			<div
				className={`${cssKey}-game-server-connection-speed-container server-connection-speed-container server-connection-speed-${dataCenter.speed}-container`}
			>
				<span
					className={`${cssKey}-game-server-connection-speed server-connection-speed server-connection-speed-${dataCenter.speed}`}
				>
					{getMessage(`experience.servers.server.connection.${dataCenter.speed}`)}
				</span>
			</div>
		);

	const serverStats = isServerOnline && (
		<div className="roseal-server-info">
			{item.ping !== undefined && showServerUpdateDelayEnabled && (
				<div className="server-ping-info server-info">
					<span className="info-icon">
						<MdOutlineCloudSync className="roseal-icon" />
					</span>
					<span className="info-text">
						{getMessage("experience.servers.server.stats.updateDelay", {
							timeInMs: asLocaleString(item.ping),
						})}
					</span>
				</div>
			)}
			{item.fps !== undefined && showServerPerformanceEnabled && (
				<div
					className={classNames("server-performance-info server-info", {
						"red-warning": item.fps < SLOW_GAME_FPS_THRESHOLD,
					})}
				>
					<span className="info-icon">
						<MdOutlineDns className="roseal-icon" />
					</span>
					<span className="info-text">
						{getMessage("experience.servers.server.stats.serverPerformance", {
							speed: asLocaleString(
								Math.min(item.fps, MAX_SERVER_FPS) / MAX_SERVER_FPS,
								{
									style: "percent",
									maximumFractionDigits: 0,
								},
							),
						})}
					</span>
				</div>
			)}
			{placeVersion !== undefined && showServerPlaceVersionEnabled && (
				<div className="server-version-info server-info">
					<span className="info-icon">
						<MdOutlineHistory className="roseal-icon" />
					</span>
					<span className="info-text">
						{latestPlaceVersion === placeVersion
							? getMessage("experience.servers.server.stats.placeVersion.latest")
							: getMessage("experience.servers.server.stats.placeVersion", {
									placeVersion: asLocaleString(placeVersion),
								})}
					</span>
				</div>
			)}
			{dataCenter && showServerLocationEnabled && (
				<div className="server-region-info server-info" key={dataCenter.location}>
					<span className="info-icon">
						<CountryFlag code={dataCenter.location.country} />
					</span>
					<span className="info-text">{getLocalizedRegionName(dataCenter.location)}</span>
				</div>
			)}
			{showServerDistance && dataCenter?.distance !== undefined && (
				<div className="server-distance-info server-info">
					<span className="info-icon">
						<MdOutlinePolyline className="roseal-icon" />
					</span>
					<span className="info-text">
						{getMessage("experience.servers.server.stats.distance", {
							distance: distanceFormat.format(dataCenter.distance),
						})}
					</span>
				</div>
			)}
		</div>
	);

	const serverStatuses = (
		<>
			{showExperienceUnderLoad && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-under-load`}
				>
					<Icon name="remove" />
					<span className="alert-text">
						{getMessage("experience.servers.server.status.underLoad")}
					</span>
				</div>
			)}
			{privateServerRenewalData?.isRenewalActive === false && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-renewal-cancelled rbx-private-server-subscription-alert`}
				>
					<span className="alert-text rbx-private-server-subscription-alert-text">
						{getMessage("experience.servers.server.status.renewCancelled")}
					</span>
				</div>
			)}
			{isChannelMismatch && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-channel-mismatch`}
				>
					<Icon name="remove" />
					<span className="alert-text">
						{getMessage(
							`experience.servers.server.status.${item.type === "private" ? "mustShutdown" : "cantJoin"}`,
						)}
					</span>
				</div>
			)}
			{isSecretlyPrivateServer && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-private-server`}
				>
					<Icon name="remove" />
					<span className="alert-text">
						{getMessage("experience.servers.server.status.cantJoinPrivateServer")}
					</span>
				</div>
			)}
			{isSecretlyReservedServer && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-reserved-server`}
				>
					<Icon name="remove" />
					<span className="alert-text">
						{getMessage("experience.servers.server.status.cantJoinReservedServer")}
					</span>
				</div>
			)}
			{isExpiredDueToInsufficientFunds && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-insufficient-funds rbx-private-server-insufficient-funds`}
				>
					<Icon name="remove" />
					<span className="alert-text">
						{getMessage(
							"experience.servers.server.status.renewCancelledInsufficientFunds",
						)}
					</span>
				</div>
			)}
			{isExpiredDueToPriceChange && (
				<div
					className={`${cssKey}-server-alert text-alert roseal-status-alert alert-price-changed`}
				>
					<Icon name="remove" />
					<span className="alert-text">
						{getMessage("experience.servers.server.status.renewCancelledPriceChanged")}
					</span>
				</div>
			)}
			{!isSubscriptionExpired && privateServerRenewalData?.expirationDate && (
				<div
					className={classNames(
						`${cssKey}-server-alert renewal-expiration-warning `,
						privateServerRenewalData.isRenewalActive
							? "alert-renewal-upcoming"
							: "alert-expiration-upcoming",
						{
							text: !privateServerRenewalData?.isExpiringSoon,
							"text-alert roseal-status-alert alert-expiring-soon":
								privateServerRenewalData?.isExpiringSoon &&
								(!!ownerDetails || !privateServerRenewalData.isRenewalActive),
						},
					)}
				>
					<MdOutlineSchedule className="roseal-icon" />
					<span className="alert-text">
						{getMessage(
							`experience.servers.server.status.${privateServerRenewalData.isRenewalActive ? "renewing" : "expiring"}`,
							{
								timeLeft: getShortRelativeTime(
									privateServerRenewalData.expirationDate,
								),
							},
						)}
					</span>
				</div>
			)}
			{isInactive && !isExpiredDueToInsufficientFunds && !isExpiredDueToPriceChange && (
				<div
					className={`${cssKey}-server-alert roseal-status-alert alert-inactive-server rbx-private-server-inactive`}
				>
					<Icon name="turn-off" />
					<span className="alert-text">
						{getMessage("experience.servers.server.status.inactiveServer")}
					</span>
				</div>
			)}
		</>
	);

	const friendsInServerText = showConnectionsInServerEnabled &&
		item.players &&
		item.players.length !== 0 && (
			<div className="text friends-in-server-label">
				{getMessage("experience.servers.server.friendsInServer", {
					friends: item.players.map((player, index) => (
						<>
							<a
								key={player.id}
								className="text-name"
								href={getUserProfileLink(player.id)}
							>
								{player.displayName}
							</a>
							{index < item.players.length - 1 && ", "}
						</>
					)),
				})}
			</div>
		);

	const serverOwner = item.type === "private" && (
		<div
			className={classNames(`${cssKey}-owner rbx-server-owner`, {
				"adjust-height": shouldUseStack && !isServerOnline,
			})}
		>
			{shouldUseStack && isServerOnline ? (
				<AgentMentionContainer
					targetType="User"
					targetId={item.owner.id}
					hasVerifiedBadge={item.owner.hasVerifiedBadge}
					name={item.owner.displayName}
				/>
			) : (
				<>
					<a
						href={getUserProfileLink(item.owner.id)}
						className="avatar avatar-card-fullbody owner-avatar"
					>
						<Thumbnail
							containerClassName="avatar-card-image"
							request={{
								type: "AvatarHeadShot",
								targetId: item.owner.id,
								size: "150x150",
							}}
						/>
					</a>
					<a href={getUserProfileLink(item.owner.id)} className="text-name text-overflow">
						<span>{item.owner.displayName}</span>
						{item.owner.hasVerifiedBadge && (
							<VerifiedBadge
								width={16}
								height={16}
								className="owner-verified-badge"
							/>
						)}
					</a>
				</>
			)}
		</div>
	);

	const headerAndServerOwner = (
		<>
			{shouldUseStack && isServerOnline && serverOwner}
			<div className="section-header">
				{item.type === "private" && <span className="font-bold">{item.name}</span>}
				{(item.type === "private" || canManagePlace) && (
					<ItemContextMenu containerClassName={`link-menu ${cssKey}-game-server-menu`}>
						{canManageServer && (
							<a
								className={`${cssKey}-server-configure`}
								href={getConfigurePrivateServerLink(item.vipServerId)}
							>
								{getMessage("experience.servers.server.contextMenu.configure")}
							</a>
						)}
						{item.type === "private" && canJoinServer && (
							<button
								type="button"
								className={`${cssKey}-server-copy-invitee-link`}
								onClick={() => copyLinkToClipboard(false)}
							>
								{getMessage(
									"experience.servers.server.contextMenu.copyInviteeLink",
								)}
							</button>
						)}
						{(ownerDetails?.subscription.active || (isFreeServer && !isInactive)) && (
							<button
								type="button"
								className={`${cssKey}-server-cancel-subscription`}
								onClick={() => setShowCancelPrivateServerModal(true)}
							>
								{getMessage(
									`experience.servers.server.contextMenu.${isFreeServer ? "deactivate" : "cancel"}`,
								)}
							</button>
						)}
						{isServerOnline && canShutdownServer && (
							<button
								type="button"
								className={`${cssKey}-server-shutdown`}
								onClick={shutdownServer}
							>
								{getMessage("experience.servers.server.contextMenu.shutdown")}
							</button>
						)}
					</ItemContextMenu>
				)}
			</div>
			{(!shouldUseStack || !isServerOnline) && serverOwner}
		</>
	);

	return (
		<li
			data-server-id={item.id}
			data-private-server-id={item.type === "private" ? item.vipServerId : undefined}
			data-private-server-access-code={item.type === "private" ? item.accessCode : undefined}
			className={`${cssKey}-game-server-item game-server-item col-md-3 col-sm-4 col-xs-6`}
		>
			{item.type === "private" && ownerDetails && (
				<RenewPrivateServerModal
					privateServerId={item.vipServerId}
					show={showRenewPrivateServerModal}
					setShow={setShowRenewPrivateServerModal}
					onRenew={refreshServerList}
				/>
			)}
			{item.type === "private" && ownerDetails && (
				<CancelPrivateServerModal
					privateServerId={item.vipServerId}
					show={showCancelPrivateServerModal}
					expirationDate={ownerDetails.subscription.expirationDate}
					setOpen={setShowCancelPrivateServerModal}
					onCancel={refreshServerList}
				/>
			)}
			{isLikelyBotted && (
				<div className="botted-indicator">
					<span className="info-icon">
						<MdOutlineRobot className="roseal-icon" />
					</span>
					<span className="info-text">
						{getMessage("experience.servers.server.likelyBotted")}
					</span>
				</div>
			)}
			<div className={`card-item card-item-${item.type}-server`}>
				{shouldUseStack && item.type !== "private" && connectionSpeed}
				{item.type === "private" && shouldUseStack && headerAndServerOwner}
				{isServerOnline && (
					<div className="player-thumbnails-container">{playerThumbnails}</div>
				)}
				<div
					className={classNames(`${cssKey}-game-server-details game-server-details`, {
						"border-right": !shouldUseStack,
					})}
				>
					{!shouldUseStack && connectionSpeed}
					{(item.type !== "private" || !shouldUseStack) && headerAndServerOwner}
					<div
						className={`text-info rbx-game-status ${cssKey}-game-server-status text-overflow`}
					>
						{getMessage("experience.servers.server.playing", {
							playerCount: asLocaleString(item.playing || 0),
							maxPlayers: asLocaleString(item.maxPlayers),
						})}
					</div>
					<div className="server-player-count-gauge border">
						<div
							className="gauge-inner-bar border"
							style={{
								width: `${((item.playing || 0) / item.maxPlayers) * 100}%`,
							}}
						/>
					</div>
					{item.type === "friends" && friendsInServerText}
					{item.type !== "private" && serverStats}
					{item.type === "public" && friendsInServerText}
					{serverStatuses}
					{item.type === "private" && serverStats}
					{buttons.length > 0 && (
						<span className={`rbx-buttons-section ${cssKey}-buttons-section`}>
							{buttons}
						</span>
					)}
				</div>
				{isServerOnline && showServerDebugInfo && (
					<div
						className={classNames(`${cssKey}-server-debug-info server-debug-info`, {
							"cursor-pointer": canClickServerDebugInfo,
						})}
						onClick={() => {
							if (!canClickServerDebugInfo) {
								return;
							}

							const types: ("id" | "version" | "channelName")[] = ["id"];
							if (item.joinData?.data?.rcc?.version) {
								types.push("version");
							}
							if (
								item.joinData?.data?.rcc &&
								item.joinData?.data?.rcc?.channelName !==
									DEFAULT_RELEASE_CHANNEL_NAME
							) {
								types.push("channelName");
							}

							let nextType = types.indexOf(nonPrivateDebugStatType) + 1;
							if (nextType >= types.length) {
								nextType = 0;
							}

							setNonPrivateDebugStatType(types[nextType]);
						}}
					>
						{showServerDebugInfo === "all" &&
							(!shouldUseStack || nonPrivateDebugStatType === "channelName") &&
							item.joinData?.data?.rcc &&
							item.joinData?.data.rcc.channelName !==
								DEFAULT_RELEASE_CHANNEL_NAME && (
								<div className="debug-stat">
									{getMessage("experience.servers.server.debugStats.channel", {
										channel: item.joinData?.data.rcc.channelName,
									})}
								</div>
							)}
						{showServerDebugInfo === "all" &&
							(!shouldUseStack || nonPrivateDebugStatType === "version") &&
							item.joinData?.data?.rcc && (
								<div className="debug-stat">
									{getMessage("experience.servers.server.debugStats.version", {
										version: item.joinData.data.rcc.version,
									})}
								</div>
							)}
						{(!shouldUseStack ||
							nonPrivateDebugStatType === "id" ||
							showServerDebugInfo === "idOnly") && (
							<div
								className={classNames("debug-stat", {
									"show-on-hover":
										item.type !== "private" && item.players.length > 0,
								})}
							>
								{getMessage("experience.servers.server.debugStats.id", {
									id: item.id,
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</li>
	);
}
