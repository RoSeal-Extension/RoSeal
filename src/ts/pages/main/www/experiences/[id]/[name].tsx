import { signal } from "@preact/signals";
import type { ChartJSOrUndefined } from "node_modules/react-chartjs-2/dist/types";
import { Fragment } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import AddToProfileButton from "src/ts/components/avatarItem/AddToProfileButton";
import Tooltip from "src/ts/components/core/Tooltip";
import AddToPlaylistButton from "src/ts/components/experience/AddToPlaylistButton";
import AltText from "src/ts/components/experience/AltText";
import ExperienceAvatarRestriction from "src/ts/components/experience/AvatarRestriction";
import ExperienceAvatarType from "src/ts/components/experience/AvatarType";
import ExperienceBadgesTab from "src/ts/components/experience/badges/Tab";
import BannedPlayButton from "src/ts/components/experience/BannedPlayButton";
import ExperienceCountdown from "src/ts/components/experience/Countdown";
import ExperienceCreatedDate from "src/ts/components/experience/CreatedDate";
import ExperienceDevStats from "src/ts/components/experience/DevStats";
import ExperienceEventsTab from "src/ts/components/experience/events/Tab";
import ExperienceTopSongsList from "src/ts/components/experience/ExperienceTopSongsList";
import ExperienceLinks from "src/ts/components/experience/Links";
import PlacesTab from "src/ts/components/experience/places/Tab";
import ExperiencePlayableDevices from "src/ts/components/experience/PlayableDevices";
import ExperiencePlaytime from "src/ts/components/experience/Playtime";
import ExperiencePrivateNote from "src/ts/components/experience/PrivateNote";
import ExperienceRestrictedCountries from "src/ts/components/experience/RestrictedCountries";
import ExperienceSales from "src/ts/components/experience/Sales";
import JoinPreferredRegionButton from "src/ts/components/experience/servers/JoinPreferredRegionButton";
import PrivateServerLinkList from "src/ts/components/experience/servers/privateServerLinks/PrivateServerLinkList";
import ServersTabContent from "src/ts/components/experience/servers/ServersTab";
import ExperienceShadowBannedNotice from "src/ts/components/experience/ShadowBannedNotice";
import StartPlaceNotice from "src/ts/components/experience/StartPlaceNotice";
import ExperienceStatsChart from "src/ts/components/experience/StatsChart";
import StoreDropdown from "src/ts/components/experience/store/Dropdown";
import Passes from "src/ts/components/experience/store/Passes";
import ExperienceTestPilotSettings from "src/ts/components/experience/TestPilotSettings";
import PlaceUpVoteRatio from "src/ts/components/experience/UpVoteRatio";
import ViewMediaAsset from "src/ts/components/experience/ViewMediaAsset";
import useFeatureValue from "src/ts/components/hooks/useFeatureValue";
import BlockItemButton from "src/ts/components/item/BlockItemButton";
import ItemFavoritedSince from "src/ts/components/item/FavoritedSince";
import ItemBlockedScreen from "src/ts/components/item/ItemBlockedScreen";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import CopyShareLinkButton from "src/ts/components/misc/CopyShareLinkButton";
import { setInvokeListener } from "src/ts/helpers/communication/dom";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { watch, watchAttributes, watchBeforeLoad, watchOnce } from "src/ts/helpers/elements";
import {
	featureValueIs,
	getFeatureValue,
	multigetFeaturesValues,
} from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	abbreviateNumber,
	asLocaleString,
	getHourAndMinute,
} from "src/ts/helpers/i18n/intlFormats";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getAuthenticatedUserAvatar } from "src/ts/helpers/requests/services/avatar";
import { listUserGroupsRoles } from "src/ts/helpers/requests/services/groups";
import { search } from "src/ts/helpers/requests/services/misc";
import { getPlaceVotes } from "src/ts/helpers/requests/services/places";
import {
	type ExperienceEvent,
	getUniverseMedia,
	getUniverseStartInfo,
	listExperienceEvents,
	listUniverseActiveSubscriptions,
	multigetDevelopUniversesByIds,
	multigetOmniRecommendationsMetadata,
	multigetUniversesByIds,
} from "src/ts/helpers/requests/services/universes";
import { checkItemTimes } from "src/ts/specials/times";
import { getAuthenticatedUser, isAuthenticated } from "src/ts/utils/authenticatedUser";
import { getDeviceMeta } from "src/ts/utils/context";
import currentUrl from "src/ts/utils/currentUrl";
import { deepLinksParser } from "src/ts/utils/deepLinks";
import { renderMentions } from "src/ts/utils/description";
import { onDOMReady } from "src/ts/utils/dom";
import { sendJoinMultiplayerGame } from "src/ts/utils/gameLauncher";
import { getPlaceJoinData } from "src/ts/utils/joinData";
import { EXPERIENCE_DEEPLINK_REGEX, EXPERIENCE_DETAILS_REGEX } from "src/ts/utils/regex";
import {
	renderAfter,
	renderAppend,
	renderAsContainer,
	renderBefore,
	renderIn,
	renderPrepend,
} from "src/ts/utils/render";

export type LiveStatsSignal = {
	playing: number;
	visits: number;
	favorites: number;
	maxPlayers: number;
	upVotes: number;
	downVotes: number;
};

export type LiveStatsHistorySignal = {
	playing: [string[], number[]];
	visits: [string[], number[]];
	favorites: [string[], number[]];
	votes: [string[], number[], number[]];
};

export default {
	id: "experience.details",
	regex: [EXPERIENCE_DETAILS_REGEX, EXPERIENCE_DEEPLINK_REGEX],
	css: ["css/experienceDetails.css"],
	fn: async () => {
		const placeDataset = (await watchOnce<HTMLElement>("#game-detail-meta-data"))?.dataset;

		if (!placeDataset?.universeId || !placeDataset.placeName || !placeDataset.placeId) {
			return;
		}

		const universeId = Number.parseInt(placeDataset.universeId, 10);
		const placeId = Number.parseInt(placeDataset.placeId, 10);
		// Orphan places will 404
		const rootPlaceId = Number.parseInt(placeDataset.rootPlaceId!, 10);
		const isRootPlace = placeId === rootPlaceId;
		const universeName = placeDataset.placeName;
		const userCanManagePlace = placeDataset.userCanManagePlace?.toLowerCase() === "true";
		const privateServerPrice = Number.parseInt(placeDataset.privateServerPrice || "0", 10);
		const privateServerProductId = Number.parseInt(
			placeDataset.privateServerProductId || "0",
			10,
		);
		const preopenPrivateServerCreateModal =
			placeDataset.preopenCreatePrivateServerModal?.toLowerCase() === "true";
		const canCreatePrivateServer = placeDataset.canCreateServer?.toLowerCase() === "true";
		const canPreCreatePrivateServer = !canCreatePrivateServer && privateServerProductId !== 0;
		const privateServerLimit = Number.parseInt(placeDataset.privateServerLimit || "0", 10);
		const privateServerLinkCode = placeDataset.privateServerLinkCode || undefined;
		const sellerName = placeDataset.sellerName || "";

		if (canPreCreatePrivateServer)
			featureValueIs("precreateExperiencePrivateServers", true, () => {
				placeDataset.canCreateServer = "True";
				watch(
					"#rbx-running-game-instances-container .rbx-private-server-create-button",
					(btn) => {
						btn.textContent = getMessage(
							"experience.servers.private.createServer.precreate",
						);
					},
				);
			});

		featureValueIs("viewExperienceTopSongs", true, () => {
			watchOnce(".container-list.games-detail").then((recommendedSection) =>
				renderAfter(
					<ExperienceTopSongsList universeId={universeId} universeName={universeName} />,
					recommendedSection,
				),
			);
		});

		featureValueIs("scaredPlayButton", true, () =>
			watch('[data-testid="play-button"]', (btn) => {
				btn.classList.add("very-scared-play-button-ooo-scary-ooo");
				const maxDistance = 50;
				const speed = 50;
				const minDistance = 100;

				let currentX = window.innerWidth / 2;
				let currentY = window.innerHeight / 2;

				document.addEventListener("mousemove", (e) => {
					const rect = btn.getBoundingClientRect();
					const centerX = rect.left + rect.width / 2;
					const centerY = rect.top + rect.height / 2;

					const isHovering =
						e.clientX >= rect.left &&
						e.clientX <= rect.right &&
						e.clientY >= rect.top &&
						e.clientY <= rect.bottom;
					const mouseX = e.clientX - centerX;
					const mouseY = e.clientY - centerY;

					if (isHovering) {
						const angle = Math.atan2(mouseY, mouseX);

						const moveDistance = Math.min(maxDistance, minDistance);
						const moveX = (-Math.cos(angle) * moveDistance * speed) / 100;
						const moveY = (-Math.sin(angle) * moveDistance * speed) / 100;

						currentX += moveX;
						currentY += moveY;

						const maxX = window.innerWidth - rect.width;
						const maxY = window.innerHeight - rect.height;
						currentX = Math.max(
							rect.width / 2,
							Math.min(currentX, maxX + rect.width / 2),
						);
						currentY = Math.max(
							rect.height / 2,
							Math.min(currentY, maxY + rect.height / 2),
						);

						btn.style.setProperty(
							"transform",
							`translate(${currentX - window.innerWidth / 2}px, ${currentY - window.innerHeight / 2}px)`,
						);
					}
				});
			}),
		);

		featureValueIs("experienceTestPilotSettings", true, () =>
			watch(
				"#game-details-play-button-container .btn-common-play-game-lg",
				(playButtonContainer) => {
					renderBefore(
						<ExperienceTestPilotSettings
							container={playButtonContainer.parentElement as HTMLDivElement}
						/>,
						playButtonContainer,
					);
				},
			),
		);

		featureValueIs("improvedExperienceServersTab", true, () => {
			const activatePreferredServer = signal(false);

			featureValueIs(
				"improvedExperienceServersTab.tryGetServerInfo.preferredServerButton",
				true,
				() =>
					watchOnce("#game-details-play-button-container .btn-common-play-game-lg").then(
						(btn) =>
							renderAfter(
								<JoinPreferredRegionButton active={activatePreferredServer} />,
								btn,
							),
					),
			);

			watchOnce("#running-game-instances-container").then((container) => {
				renderAsContainer(
					<ServersTabContent
						placeId={placeId}
						universeId={universeId}
						universeName={universeName}
						rootPlaceId={rootPlaceId}
						canManagePlace={userCanManagePlace}
						privateServerPrice={privateServerPrice}
						canCreatePrivateServer={canCreatePrivateServer}
						canPreCreatePrivateServer={canPreCreatePrivateServer}
						preopenPrivateServerCreateModal={preopenPrivateServerCreateModal}
						privateServerLimit={privateServerLimit}
						privateServerLinkCode={privateServerLinkCode}
						sellerName={sellerName}
						activatePreferredServer={activatePreferredServer}
					/>,
					container,
				);
			});
		});

		getFeatureValue("experienceRecentVotes").then((value) => {
			if (!value?.[0]) return;

			watchOnce(".users-vote").then((vote) => {
				renderIn(<PlaceUpVoteRatio placeId={placeId} days={value[1]} />, vote);
			});
		});

		featureValueIs("copyShareLinks", true, () =>
			modifyItemContextMenu(<CopyShareLinkButton type="Experience" id={universeId} />),
		);

		featureValueIs("experienceCountdown", true, () =>
			watchOnce(".avatar-restriction-container, #game-details-play-button-container").then(
				(container) =>
					renderBefore(<ExperienceCountdown universeId={universeId} />, container),
			),
		);

		featureValueIs("improvedExperienceBadges", true, () =>
			watchOnce("#tab-about").then((aboutTab) => {
				const list = aboutTab.closest<HTMLDivElement>(".rbx-tabs-horizontal")!;

				renderAfter(<ExperienceBadgesTab list={list} universeId={universeId} />, aboutTab);
			}),
		);

		featureValueIs("moveExperienceEvents", true, async () => {
			const isPastEventsEnabled = await getFeatureValue(
				"moveExperienceEvents.showPastEvents",
			);

			let promise: Promise<string> | undefined;
			const count = signal(0);
			const pastEvents = signal<ExperienceEvent[]>([]);
			const render = () => {
				return watchOnce("#tab-about, #tab-events").then((aboutTab) => {
					const list = aboutTab.closest<HTMLDivElement>(".rbx-tabs-horizontal")!;

					return new Promise<string>((resolve) => {
						renderAfter(
							<ExperienceEventsTab
								list={list}
								eventCount={count}
								pastEvents={pastEvents}
								onRender={() => {
									resolve("#roseal-current-events-container");
								}}
							/>,
							aboutTab,
						);
					});
				});
			};

			setInvokeListener("experience.events.onReady", (newCount) => {
				if (!promise) promise = render();
				count.value = newCount;

				return promise;
			});

			if (isPastEventsEnabled) {
				listExperienceEvents({
					universeId,
					endsBefore: new Date().toISOString(),
					visibility: "public",
				}).then((data) => {
					if (data.data.length === 0) return;

					if (!promise) promise = render();

					for (const item of data.data) {
						if (!item.placeId) item.placeId = rootPlaceId;
					}
					pastEvents.value = data.data;
				});
			}
		});

		featureValueIs("experienceLinks", true, () =>
			watchOnce(".game-description").then((description) =>
				renderAfter(<ExperienceLinks universeId={universeId} />, description),
			),
		);

		if (!(await isAuthenticated())) {
			return;
		}

		featureValueIs("showExperienceShadowBanned", true, async () => {
			const sessionId = crypto.randomUUID();
			const [lossyData, data, isPublic] = await Promise.all([
				search({
					searchQuery: universeName,
					verticalType: "Game",
					pageType: "discover",
					sessionId,
				}),
				search({
					searchQuery: `"${universeName}"`,
					verticalType: "Game",
					pageType: "discover",
					sessionId,
				}),
				multigetDevelopUniversesByIds({
					ids: [universeId],
				}).then((data) => data[0].privacyType === "Public"),
			]);
			if (!isPublic) return;

			let allResultsAreSame = true;
			let results = 0;
			for (const result of data.searchResults) {
				for (const experience of result.contents) {
					results++;
					if (experience.contentId === universeId) return;

					if (experience.name !== universeName) {
						allResultsAreSame = false;
					}
				}
			}

			for (const result of lossyData.searchResults) {
				for (const experience of result.contents) {
					if (experience.contentId === universeId) return;
				}
			}

			if (!allResultsAreSame || !results || !data.nextPageToken) {
				watchOnce("#game-detail-page").then((detailPage) =>
					renderPrepend(<ExperienceShadowBannedNotice />, detailPage),
				);
			}
		});

		featureValueIs("viewExperiencePlaces", true, () => {
			if (!isRootPlace) {
				featureValueIs("viewExperiencePlaces.nonStartPlaceNotice", true, () =>
					watchOnce("#game-detail-page").then((detailPage) =>
						renderPrepend(
							<StartPlaceNotice
								rootPlaceId={rootPlaceId}
								universeId={universeId}
								universeName={universeName}
							/>,
							detailPage,
						),
					),
				);
			}

			watchOnce("#tab-game-instances").then((serversTab) => {
				const list = serversTab.closest<HTMLDivElement>(".rbx-tabs-horizontal")!;

				renderAfter(
					<PlacesTab universeId={universeId} currentPlaceId={placeId} list={list} />,
					serversTab,
				);
			});
		});

		featureValueIs("fixExperienceDeeplinks", true, async () => {
			const isDeeplinkPage = EXPERIENCE_DEEPLINK_REGEX.test(currentUrl.value.url.pathname);
			if (
				!isDeeplinkPage &&
				(!(await getFeatureValue("fixExperienceDeeplinks.useMainPage")) ||
					!currentUrl.value.url.searchParams.has("start"))
			) {
				return;
			}

			const joinPlaceId = isDeeplinkPage
				? currentUrl.value.url.searchParams.get("placeId")
				: placeId;
			if (!joinPlaceId) {
				return;
			}

			const link = deepLinksParser()
				.createDeepLink("joinPlace", {
					placeId: joinPlaceId.toString(),
					...Object.fromEntries(currentUrl.value.url.searchParams.entries()),
				})
				?.toProtocolUrl();

			if (!link) return;

			const url = new URL(link);

			if (!isDeeplinkPage) {
				onDOMReady(() => {
					location.href = link;
				});
				return;
			}

			const matchUrl = `${url.protocol}//${url.host}${url.pathname}`;
			watchBeforeLoad<HTMLScriptElement>("script").then((script) => {
				if (!script?.innerText?.includes(matchUrl)) {
					return;
				}

				script.remove();
				location.href = link;
			});
		});

		featureValueIs("viewExperienceSupportedDevices", true, () =>
			modifyItemStats(
				"Experience",
				<ExperiencePlayableDevices universeId={universeId} />,
				-1,
			),
		);

		featureValueIs("viewExperienceRestrictedCountries", true, () =>
			watch("#game-age-recommendation-details-container .age-rating-details", (el) => {
				renderAppend(<ExperienceRestrictedCountries universeId={universeId} />, el);
			}),
		);

		featureValueIs("experiencePrivateNotes", true, () =>
			watchOnce(".game-description-container, .game-about-container, .btr-description").then(
				(container) => {
					renderPrepend(<ExperiencePrivateNote universeId={universeId} />, container);
				},
			),
		);

		featureValueIs("viewExperienceDeveloperProducts", true, () => {
			watchOnce(".tab-pane#store").then(async (pane) => {
				renderPrepend(<StoreDropdown universeId={universeId} placeId={placeId} />, pane);
			});
		});

		featureValueIs("experienceStoreFiltering", true, () => {
			watchOnce("#store-does-not-sell").then((el) => el.remove());

			watchOnce("#rbx-game-passes #spinner").then((spinner) => {
				renderAsContainer(
					<Passes universeId={universeId} canManageUniverse={userCanManagePlace} />,
					spinner.closest("#rbx-game-passes")!,
				);
			});
		});

		featureValueIs("viewExperienceAvatarType", true, async () => {
			const startInfo = await getUniverseStartInfo({
				universeId,
			});

			modifyItemStats(
				"Experience",
				<ExperienceAvatarType universeStartInfo={startInfo} />,
				1,
			);

			featureValueIs("viewExperienceAvatarType.showAvatarRestricted", true, async () => {
				const userAvatar = await getAuthenticatedUserAvatar();

				watchOnce("#game-details-play-button-container").then((el) => {
					renderBefore(
						<ExperienceAvatarRestriction
							userAvatar={userAvatar}
							universeStartInfo={startInfo}
						/>,
						el,
					);
				});
			});
		});

		multigetFeaturesValues(["viewUniverseId", "viewPlaceLatestVersions"]).then(async (data) => {
			if (!data.viewUniverseId && !data.viewPlaceLatestVersions) return;

			const container = await watchOnce(
				"#btr-description-wrapper, .game-about-container, .game-description-container",
			);

			renderPrepend(
				<ExperienceDevStats
					universeId={universeId}
					placeId={placeId}
					viewUniverseId={data.viewUniverseId}
					viewPlaceLatestVersions={data.viewPlaceLatestVersions}
				/>,
				container,
			);
		});

		featureValueIs("moveReportAbuse", true, () => {
			watchOnce<HTMLAnchorElement>(".game-description-footer .text-report").then(
				(reportButton) => {
					modifyItemContextMenu(
						<li id="report-abuse-li">
							<a id="report-abuse-btn" href={reportButton.href}>
								{getMessage("item.reportAbuse")}
							</a>
						</li>,
					);
				},
			);
		});

		featureValueIs("viewItemSales", true, () =>
			modifyItemStats("Experience", <ExperienceSales rootPlaceId={placeId} />, 2),
		);

		featureValueIs("experiencePlaytime", true, () =>
			watchOnce(".game-calls-to-action .game-creator").then((creatorLabel) =>
				renderAfter(
					<ExperiencePlaytime universeId={universeId} placeId={placeId} />,
					creatorLabel,
				),
			),
		);

		featureValueIs("formatItemMentions", true, () =>
			watch(".game-description", (description) => renderMentions(description)),
		);

		featureValueIs("customizeHomeSortsLayout.playlists", true, () =>
			watchOnce(".game-favorite-button-container").then((el) =>
				renderAfter(<AddToPlaylistButton universeId={universeId} />, el),
			),
		);

		featureValueIs("viewItemFavoritedDate", true, () => {
			const _signal = signal(false);

			watch(".game-favorite-button-container", (el) => {
				const icon = el.querySelector<HTMLElement>("#game-favorite-icon");
				if (!icon) return;
				_signal.value = icon.classList.contains("favorited");

				watchAttributes(icon, () => {
					_signal.value = icon.classList.contains("favorited");
				}, ["class"]);

				renderAppend(
					() => <ItemFavoritedSince itemType="Asset" itemId={placeId} signal={_signal} />,
					el,
				);
			});
		});

		featureValueIs("viewItemMedia", true, () => {
			const activeSubscriptions = listUniverseActiveSubscriptions({
				subscriptionProductType: 1,
				subscriptionProviderId: universeId,
			});
			watch("#subscriptions-dropdown-menu", async (menu) => {
				const id = document
					.querySelector("[aria-describedby='subscriptions-dropdown-menu']")
					?.closest(".subscription-card-item");
				if (!id) {
					return;
				}

				const siblings = id.parentElement?.children;
				if (!siblings) {
					return;
				}

				const index = Array.from(siblings).indexOf(id);
				const subscription = (await activeSubscriptions).subscriptionProductsInfo[index];
				if (!subscription.iconImageAssetId) {
					return;
				}

				renderIn(
					<ViewIconAssetButton
						itemType="Subscription"
						itemId={universeId}
						iconAssetId={subscription.iconImageAssetId}
					/>,
					menu.querySelector(".dropdown-menu")!,
				);
			});
		});

		if (rootPlaceId !== placeId) {
			featureValueIs("experienceAllowJoinNonRootPlaces", true, () =>
				getDeviceMeta().then((deviceMeta) =>
					getPlaceJoinData({
						placeId,
						overridePlatformType: deviceMeta?.platformType ?? "Desktop",
						gameJoinAttemptId: crypto.randomUUID(),
						joinOrigin: "RoSealFetchInfo",
						requireSuccessful: false,
					}).then((data) => {
						if (data?.success && data.data?.sessionInfo.placeId === placeId) {
							watchOnce(
								"#game-details-play-button-container .btn-common-play-game-lg",
							).then((btn) => {
								btn.addEventListener(
									"click",
									(e) => {
										e.stopImmediatePropagation();

										sendJoinMultiplayerGame({
											placeId,
											joinAttemptOrigin: "PlayButton",
											joinAttemptId: crypto.randomUUID(),
										});
									},
									{
										capture: true,
									},
								);
							});
						}
					}),
				),
			);
		}

		featureValueIs("checkExperienceBan", true, () =>
			getDeviceMeta().then((deviceMeta) =>
				getPlaceJoinData({
					placeId: rootPlaceId,
					overridePlatformType: deviceMeta?.platformType ?? "Desktop",
					gameJoinAttemptId: crypto.randomUUID(),
					joinOrigin: "RoSealFetchInfo",
					requireSuccessful: false,
				}).then((data) => {
					const ban = data?.statusData?.creatorExperienceBan;
					if (ban) {
						watchOnce("#game-detail-page").then((container) =>
							container.classList.add("user-is-banned"),
						);

						// user banned, add play button
						watchOnce("#game-details-play-button-container").then((container) =>
							renderAfter(<BannedPlayButton {...ban} />, container),
						);
					}
				}),
			),
		);

		featureValueIs("easyExperienceAltText", true, () => {
			watchOnce('#game-details-carousel-container div[data-testid="carousel"]').then(
				(container) => {
					const div = document.createElement("div");

					const rightControl = container.querySelector(".carousel-controls-right");
					if (rightControl) {
						rightControl.after(div);
					} else {
						container.prepend(div);
					}

					renderAsContainer(<AltText carouselContainer={container} />, div);
				},
			);
		});

		const liveStats = signal<LiveStatsSignal>();
		const liveStatsHistory = signal<LiveStatsHistorySignal>({
			visits: [[], []],
			playing: [[], []],
			favorites: [[], []],
			votes: [[], [], []],
		});

		multigetFeaturesValues([
			"experienceStatsTooltips.experienceLiveStats",
			"experienceLiveStatsChart",
		]).then(async (data) => {
			if (!(await isAuthenticated())) {
				return;
			}

			if (
				!data?.["experienceStatsTooltips.experienceLiveStats"]?.[0] &&
				!data.experienceLiveStatsChart
			)
				return;
			const interval = data["experienceStatsTooltips.experienceLiveStats"][1] ?? 10;

			const refSignal = signal<ChartJSOrUndefined>();
			if (data.experienceLiveStatsChart)
				watchOnce(".game-stat-container").then((statContainer) =>
					renderBefore(
						<ExperienceStatsChart data={liveStatsHistory} refSignal={refSignal} />,
						statContainer,
					),
				);

			if (data["experienceStatsTooltips.experienceLiveStats"][0]) {
				watch("#vote-up-text, #vote-down-text", (element) => {
					if (element.textContent)
						element.textContent = element.textContent.replace("+", "");
				});
			}

			setInterval(() => {
				Promise.all([
					multigetUniversesByIds({
						universeIds: [universeId],
						overrideCache: true,
					}).then((data) => data[0]),
					multigetOmniRecommendationsMetadata({
						contents: [
							{
								contentId: universeId,
								contentType: "Game",
							},
						],
						sessionId: crypto.randomUUID(),
						overrideCache: true,
					}).then((data) => data[0]),
					getPlaceVotes({
						placeId,
					}),
				]).then(([v1, v2, votes]) => {
					const visits = Math.max(v1.visits, liveStats.value?.visits ?? 0);
					const playing = v2.playerCount;
					const favorites = v1.favoritedCount;
					const upVotes = votes?.totalUpVotes ?? 0;
					const downVotes = votes?.totalDownVotes ?? 0;

					liveStats.value = {
						visits,
						playing,
						favorites,
						upVotes,
						downVotes,
						maxPlayers: v1.maxPlayers,
					};

					const time = getHourAndMinute(new Date());

					if (liveStatsHistory.value.playing[1].at(-1) !== playing) {
						liveStatsHistory.value.playing[0].push(time);
						liveStatsHistory.value.playing[1].push(playing);
					}
					if (liveStatsHistory.value.visits[1].at(-1) !== visits) {
						liveStatsHistory.value.visits[0].push(time);
						liveStatsHistory.value.visits[1].push(visits);
					}
					if (liveStatsHistory.value.favorites[1].at(-1) !== favorites) {
						liveStatsHistory.value.favorites[0].push(time);
						liveStatsHistory.value.favorites[1].push(favorites);
					}

					if (
						liveStatsHistory.value.votes[1].at(-1) !== upVotes ||
						liveStatsHistory.value.votes[2].at(-1) !== downVotes
					) {
						liveStatsHistory.value.votes[0].push(time);
						liveStatsHistory.value.votes[1].push(upVotes);
						liveStatsHistory.value.votes[2].push(downVotes);

						if (votes) {
							const allTimeUpVoteRatioText =
								document.body.querySelector("#all-time-upvote-ratio");
							if (allTimeUpVoteRatioText)
								allTimeUpVoteRatioText.textContent = asLocaleString(
									votes.upVotesRatio,
									{
										style: "percent",
										minimumFractionDigits: 0,
										maximumFractionDigits: 1,
									},
								)!;

							const percentageBackground =
								document.body.querySelector<HTMLDivElement>(
									"#voting-section .vote-percentage",
								);
							if (percentageBackground) {
								percentageBackground.style.setProperty(
									"width",
									`${votes.upVotesRatio * 100}%`,
								);
							}
						}

						if (data["experienceStatsTooltips.experienceLiveStats"][0]) {
							const downVoteText = document.body.querySelector("#vote-down-text");
							if (downVoteText) {
								downVoteText.textContent = abbreviateNumber(
									downVotes,
									undefined,
									0,
								)!;
								downVoteText.setAttribute("title", asLocaleString(downVotes)!);
							}

							const upVoteText = document.body.querySelector("#vote-up-text");
							if (upVoteText) {
								upVoteText.textContent = abbreviateNumber(upVotes, undefined, 0)!;
								upVoteText.setAttribute("title", asLocaleString(upVotes)!);
							}
						}
					}

					refSignal.value?.update();
				});
			}, interval * 1000);
		});

		featureValueIs("experienceStatsTooltips", true, async () => {
			const translation = await getLangNamespace("Feature.GameDetails");
			const initialFetch = await Promise.all([
				multigetUniversesByIds({
					universeIds: [universeId],
				}).then((data) => data[0]),
				multigetOmniRecommendationsMetadata({
					contents: [
						{
							contentId: universeId,
							contentType: "Game",
						},
					],
					sessionId: crypto.randomUUID(),
				}).then((data) => data[0]),
				getPlaceVotes({
					placeId,
				}),
			]);
			if (!initialFetch?.[0] || !initialFetch?.[1]) {
				return;
			}

			const playing = initialFetch[1].playerCount ?? initialFetch[0].playing;
			const visits = initialFetch[0].visits;
			const favorites = initialFetch[0].favoritedCount;
			const maxPlayers = initialFetch[0].maxPlayers;
			const upVotes = initialFetch[2]?.totalUpVotes ?? 0;
			const downVotes = initialFetch[2]?.totalDownVotes ?? 0;

			const time = getHourAndMinute(new Date());

			liveStats.value = {
				playing,
				visits,
				favorites,
				maxPlayers,
				upVotes,
				downVotes,
			};

			liveStatsHistory.value.playing[0].push(time);
			liveStatsHistory.value.playing[1].push(playing);

			liveStatsHistory.value.visits[0].push(time);
			liveStatsHistory.value.visits[1].push(visits);

			liveStatsHistory.value.favorites[0].push(time);
			liveStatsHistory.value.favorites[1].push(favorites);

			liveStatsHistory.value.votes[0].push(time);
			liveStatsHistory.value.votes[1].push(upVotes);
			liveStatsHistory.value.votes[2].push(downVotes);

			watchOnce(".game-stat-container").then((container) => {
				const list = container.querySelectorAll<HTMLElement>(".game-stat");

				for (const item of list) {
					const label = item.querySelector(".text-label")?.textContent;
					const text = item.querySelector<HTMLElement>(".font-caption-body");
					if (!label || !text) {
						continue;
					}

					const afterAbbreviate =
						label === translation["Label.Visits"] ? 999_999 : undefined;
					let index: keyof LiveStatsSignal;
					switch (label) {
						case translation["Label.Playing"]:
							index = "playing";
							break;
						case translation["Label.Visits"]:
							index = "visits";
							break;
						case translation["Label.Favorites"]:
							index = "favorites";
							break;
						case translation["Label.MaxPlayers"]:
							index = "maxPlayers";
							break;
						default:
							continue;
					}
					if (index === undefined) continue;

					renderAsContainer(() => {
						const [horizontalStatsEnabled] = useFeatureValue(
							"experienceVerticalStats",
							false,
						);
						const [currentValue, setCurrentValue] = useState(
							liveStats.value![index as keyof LiveStatsSignal],
						);
						const [newValue, newTooltip] = useMemo(() => {
							return [
								typeof currentValue === "string"
									? currentValue
									: afterAbbreviate &&
											typeof currentValue === "number" &&
											!horizontalStatsEnabled
										? abbreviateNumber(currentValue, afterAbbreviate)
										: asLocaleString(currentValue),
								asLocaleString(currentValue),
							];
						}, [currentValue, horizontalStatsEnabled]);

						useEffect(() => {
							const targetValue = liveStats.value![index];
							if (typeof targetValue !== "number") {
								return setCurrentValue(targetValue);
							}

							const startValue = typeof currentValue === "number" ? currentValue : 0;
							const diff = targetValue - startValue;

							// No need to animate if there's no change
							if (diff === 0) {
								return;
							}

							// Fixed animation duration of 3 seconds
							const duration = 3000;
							const steps = 60; // 60 steps = 50ms per step
							const stepTime = duration / steps;

							let progress = 0;

							const interval = setInterval(() => {
								progress += stepTime / duration;

								if (progress >= 1) {
									clearInterval(interval);
									setCurrentValue(targetValue);
									return;
								}

								// Use easeOutQuad for smoother animation
								const easeProgress = 1 - (1 - progress) * (1 - progress);

								const nextValue = Math.round(startValue + diff * easeProgress);
								setCurrentValue(nextValue);
							}, stepTime);

							return () => clearInterval(interval);
						}, [liveStats.value![index]]);

						return (
							<Tooltip
								as={Fragment}
								button={
									<p className="text-lead font-caption-body" title={newTooltip}>
										{newValue}
									</p>
								}
							>
								{newTooltip}
							</Tooltip>
						);
					}, text);
				}
			});
		});

		checkItemTimes("experiences").then((value) => {
			if (!value) {
				return;
			}

			watchOnce(".game-stat-container").then(async (container) => {
				const list = container.querySelectorAll<HTMLLIElement>(".game-stat");

				const translation = await getLangNamespace("Feature.GameDetails");
				let updated: HTMLLIElement | undefined;
				let created: HTMLElement | undefined;

				for (const item of list) {
					const label = item.querySelector(".text-label")?.textContent;
					if (label === translation["Label.Created"]) {
						created = item;
					} else if (label === translation["Label.Updated"]) {
						updated = item;
					}
				}

				if (created) {
					updated?.remove();
					renderAsContainer(<ExperienceCreatedDate placeId={placeId} />, created);
				}
			});
		});

		featureValueIs("addGroupExperiencesToProfile", true, async () => {
			if (!(await isAuthenticated())) {
				return;
			}

			const universeInfo = (
				await multigetUniversesByIds({
					universeIds: [universeId],
				})
			)?.[0];
			if (!universeInfo || universeInfo.creator.type !== "Group") {
				return;
			}
			const userRole = (
				await listUserGroupsRoles({
					userId: (await getAuthenticatedUser())!.userId,
				})
			).data.find((role) => role.group.id === universeInfo.creator.id)?.role;

			if (userRole?.rank !== 255) {
				return;
			}

			if (await watchBeforeLoad("#toggle-profile")) {
				return;
			}

			modifyItemContextMenu(
				<AddToProfileButton itemId={placeId} itemType="Asset" isPlace show />,
			);
		});

		featureValueIs("blockedItems", true, () => {
			watchOnce(".content").then((el) =>
				renderAppend(
					() => (
						<ItemBlockedScreen
							itemType="Universe"
							itemId={universeId}
							name={universeName}
						/>
					),
					el,
				),
			);

			modifyItemContextMenu(<BlockItemButton itemType="Universe" itemId={universeId} />);
		});

		if (canCreatePrivateServer || canPreCreatePrivateServer) {
			featureValueIs("privateServerLinksSection", true, () => {
				let div: HTMLDivElement | undefined;
				watch(
					"#running-game-instances-container #rbx-private-servers",
					(privateServers) => {
						if (!div) {
							div = document.createElement("div");
							div.id = "rbx-private-server-links";
							privateServers.after(div);

							renderIn(
								<PrivateServerLinkList
									startLinkCode={privateServerLinkCode}
									universeId={universeId}
									placeId={rootPlaceId}
									placeName={universeName}
								/>,
								div,
							);
						} else {
							privateServers.after(div);
						}
					},
				);
			});
		}

		featureValueIs("viewItemMedia", true, () => {
			modifyItemContextMenu(<ViewIconAssetButton itemType="Universe" itemId={universeId} />);

			getUniverseMedia({ universeId })
				.then(({ data: media }) => {
					const mediaIds: (number | null)[] = [];

					for (const item of media) {
						// Filter out unapproved videos - they do not show on the site
						if (item.assetTypeId !== 33 || item.approved) {
							mediaIds.push(item.imageId);
						}
					}

					if (mediaIds.length > 0) {
						watchOnce(
							'#game-details-carousel-container div[data-testid="carousel"]',
						).then((container) => {
							const div = document.createElement("div");

							const rightControl = container.querySelector(
								".carousel-controls-right",
							);
							if (rightControl) {
								rightControl.after(div);
							} else {
								container.prepend(div);
							}

							renderAsContainer(
								<ViewMediaAsset
									mediaIds={mediaIds}
									carouselContainer={container}
								/>,
								div,
							);
						});
					}
				})
				.catch(() => {});
		});
	},
} satisfies Page;
