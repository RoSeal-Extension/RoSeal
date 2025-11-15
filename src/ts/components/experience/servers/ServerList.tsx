import MdOutlineCloseSmall from "@material-symbols/svg-400/outlined/close_small-fill.svg";
import MdOutlineGlobeFill from "@material-symbols/svg-400/outlined/globe-fill.svg";
import { useSignal } from "@preact/signals";
import classNames from "classnames";
import { useEffect, useMemo, useState } from "preact/hooks";
import Button from "src/ts/components/core/Button";
import CheckboxField from "src/ts/components/core/CheckboxField";
import Dropdown from "src/ts/components/core/Dropdown";
import Icon from "src/ts/components/core/Icon";
import Loading from "src/ts/components/core/Loading";
import Pagination from "src/ts/components/core/Pagination";
import RobuxView from "src/ts/components/core/RobuxView";
import Thumbnail from "src/ts/components/core/Thumbnail";
import Tooltip from "src/ts/components/core/Tooltip";
import useAuthenticatedUser from "src/ts/components/hooks/useAuthenticatedUser";
import useDidMountEffect from "src/ts/components/hooks/useDidMountEffect";
import usePages from "src/ts/components/hooks/usePages";
import InsufficentRobuxModal from "src/ts/components/modals/InsufficientRobuxModal";
import {
	FILTER_PUBLIC_SERVER_STATUS_CODES,
	UNFILTER_PUBLIC_SERVER_STATUS_MESSAGES,
} from "src/ts/constants/servers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	type BatchThumbnailRequest,
	thumbnailProcessor,
} from "src/ts/helpers/processors/thumbnailProcessor";
import type { SortOrder } from "src/ts/helpers/requests/services/badges";
import {
	getPrivateServerData,
	getServerInstanceData,
	getUserServerData,
} from "src/ts/helpers/requests/services/join";
import { listPlaceServers, type PlaceServer } from "src/ts/helpers/requests/services/places";
import {
	listPlacePrivateServers,
	type PlacePrivateServer,
} from "src/ts/helpers/requests/services/privateServers";
import {
	type PrivateServerInventoryItem,
	listUserPrivateServers,
} from "src/ts/helpers/requests/services/inventory";
import { type MinimalServerJoinData, tryGetServerJoinData } from "src/ts/utils/joinData";
import { getRobloxPrivateServerInfoLink } from "src/ts/utils/links";
import { parseResizeThumbnailUrl } from "src/ts/utils/thumbnails";
import CountryFlag from "../../core/CountryFlag";
import ServerGlobeMap from "./map/ServerMap";
import CreatePrivateServerModal from "./privateServers/CreatePrivateServerModal";
import ServersPromptGeolocation from "./PromptGeolocation";
import Server, { type ServerListType } from "./Server";
import {
	type RobloxDataCenterConnectionSpeed,
	type RobloxGroupedDataCenterWithDistance,
	useServersTabContext,
} from "./ServersTabProvider";
import { getLocalizedRegionName } from "./utils";
import DeactivatePrivateServersModal from "./privateServers/DeactivatePrivateServersModal";
import { sendJoinGameInstance, sendJoinMultiplayerGame } from "src/ts/utils/gameLauncher";

export type ServerWithJoinData = {
	joinData?: MinimalServerJoinData;
} & (
	| (PlacePrivateServer & {
			type: "private";
	  })
	| (PlaceServer & {
			type: "public" | "friends";
	  })
);

export type ServerListProps = {
	type: ServerListType;
	id: string;
	innerId?: string;
};

export default function ServerList({ type, id, innerId }: ServerListProps) {
	const {
		universeId,
		placeId,
		canCreatePrivateServer,
		canPreCreatePrivateServer,
		privateServerPrice,
		privateServerLimit,
		universeName,
		userRobuxAmount,
		robuxUpsellPackage,
		preopenPrivateServerCreateModal,
		excludeFullServersDefaultEnabled,
		tryGetServerInfoEnabled,
		pagingType,
		pageSize,
		canManagePlace,
		promptLocationPermission,
		dataCenters,
		userLatLong,
		preCreatePrivateServersEnabled,
		showServerLikelyBotted,
		regionFiltersEnabled,
		privateServerRowsEnabled,
		activatePreferredServer,
		setThumbnailHashToPlayerTokens,
	} = useServersTabContext();

	const canViewServers =
		type !== "private" ||
		(canPreCreatePrivateServer && preCreatePrivateServersEnabled) ||
		canCreatePrivateServer;
	const cssKey = `rbx-${type}`;

	const [showServerGlobeMap, setShowServerGlobeMap] = useState(false);

	const [sortPlayers, setSortPlayers] = useState<SortOrder>("Desc");
	const [excludeFullServers, setExcludeFullServers] = useState(excludeFullServersDefaultEnabled);
	const [excludeUnjoinableServers, setExcludeUnjoinableServers] = useState(true);
	const [selectedDataCenter, setSelectedDataCenter] =
		useState<RobloxGroupedDataCenterWithDistance>();

	const [isExperienceUnderLoad, setIsExperienceUnderLoad] = useState(false);

	useDidMountEffect(() => {
		setExcludeFullServers(excludeFullServersDefaultEnabled);
	}, [excludeFullServersDefaultEnabled]);

	const shouldUseStack = type !== "private" || privateServerRowsEnabled;

	const {
		allItems,
		items,
		hasAnyItems,
		loading,
		error,
		maxPageNumber,
		pageNumber,
		shouldBeDisabled,
		fetchedAllPages,
		loadAllItems,
		reset,
		setPageNumber,
	} = usePages<ServerWithJoinData, string>({
		disabled: !canViewServers,
		items: {
			shouldAlwaysUpdate: true,
			filterItem: (item) => {
				if (selectedDataCenter && regionFiltersEnabled) {
					const dataCenterId = item.joinData?.data?.datacenter.id;
					if (!dataCenterId || !selectedDataCenter.dataCenterIds.includes(dataCenterId)) {
						return false;
					}
				}

				if (type === "public" && !canManagePlace && excludeUnjoinableServers) {
					const joinData = item.joinData;
					if (!joinData) return true;

					return (
						!FILTER_PUBLIC_SERVER_STATUS_CODES.includes(joinData.statusCode) ||
						(!!joinData.status &&
							UNFILTER_PUBLIC_SERVER_STATUS_MESSAGES.includes(joinData.status))
					);
				}

				return true;
			},
		},
		paging:
			pagingType === "pagination" && type === "public"
				? {
						method: "pagination",
						itemsPerPage: pageSize,
						immediatelyLoadAllData: selectedDataCenter !== undefined,
					}
				: {
						method: "loadMore",
						initialCount: !shouldUseStack ? 10 : type === "public" ? pageSize : 8,
						incrementCount: !shouldUseStack ? 10 : type === "public" ? pageSize : 8,
						immediatelyLoadAllData: selectedDataCenter !== undefined,
					},
		retry: {
			count: 10,
			timeout: 1_500,
		},
		dependencies: {
			refreshToFirstPage: [
				pageSize,
				pagingType,
				excludeUnjoinableServers,
				selectedDataCenter,
				regionFiltersEnabled,
				shouldUseStack,
			],
			reset: [
				universeId,
				placeId,
				type,
				sortPlayers,
				excludeFullServers,
				tryGetServerInfoEnabled,
			],
		},
		getNextPage: async (state) => {
			const data = await (type === "private"
				? listPlacePrivateServers({
						placeId,
						limit: 100,
						cursor: state.nextCursor,
						sortOrder: "Desc",
					})
				: listPlaceServers({
						placeId,
						serverType: type === "friends" ? "Friend" : "Public",
						limit: 100,
						cursor: state.nextCursor,
						sortOrder: sortPlayers,
						excludeFullGames: excludeFullServers,
					}));
			if ("gameJoinRestricted" in data) {
				setIsExperienceUnderLoad(data.gameJoinRestricted === true);
			}

			const servers: MaybePromise<ServerWithJoinData>[] = [];

			// ... remove duplicate servers
			for (const server of data.data) {
				if (server.id) {
					let isDuplicate = false;
					for (let i = 0; i < state.items.length; i++) {
						if (state.items[i].id === server.id) {
							isDuplicate = true;
							break;
						}
					}

					if (isDuplicate) continue;
				}

				if (
					tryGetServerInfoEnabled !== false &&
					server.id &&
					((server.playing || 0) < server.maxPlayers ||
						tryGetServerInfoEnabled === "allServers") &&
					server.maxPlayers !== 1
				) {
					const oneFriend = server.players[0];
					let promise: Promise<MinimalServerJoinData> | undefined;

					if (type === "private") {
						promise = tryGetServerJoinData(
							getPrivateServerData,
							{
								placeId,
								accessCode: (server as PlacePrivateServer).accessCode,
								gameJoinAttemptId: crypto.randomUUID(),
								joinOrigin: "RoSealFetchInfo",
							},
							1,
						);
					} else if (type === "friends" && oneFriend) {
						promise = tryGetServerJoinData(
							getUserServerData,
							{
								userIdToFollow: oneFriend.id,
								joinOrigin: "RoSealFetchInfo",
								gameJoinAttemptId: crypto.randomUUID(),
							},
							1,
						);
					} else {
						promise = tryGetServerJoinData(
							getServerInstanceData,
							{
								placeId,
								gameId: server.id,
								gameJoinAttemptId: crypto.randomUUID(),
								joinOrigin: "RoSealFetchInfo",
							},
							1,
						);
					}

					servers.push(
						promise
							.then(
								(joinData) =>
									({
										...server,
										type,
										joinData,
									}) as ServerWithJoinData,
							)
							.catch(
								() =>
									({
										...server,
										type,
									}) as ServerWithJoinData,
							),
					);
				} else {
					servers.push({
						...server,
						type,
					} as ServerWithJoinData);
				}
			}

			return {
				...state,
				items: await Promise.all(servers),
				nextCursor: (data.data.length === 0 && data.nextPageCursor) || undefined,
				hasNextPage: data.data.length !== 0 && !!data.nextPageCursor,
			};
		},
	});

	const [hasThreeOrMorePlayers, hasFourOrMorePlayers, hasFiveOrMorePlayers] = useMemo(() => {
		if (!items.length) return [false, false, false];

		let hasTwoOrMorePlayers = false;
		let hasFourOrMorePlayers = false;

		for (const server of items) {
			if (server.playing) {
				if (server.playing >= 5) {
					return [true, true, true];
				}

				if (server.playing >= 2) {
					hasTwoOrMorePlayers = true;
				}

				if (server.playing >= 4) {
					hasFourOrMorePlayers = true;
				}
			}
		}

		return [hasTwoOrMorePlayers, hasFourOrMorePlayers, false];
	}, [items]);

	const userPrivateServerListed = useSignal<Record<number, PrivateServerInventoryItem>>({});

	const [authenticatedUser] = useAuthenticatedUser();

	const [showServers, setShowServers] = useState(true);
	const [showBuyRobuxPackage, setShowBuyRobuxPackage] = useState(false);
	const [showCreatePrivateServerModal, setShowCreatePrivateServerModal] = useState(
		preopenPrivateServerCreateModal,
	);
	const [showDeactivatePrivateServersList, setShowDeactivatePrivateServersList] = useState(false);

	const totalServersByUser = useMemo(() => {
		if (type !== "private" || shouldBeDisabled) return;

		return (items as PlacePrivateServer[]).filter(
			(item) => item.owner.id === authenticatedUser?.userId,
		).length;
	}, [items, shouldBeDisabled, authenticatedUser?.userId]);

	const dataCentersWithServerCounts = useMemo(() => {
		if (!dataCenters || type !== "public") return;

		return dataCenters.map((dataCenter) => ({
			...dataCenter,
			serverCount: allItems.filter((item) => {
				const dataCenterId = item.joinData?.data?.datacenter.id;
				return (
					dataCenterId !== undefined && dataCenter.dataCenterIds.includes(dataCenterId)
				);
			}).length,
		}));
	}, [allItems]);

	useEffect(() => {
		if (!activatePreferredServer.value || !dataCenters || type !== "public") return;

		if (!allItems.length && fetchedAllPages) {
			// just send join matchmade server request
			sendJoinMultiplayerGame({
				placeId,
				joinAttemptOrigin: "PlayButton",
				joinAttemptId: crypto.randomUUID(),
			});
			activatePreferredServer.value = false;
			return;
		}

		const itemsBySpeed = {} as Record<RobloxDataCenterConnectionSpeed, string[] | undefined>;
		let gameId: string | undefined;

		for (const item of allItems) {
			if (!item.joinData?.data || !item.id) continue;

			for (const dataCenter of dataCenters) {
				if (dataCenter.dataCenterIds.includes(item.joinData.data.datacenter.id)) {
					if (dataCenter.speed === "fastest") {
						gameId = item.id;
						break;
					}

					if (dataCenter.speed) {
						itemsBySpeed[dataCenter.speed] ??= [];
						itemsBySpeed[dataCenter.speed]!.push(item.id);
					}

					break;
				}
			}

			if (gameId) {
				break;
			}
		}

		if (!gameId) {
			gameId =
				itemsBySpeed.fast?.[0] ??
				itemsBySpeed.average?.[0] ??
				itemsBySpeed.slow?.[0] ??
				itemsBySpeed.slowest?.[0];
		}

		if (gameId) {
			sendJoinGameInstance({
				placeId,
				gameId,
				joinAttemptOrigin: "PlayButton",
				joinAttemptId: crypto.randomUUID(),
			});
		} else if (!fetchedAllPages) {
			loadAllItems();
			return;
		} else {
			sendJoinMultiplayerGame({
				placeId,
				joinAttemptOrigin: "PlayButton",
				joinAttemptId: crypto.randomUUID(),
			});
		}

		activatePreferredServer.value = false;
	}, [allItems, activatePreferredServer.value, dataCenters, type]);

	useEffect(() => {
		if (!items || privateServerPrice === 0) return;

		let cancel = false;

		(async () => {
			for (const server of items) {
				if (cancel) return;

				if (
					server.type === "private" &&
					!(server.vipServerId in userPrivateServerListed.value) &&
					authenticatedUser?.userId !== server.owner.id
				) {
					const data = await listUserPrivateServers({
						privateServersTab: "OtherPrivateServers",
						itemsPerPage: 100,
						cursor: `1_${server.owner.id}_${server.vipServerId - 1}`,
					});
					for (const server2 of data.data) {
						if (server2.universeId === universeId) {
							userPrivateServerListed.value = {
								...userPrivateServerListed.value,
								[server2.privateServerId]: server2,
							};
						}
					}
				}
			}
		})();

		return () => {
			cancel = true;
		};
	}, [items]);

	useEffect(() => {
		if (!showServerLikelyBotted) return;

		const requests: BatchThumbnailRequest[] = [];

		for (const server of allItems) {
			for (const token of server.playerTokens) {
				requests.push({
					type: "AvatarHeadShot",
					token,
					size: "150x150",
					requestId: token,
				});
			}
		}

		thumbnailProcessor.requestBatch(requests).then((data) => {
			setThumbnailHashToPlayerTokens((prev) => {
				for (const result of data) {
					if (!result.imageUrl) continue;

					const parsedThumbnail = parseResizeThumbnailUrl(result.imageUrl);
					if (!parsedThumbnail) continue;
					prev[parsedThumbnail.hash] ??= new Set();
					prev[parsedThumbnail.hash].add(result.requestId);
				}

				return {
					...prev,
				};
			});
		});
	}, [allItems, showServerLikelyBotted]);

	const serversListContent = (
		<>
			{!hasAnyItems && (
				<div className="section-content-off empty-game-instances-container">
					<p className="no-servers-message">
						{loading ? (
							<Loading />
						) : error ? (
							getMessage("experience.servers.common.loadError")
						) : (
							getMessage("experience.servers.common.noServersFound")
						)}
					</p>
				</div>
			)}
			{hasAnyItems && (
				<>
					{pagingType === "pagination" &&
						type === "public" &&
						(maxPageNumber > 1 || pageNumber > 1) && (
							<div className={`${cssKey}-running-games-footer`}>
								<Pagination
									current={pageNumber}
									hasNext={pageNumber < maxPageNumber}
									disabled={shouldBeDisabled}
									onChange={setPageNumber}
								/>
							</div>
						)}
					{items.length === 0 && !loading && (
						<div className="section-content-off">
							{getMessage("experience.servers.common.noFilteredServers")}
						</div>
					)}
					<ul
						id={`${cssKey}-game-server-item-container`}
						className={classNames(`card-list ${cssKey}-game-server-item-container`, {
							"roseal-disabled": shouldBeDisabled,
							"has-three-or-more-players": hasThreeOrMorePlayers,
							"has-four-or-more-players": hasFourOrMorePlayers,
							"has-five-or-more-players": hasFiveOrMorePlayers,
							"stackable-card-list": shouldUseStack,
						})}
					>
						{items.map((item) => (
							<Server
								key={item.type === "private" ? item.vipServerId : item.id}
								cssKey={cssKey}
								item={item}
								privateServerInventoryItem={
									item.type === "private"
										? userPrivateServerListed.value[item.vipServerId]
										: undefined
								}
								isExperienceUnderLoad={isExperienceUnderLoad}
								refreshServerList={reset}
								showRegion={selectedDataCenter === undefined}
								shouldUseStack={shouldUseStack}
								setShowDeactivatePrivateServersList={
									setShowDeactivatePrivateServersList
								}
								setShowBuyRobuxPackage={setShowBuyRobuxPackage}
							/>
						))}
					</ul>
					{(maxPageNumber > 1 || pageNumber > 1) && (
						<div className={`${cssKey}-running-games-footer`}>
							{type !== "public" ? (
								<Button
									className="rbx-running-games-load-more"
									type="control"
									width="full"
									disabled={shouldBeDisabled}
									onClick={() => {
										if (pageNumber < maxPageNumber) {
											setPageNumber(pageNumber + 1);
										} else {
											setPageNumber(1);
										}
									}}
								>
									{getMessage(
										`experience.servers.common.load${pageNumber < maxPageNumber ? "More" : "Less"}`,
									)}
								</Button>
							) : (
								<Pagination
									current={pageNumber}
									hasNext={pageNumber < maxPageNumber}
									disabled={shouldBeDisabled}
									onChange={setPageNumber}
								/>
							)}
						</div>
					)}
				</>
			)}
		</>
	);

	return (
		<div
			id={id}
			className={classNames("stack", {
				"server-list-section": shouldUseStack,
			})}
		>
			{type === "private" && (
				<InsufficentRobuxModal
					show={showBuyRobuxPackage}
					itemName={universeName}
					thumbnail={
						<Thumbnail
							request={{
								type: "GameIcon",
								targetId: universeId,
								size: "420x420",
							}}
						/>
					}
					priceInRobux={privateServerPrice}
					userRobuxAmount={userRobuxAmount}
					robuxPackage={robuxUpsellPackage}
					setShow={setShowBuyRobuxPackage}
				/>
			)}
			{type === "private" && (
				<CreatePrivateServerModal
					show={showCreatePrivateServerModal}
					setShow={setShowCreatePrivateServerModal}
					onCreate={reset}
				/>
			)}
			{type === "private" && (
				<DeactivatePrivateServersModal
					show={showDeactivatePrivateServersList}
					setShow={setShowDeactivatePrivateServersList}
				/>
			)}
			<div className="container-header">
				<div className="server-list-container-header">
					<h2 className="server-list-header">
						{getMessage(`experience.servers.${type}.title`)}
					</h2>
					{type === "private" && (
						<Tooltip button={<Icon name="moreinfo" />} placement="bottom">
							{getMessage(`experience.servers.${type}.tooltip`)}
						</Tooltip>
					)}
					<button
						type="button"
						className="roseal-btn collapse-servers-btn"
						onClick={() => setShowServers(!showServers)}
					>
						<Icon name={showServers ? "up" : "down"} size="16x16" />
					</button>
					{canViewServers && showServers && (
						<Button
							type="control"
							size="xs"
							className="btn-more rbx-refresh refresh-link-icon"
							onClick={(e: MouseEvent) => {
								e.stopImmediatePropagation();
								reset();
							}}
							disabled={shouldBeDisabled}
						>
							{getMessage("experience.servers.common.refresh")}
						</Button>
					)}
				</div>
				{type === "public" && showServers && (
					<div className="server-list-options">
						{regionFiltersEnabled && dataCentersWithServerCounts && (
							<ServerGlobeMap
								show={showServerGlobeMap}
								setShow={setShowServerGlobeMap}
								dataCenters={dataCentersWithServerCounts}
								initialLatLong={userLatLong}
								onSelect={setSelectedDataCenter}
							/>
						)}
						<div className="select-group">
							<label className="select-label text-label" for="sort-select">
								{getMessage("experience.servers.public.filters.numberOfPlayers")}
							</label>
							<Dropdown
								disabled={shouldBeDisabled}
								selectedItemValue={sortPlayers}
								selectionItems={[
									{
										value: "Desc",
										label: "Descending",
									},
									{
										value: "Asc",
										label: "Ascending",
									},
								]}
								onSelect={(value) => setSortPlayers(value)}
								id="sort-select"
							/>
						</div>
						<CheckboxField
							disabled={shouldBeDisabled}
							checked={excludeFullServers}
							onChange={(value) => {
								setExcludeFullServers(value);
							}}
						>
							<label className="checkbox-label text-label">
								{getMessage("experience.servers.public.filters.excludeFullServers")}
							</label>
						</CheckboxField>
						<CheckboxField
							disabled={shouldBeDisabled}
							checked={excludeUnjoinableServers}
							onChange={(value) => {
								setExcludeUnjoinableServers(value);
							}}
						>
							<label className="checkbox-label text-label">
								{getMessage(
									"experience.servers.public.filters.excludeUnjoinableServers",
								)}
							</label>
						</CheckboxField>
						{regionFiltersEnabled && (
							<button
								type="button"
								className="btn-generic-more-sm region-selector-btn"
								onClick={() => {
									setShowServerGlobeMap(true);
									loadAllItems();
								}}
								disabled={shouldBeDisabled}
							>
								<div className="region-icon-container">
									{selectedDataCenter ? (
										<CountryFlag
											code={selectedDataCenter.location.country}
											className="roseal-icon"
										/>
									) : (
										<MdOutlineGlobeFill className="roseal-icon" />
									)}
								</div>
								<div className="filter-text-container">
									{selectedDataCenter
										? getLocalizedRegionName(selectedDataCenter.location, true)
										: getMessage(
												"experience.servers.regionSelector.buttonText",
											)}
								</div>
								{selectedDataCenter && (
									<button
										type="button"
										className="remove-region-container roseal-btn"
										onClick={(e) => {
											e.stopImmediatePropagation();
											setSelectedDataCenter(undefined);
										}}
									>
										<MdOutlineCloseSmall className="roseal-icon" />
									</button>
								)}
							</button>
						)}
					</div>
				)}
			</div>
			{type === "public" && promptLocationPermission && <ServersPromptGeolocation />}
			{type === "private" && canViewServers && showServers && (
				<div className="create-server-banner section-content remove-panel">
					<div className="create-server-banner-text text">
						<span className="private-server-price">
							{getMessage("experience.servers.private.price", {
								priceInRobux: (
									<RobuxView
										priceInRobux={privateServerPrice}
										isForSale
										useTextRobuxForFree
									/>
								),
							})}
						</span>
						<span className="play-with-others-text">
							{getMessage("experience.servers.private.playWithOthersText")}
						</span>
					</div>
					<span className="rbx-private-server-create">
						<Button
							type="secondary"
							className="btn-more rbx-private-server-create-button"
							disabled={
								totalServersByUser === undefined ||
								totalServersByUser >= privateServerLimit
							}
							onClick={() => {
								if ((privateServerPrice ?? 0) > (userRobuxAmount ?? 0)) {
									setShowBuyRobuxPackage(true);
								} else {
									setShowCreatePrivateServerModal(true);
								}
							}}
						>
							{getMessage(
								`experience.servers.private.createServer.${canPreCreatePrivateServer ? "precreate" : "create"}`,
							)}
						</Button>
						{totalServersByUser !== undefined &&
							totalServersByUser >= privateServerLimit && (
								<span className="text-footer rbx-private-server-create-disabled-text">
									{getMessage("experience.servers.private.freeLimitReached")}
								</span>
							)}
					</span>
				</div>
			)}
			{!canViewServers && (
				<div className="section-content-off">
					{getMessage("experience.servers.private.notSupported", {
						privateServersLink: (contents: string) => (
							<a className="text-link" href={getRobloxPrivateServerInfoLink()}>
								{contents}
							</a>
						),
					})}
				</div>
			)}
			{canViewServers &&
				showServers &&
				(!shouldUseStack ? (
					<div className="section tab-server-only">
						<div
							id={innerId}
							className="stack server-list-section"
							data-placeid={placeId}
						>
							{serversListContent}
						</div>
					</div>
				) : (
					serversListContent
				))}
		</div>
	);
}
