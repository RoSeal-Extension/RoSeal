import prettyBytes from "pretty-bytes";
import {
	allowedItemsData,
	type BlockedItem,
	blockedItemsData,
	type CHAT_SORT_TYPES,
	KITTY_EMOJI_CODE,
	ROBLOX_CACHE_KEY_PREFIXES,
	ROBLOX_REALTIME_KEY_PREFIXES,
	SEAL_EMOJI_CODE,
} from "src/ts/constants/misc";
import { LISTEN_NOTIFICATION_TYPES } from "src/ts/constants/notifications";
import {
	render2SVChallengeInject,
	renderGenericChallengeInject,
} from "src/ts/helpers/challenges/challengesInject";
import {
	addMessageListener,
	invokeMessage,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { hideEl, watch } from "src/ts/helpers/elements";
import { featureValueIsInject, getFeatureValueInject } from "src/ts/helpers/features/helpersInject";
import { hijackRequest, hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackCreateElement } from "src/ts/helpers/hijack/react";
import { hijackFunction, onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { UserProfileResponse } from "src/ts/helpers/processors/profileProcessor";
import type {
	ListTransactionTotalsResponse,
	UserRobuxAmount,
} from "src/ts/helpers/requests/services/account";
import type {
	MarketplaceItemType,
	MultigetAvatarItemsResponse,
	SearchItemsDetailsResponse,
} from "src/ts/helpers/requests/services/marketplace";
import type {
	GetSearchLandingPageResponse,
	ListExperienceRecommendationsResponse,
	ListExperiencesAutocompleteSuggestionsResponse,
	ListMarketplaceAutocompleteSuggestionsInternalResponse,
	SearchResponse,
	SearchVerticalType,
} from "src/ts/helpers/requests/services/misc";
import type { ListedStreamNotification } from "src/ts/helpers/requests/services/notifications";
import type { BatchThumbnailRequest } from "src/ts/helpers/requests/services/thumbnails";
import type {
	ExperienceSort,
	GetOmniRecommendationsResponse,
	ListAgentUniversesResponse,
	ListExperienceSortsResponse,
} from "src/ts/helpers/requests/services/universes";
import {
	type ListUserOnlineFriendsResponse,
	multigetProfileData,
	type MultigetProfileDataRequest,
	type MultigetProfileDataResponse,
	multigetUsersByIds,
	type ProfileField,
	type ProfileFieldName,
} from "src/ts/helpers/requests/services/users";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { getRobloxCDNUrl, getRobloxUrl } from "src/ts/utils/baseUrls";
import { isAvatarItemBlocked, isExperienceBlocked } from "src/ts/utils/blockedItems";
import { warn } from "src/ts/utils/console";
import currentUrl from "src/ts/utils/currentUrl";
import { injectScripts } from "src/ts/utils/dom";
import { chunk, crossSort, getByTarget } from "src/ts/utils/objects";
import {
	AVATAR_ITEM_REGEX,
	AVATAR_MARKETPLACE_REGEX,
	MY_AVATAR_REGEX,
	USER_FAVORITES_REGEX,
	USER_INVENTORY_REGEX,
} from "src/ts/utils/regex";
import { getRobloxI18nNamespace } from "src/ts/utils/robloxI18n";
import { getPathFromMaybeUrl } from "src/ts/utils/url";

export default {
	id: "all",
	isAllPages: true,
	fn: () => {
		setInvokeListener("renderGenericChallenge", renderGenericChallengeInject);
		setInvokeListener("render2SVChallenge", render2SVChallengeInject);
		setInvokeListener("injectScripts", injectScripts);

		addMessageListener("updateDocumentTitle", (title) => {
			const library = window.angular?.element('[ng-controller="chatController"]')?.scope<
				angular.IScope & {
					chatLibrary: {
						currentTabTitle: string;
					};
				}
			>()?.chatLibrary;
			if (library) {
				library.currentTabTitle = title;
			}
		});

		addMessageListener("triggerHandler", ([type, args]) => {
			window.$(document).triggerHandler(type, args);
		});

		featureValueIsInject("removeNotificationAdvertisements", true, () =>
			hijackResponse(async (req, res) => {
				if (!res?.ok) return;

				const url = new URL(req.url);
				if (
					url.hostname === getRobloxUrl("notifications") &&
					url.pathname === "/v2/stream-notifications/get-recent"
				) {
					const data = (await res.json()) as ListedStreamNotification[];
					for (let i = 0; i < data.length; i++) {
						const item = data[i];
						if (item.content?.notificationType === "SpecialItem") {
							data.splice(i, 1);
							i--;
						}
					}

					return new Response(JSON.stringify(data), res);
				}
			}),
		);

		getFeatureValueInject("userAvatarHeadshotOverride", true).then((value) => {
			if (!value?.[0]) return;

			hijackRequest((req) => {
				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("thumbnails") && url.pathname === "/v1/batch") {
					return req
						.clone()
						.json()
						.then((data) => {
							for (const item of data as BatchThumbnailRequest[]) {
								if (item.type === "AvatarHeadShot") {
									item.type = value[1];
								}
							}
							return new Request(req, {
								body: JSON.stringify(data),
							});
						});
				}

				return req;
			});
		});

		featureValueIsInject("showOfflineStatusIcon", true, () =>
			onSet(window, "RobloxPresence").then((presence) => {
				let shouldFakeValue = false;
				hijackFunction(
					presence,
					(target, thisArg, args) => {
						shouldFakeValue = true;
						const res = target.apply(thisArg, args);

						if (window.React.isValidElement(res)) {
							const classList = res.props?.className.split(" ");
							if (classList) {
								for (let i = 0; i < classList.length; i++) {
									const item = classList[i];
									if (item === "icon-") {
										classList[i] = "roseal-offline-icon";
										res.props.className = classList.join(" ");

										if (res.props.title) delete res.props.title;

										break;
									}
								}
							}
						}

						return res;
					},
					"PresenceStatusIcon",
				);

				const offlineOriginalValue = presence.PresenceType.Offline;
				Object.defineProperty(presence.PresenceType, "Offline", {
					get: () => {
						if (shouldFakeValue) {
							shouldFakeValue = false;
							return -1;
						}

						return offlineOriginalValue;
					},
				});
			}),
		);

		featureValueIsInject("robuxHistoryChart", true, () => {
			const ECONOMY_CURRENCY_URL_REGEX = /^\/v1\/users\/(\d+)\/currency$/;
			hijackResponse(async (req, res) => {
				if (!res?.ok) return;

				const url = new URL(req.url);

				if (url.hostname === getRobloxUrl("economy")) {
					const match = ECONOMY_CURRENCY_URL_REGEX.exec(url.pathname);
					if (match) {
						const userId = Number.parseInt(match[1], 10);
						const { robux } = (await res.clone().json()) as UserRobuxAmount;

						sendMessage("recordRobuxHistory", {
							userId,
							robux,
						});
					}
				}
			});
		});

		featureValueIsInject("customRobuxPrecision", true, async () => {
			const abbreviateAfter = await getFeatureValueInject(
				"customRobuxPrecision.abbreviateAfter",
			);
			const decimalPoints = await getFeatureValueInject("customRobuxPrecision.decimalPoints");

			let hijackPrecisionNumber: number | undefined;

			hijackCreateElement(
				(type, props) =>
					props !== null &&
					"robuxAmount" in props &&
					String(type).includes("nav-robux-amount"),
				(createElement, type, props, ...children) => {
					hijackPrecisionNumber = (props as Record<string, number>).robuxAmount;
					// @ts-expect-error: shut up...
					return createElement(type, props, ...children);
				},
			);

			onSet(window, "CoreUtilities").then((utilities) =>
				onSet(utilities, "abbreviateNumber").then((abbreviate) => {
					hijackFunction(
						abbreviate,
						(target, thisArg, args) => {
							if (hijackPrecisionNumber === args[0]) {
								if (abbreviateAfter?.[0]) args[1] = abbreviateAfter[1];
								if (decimalPoints?.[0]) {
									args[3] = decimalPoints[1];
								}

								hijackPrecisionNumber = undefined;
							}

							return target.apply(thisArg, args);
						},
						"getTruncValue",
					);
				}),
			);
		});

		featureValueIsInject("pendingRobuxNav", true, () =>
			hijackResponse(async (req, res) => {
				if (!res?.ok) return;

				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("apis")) {
					const match = url.pathname.match(
						/^\/transaction-records\/v1\/users\/(\d+)\/transaction-totals$/,
					);
					if (match) {
						const userId = Number.parseInt(match[1], 10);
						const data = (await res.clone().json()) as ListTransactionTotalsResponse;

						sendMessage("updatePendingRobux", {
							robux: data.pendingRobuxTotal,
							userId,
						});
					}
				}
			}),
		);

		featureValueIsInject("improvedServerJoinModal", true, () => {
			onSet(window, "Roblox")
				.then((roblox) => onSet(roblox, "ProtocolHandlerClientInterface"))
				.then((launcher) => {
					hijackFunction(
						launcher,
						(_, __, args) => {
							const promise = window.$.Deferred();

							invokeMessage("setGameLaunchData", {
								type: "playWithUser",
								userId: args[0].userId,
								joinAttemptId: args[0].joinAttemptId,
								joinAttemptOrigin: args[0].joinAttemptOrigin,
							})
								.then(promise?.resolve)
								.catch(promise?.reject);

							return promise;
						},
						"followPlayerIntoGame",
					);

					hijackFunction(
						launcher,
						(_, __, args) => {
							const promise = window.$?.Deferred?.();

							invokeMessage("setGameLaunchData", {
								type: "specific",
								placeId: args[0].placeId,
								gameId: args[0].gameId,
								joinAttemptId: args[0].joinAttemptId,
								joinAttemptOrigin: args[0].joinAttemptOrigin,
								referredByPlayerId: args[0].referredByPlayerId,
							})
								.then(promise?.resolve)
								.catch(promise?.reject);

							return promise;
						},
						"joinGameInstance",
					);

					hijackFunction(
						launcher,
						(_, __, args) => {
							const promise = window.$?.Deferred?.();

							invokeMessage("setGameLaunchData", {
								type: "matchmade",
								placeId: args[0].placeId,
								joinAttemptId: args[0].joinAttemptId,
								joinAttemptOrigin: args[0].joinAttemptOrigin,
								joinData: {
									eventId: args[0].eventId,
									launchData: args[0].launchData,
								},
								referredByPlayerId: args[0].referredByPlayerId,
							})
								.then(promise?.resolve)
								.catch(promise?.reject);

							return promise;
						},
						"joinMultiplayerGame",
					);

					hijackFunction(
						launcher,
						(_, __, args) => {
							const promise = window.$?.Deferred?.();

							invokeMessage("setGameLaunchData", {
								type: "privateServer",
								placeId: args[0].placeId,
								accessCode: args[0].accessCode,
								linkCode: args[0].linkCode,
								joinAttemptId: args[0].joinAttemptId,
								joinAttemptOrigin: args[0].joinAttemptOrigin,
							})
								.then(promise?.resolve)
								.catch(promise?.reject);
						},
						"joinPrivateGame",
					);
				});
		});

		addMessageListener(
			"setBlockedItems",
			({ blockedItems: blockedData, allowedItems: allowedData }) => {
				blockedItemsData.value = blockedData;
				allowedItemsData.value = allowedData;

				const blockedItems: BlockedItem[] = [];

				let isAvatarMarketplace = AVATAR_MARKETPLACE_REGEX.test(
					currentUrl.value.path.realPath,
				);
				let shouldNotBlock =
					USER_FAVORITES_REGEX.test(currentUrl.value.path.realPath) ||
					USER_INVENTORY_REGEX.test(currentUrl.value.path.realPath) ||
					MY_AVATAR_REGEX.test(currentUrl.value.path.realPath);
				currentUrl.subscribe((value) => {
					isAvatarMarketplace = AVATAR_MARKETPLACE_REGEX.test(value.path.realPath);
					shouldNotBlock =
						USER_FAVORITES_REGEX.test(value.path.realPath) ||
						USER_INVENTORY_REGEX.test(value.path.realPath) ||
						MY_AVATAR_REGEX.test(value.path.realPath);
				});

				watch(
					".item-card .item-card-name, .item-card-container .item-card-name",
					(name) => {
						if (!isAvatarMarketplace || shouldNotBlock) return;

						const card = name.closest<HTMLElement>(
							".item-card, .catalog-item-container",
						)!;
						const link = card.querySelector<HTMLAnchorElement>(
							"a.item-card-link, a.item-card-container",
						)?.href;
						if (link) {
							const path = getPathFromMaybeUrl(link).realPath;
							const match = AVATAR_ITEM_REGEX.exec(path);

							const itemType = match?.[1] === "bundles" ? "Bundle" : "Asset";

							const idStr = match?.[2];
							if (itemType && idStr) {
								const id = Number.parseInt(idStr, 10);
								if (
									blockedItems.some(
										(item) => item.type === itemType && item.id === id,
									)
								) {
									hideEl(card, true, "data-item-is-blocked");
								}
							}
						}

						const thumbnailContainer = card.querySelector(
							"thumbnail-2d .thumbnail-2d-container",
						);
						if (thumbnailContainer) {
							const type =
								thumbnailContainer.getAttribute("thumbnail-type") ===
								"BundleThumbnail"
									? "Bundle"
									: "Asset";

							const idStr = thumbnailContainer.getAttribute("thumbnail-target-id");
							if (type && idStr) {
								const id = Number.parseInt(idStr, 10);
								if (
									blockedItems.some(
										(item) => item.type === type && item.id === id,
									)
								) {
									hideEl(card, true, "data-item-is-blocked");
								}
							}
						}
					},
				);

				hijackResponse(async (req, res) => {
					if (!res?.ok) {
						return;
					}

					if (shouldNotBlock) {
						return;
					}

					const _hasCreatorConfig =
						blockedData?.creators.length || allowedItemsData.value?.creators.length;
					const hasCreatorConfig =
						_hasCreatorConfig !== undefined && _hasCreatorConfig !== 0;
					const _hasItemConfig =
						blockedData?.items.items.length ||
						blockedData?.items.names.length ||
						blockedData?.items.descriptions.length ||
						allowedItemsData.value?.items.items.length ||
						hasCreatorConfig;
					const hasItemConfig =
						_hasItemConfig !== undefined &&
						_hasItemConfig !== 0 &&
						_hasItemConfig !== false;
					const _hasExperienceConfig =
						blockedData?.experiences.ids.length ||
						blockedData?.experiences.names.length ||
						blockedData?.experiences.descriptions.length ||
						allowedItemsData.value?.experiences.ids.length ||
						hasCreatorConfig;
					const hasExperienceConfig =
						_hasExperienceConfig !== undefined &&
						_hasExperienceConfig !== 0 &&
						_hasExperienceConfig !== false;
					const _shouldExperienceRequest =
						hasCreatorConfig || blockedData?.experiences.descriptions.length;
					const shouldExperienceRequest =
						_shouldExperienceRequest !== undefined && _shouldExperienceRequest !== 0;

					if (!hasItemConfig && !hasExperienceConfig) {
						return;
					}

					const url = new URL(req.url);
					if (url.hostname === getRobloxUrl("catalog")) {
						const isSearchDetails =
							url.pathname === "/v2/search/items/details" ||
							url.pathname === "/v1/search/items/details";
						if (
							(url.pathname === "/v1/catalog/items/details" || isSearchDetails) &&
							hasItemConfig
						) {
							const data = (await res.clone().json()) as
								| MultigetAvatarItemsResponse<MarketplaceItemType>
								| SearchItemsDetailsResponse<MarketplaceItemType>;

							if (
								data.data.length === 1 &&
								AVATAR_ITEM_REGEX.test(currentUrl.value.path.realPath) &&
								!isSearchDetails
							) {
								return;
							}

							for (let i = 0; i < data.data.length; i++) {
								const item = data.data[i];

								if (
									isAvatarItemBlocked(
										item.id,
										item.itemType,
										item.creatorType,
										item.creatorTargetId,
										item.name,
										item.description,
									)
								) {
									data.data.splice(i, 1);
									i--;

									if (
										isAvatarMarketplace &&
										!isSearchDetails &&
										!blockedItems.some(
											(item2) =>
												item2.id === item.id &&
												item2.type === item.itemType,
										)
									) {
										blockedItems.push({
											id: item.id,
											type: item.itemType,
										});
									}
								}
							}

							if (isAvatarMarketplace && !isSearchDetails) {
								return;
							}
							return new Response(JSON.stringify(data), res);
						}
					} else if (
						url.hostname === getRobloxUrl("apis") ||
						url.hostname === getRobloxCDNUrl("apis")
					) {
						if (
							url.pathname === "/explore-api/v1/get-sort-content" &&
							hasExperienceConfig
						) {
							const data = (await res.clone().json()) as ExperienceSort;

							if (data.contentType !== "Games" || !data.games) {
								return;
							}

							const checkUniverseIds: number[] = [];
							if (shouldExperienceRequest)
								for (const item of data.games) {
									checkUniverseIds.push(item.universeId);
								}

							const checkUniverseData = shouldExperienceRequest
								? await invokeMessage("checkBlockedUniverses", {
										ids: checkUniverseIds,
									})
								: undefined;

							for (let i = 0; i < data.games.length; i++) {
								const game = data.games[i];
								if (
									isExperienceBlocked(
										game.universeId,
										undefined,
										undefined,
										game.name,
										undefined,
										checkUniverseData,
									)
								) {
									data.games.splice(i, 1);
									i--;
								}
							}

							return new Response(JSON.stringify(data), res);
						}

						if (
							url.pathname.startsWith("/games-autocomplete/v1/get-suggestion/") &&
							hasExperienceConfig
						) {
							const data = (await res
								.clone()
								.json()) as ListExperiencesAutocompleteSuggestionsResponse;

							for (let i = 0; i < data.entries.length; i++) {
								const entry = data.entries[i];

								if (
									isExperienceBlocked(
										undefined,
										undefined,
										undefined,
										entry.searchQuery,
									)
								) {
									data.entries.splice(i, 1);
									i--;
								}
							}

							return new Response(JSON.stringify(data), res);
						}

						if (url.pathname === "/autocomplete-avatar/v2/suggest" && hasItemConfig) {
							const data = (await res
								.clone()
								.json()) as ListMarketplaceAutocompleteSuggestionsInternalResponse;

							for (let i = 0; i < data.Data.length; i++) {
								const item = data.Data[i];

								if (
									isAvatarItemBlocked(
										undefined,
										undefined,
										undefined,
										undefined,
										item.Query,
									)
								) {
									data.Data.splice(i, 1);
									i--;
								}
							}

							return new Response(JSON.stringify(data), res);
						}
						if (url.pathname === "/explore-api/v1/get-sorts" && hasExperienceConfig) {
							const data = (await res.clone().json()) as ListExperienceSortsResponse;

							const checkUniverseIds: number[] = [];
							if (shouldExperienceRequest)
								for (const sort of data.sorts) {
									if (sort.contentType === "Games" && sort.games) {
										for (const game of sort.games) {
											checkUniverseIds.push(game.universeId);
										}
									}
								}
							const checkUniverseData = shouldExperienceRequest
								? await invokeMessage("checkBlockedUniverses", {
										ids: checkUniverseIds,
									})
								: undefined;

							for (const sort of data.sorts) {
								if (sort.contentType === "Games" && sort.games) {
									for (let i = 0; i < sort.games.length; i++) {
										const game = sort.games[i];

										if (
											isExperienceBlocked(
												game.universeId,
												undefined,
												undefined,
												game.name,
												undefined,
												checkUniverseData,
											)
										) {
											sort.games.splice(i, 1);
											i--;
										}
									}
								}
							}

							return new Response(JSON.stringify(data), res);
						}

						if (
							url.pathname === "/search-api/search-landing-page" &&
							hasExperienceConfig
						) {
							const data = (await res.clone().json()) as GetSearchLandingPageResponse;

							const checkUniverseIds: number[] = [];
							if (shouldExperienceRequest) {
								for (const sort of data.sorts) {
									if (sort.contentType === "Game") {
										for (const item of sort.games) {
											checkUniverseIds.push(item.universeId);
										}
									}
								}
							}

							const checkUniverseData = shouldExperienceRequest
								? await invokeMessage("checkBlockedUniverses", {
										ids: checkUniverseIds,
									})
								: undefined;

							for (const sort of data.sorts) {
								for (let i = 0; i < sort.games.length; i++) {
									const item = sort.games[i];

									if (
										isExperienceBlocked(
											item.universeId,
											undefined,
											undefined,
											item.name,
											undefined,
											checkUniverseData,
										)
									) {
										sort.games.splice(i, 1);
										i--;
									}
								}
							}

							return new Response(JSON.stringify(data), res);
						}

						if (url.pathname === "/search-api/omni-search" && hasExperienceConfig) {
							const data = (await res
								.clone()
								.json()) as SearchResponse<SearchVerticalType>;

							if (data.vertical === "Game" && data.searchResults) {
								const checkUniverseIds: number[] = [];

								if (shouldExperienceRequest)
									for (const result of data.searchResults) {
										if (result.contentGroupType === "Game") {
											for (const content of result.contents) {
												if (content.contentType === "Game") {
													checkUniverseIds.push(content.universeId);
												}
											}
										}
									}

								const checkUniverseData = shouldExperienceRequest
									? await invokeMessage("checkBlockedUniverses", {
											ids: checkUniverseIds,
										})
									: undefined;

								for (const result of data.searchResults) {
									if (result.contentGroupType === "Game") {
										for (let i = 0; i < result.contents.length; i++) {
											const content = result.contents[i];
											if (content.contentType !== "Game") continue;

											if (
												isExperienceBlocked(
													content.universeId,
													undefined,
													undefined,
													content.name,
													undefined,
													checkUniverseData,
												)
											) {
												result.contents.splice(i, 1);
												i--;
											}
										}
									}
								}

								return new Response(JSON.stringify(data), res);
							}
						}

						if (
							url.pathname === "/discovery-api/omni-recommendation" &&
							hasExperienceConfig
						) {
							const data = (await res
								.clone()
								.json()) as GetOmniRecommendationsResponse;

							const checkUniverseIds: number[] = [];
							if (shouldExperienceRequest)
								for (const sort of data.sorts) {
									if (sort.recommendationList) {
										for (const item of sort.recommendationList) {
											if (item.contentType === "Game") {
												checkUniverseIds.push(item.contentId);
											}
										}
									}
								}
							const checkUniverseData = shouldExperienceRequest
								? await invokeMessage("checkBlockedUniverses", {
										ids: checkUniverseIds,
									})
								: undefined;

							for (const sort of data.sorts) {
								if (sort.recommendationList) {
									for (let i = 0; i < sort.recommendationList.length; i++) {
										const item = sort.recommendationList[i];
										if (item.contentType === "Game") {
											const universe =
												data.contentMetadata?.Game?.[item.contentId];

											if (
												isExperienceBlocked(
													item.contentId,
													undefined,
													undefined,
													universe?.name,
													undefined,
													checkUniverseData,
												)
											) {
												sort.recommendationList.splice(i, 1);
												i--;
											}
										}
									}
								}
							}

							return new Response(JSON.stringify(data), res);
						}
					} else if (url.hostname === getRobloxUrl("games")) {
						if (
							url.pathname.startsWith("/v1/games/recommendations/game/") &&
							hasExperienceConfig
						) {
							const data = (await res
								.clone()
								.json()) as ListExperienceRecommendationsResponse;

							const checkUniverseIds: number[] = [];
							if (shouldExperienceRequest)
								for (const item of data.games) {
									checkUniverseIds.push(item.universeId);
								}

							const checkUniverseData = blockedData?.experiences.descriptions.length
								? await invokeMessage("checkBlockedUniverses", {
										ids: checkUniverseIds,
									})
								: undefined;

							for (let i = 0; i < data.games.length; i++) {
								const game = data.games[i];
								if (
									isExperienceBlocked(
										game.universeId,
										undefined,
										undefined,
										game.name,
										undefined,
										checkUniverseData,
									)
								) {
									data.games.splice(i, 1);
									i--;
								}
							}

							return new Response(JSON.stringify(data), res);
						}

						const match = url.pathname.match(
							/^\/v2\/(users|groups)\/(\d+)\/games(V2)?$/,
						);

						if (match) {
							const [, typeStr, idStr] = match;
							const id = Number.parseInt(idStr, 10);
							const type = typeStr === "users" ? "User" : "Group";

							const data = (await res.clone().json()) as ListAgentUniversesResponse;
							for (let i = 0; i < data.data.length; i++) {
								const game = data.data[i];
								if (
									isExperienceBlocked(
										game.id,
										type,
										id,
										game.name,
										game.description,
									)
								) {
									data.data.splice(i, 1);
									i--;
								}
							}

							return new Response(JSON.stringify(data), res);
						}
					}
				});
			},
		);

		setInvokeListener("blankCall", (data) => {
			return getByTarget(data.fn)?.(...(data.args || []));
		});

		setInvokeListener("blankGet", (data) => {
			return getByTarget(data.target);
		});

		featureValueIsInject("launcherDisableEmptyChannelName", true, () =>
			onSet(window, "angular").then((angular) =>
				onSet(window, "Roblox")
					.then((roblox) => onSet(roblox, "GameLauncher"))
					.then((gameLauncher) => {
						angular
							.element(gameLauncher as unknown as Element)
							?.on("startClientAttempted", (_, data) => {
								if (data.params.otherParams.channel === "") {
									delete data.params.otherParams.channel;
								}
							});
					}),
			),
		);

		featureValueIsInject("disableSearchLandingNav", true, () =>
			onSet(window, "Roblox")
				.then((roblox) => onSet(roblox, "SearchLandingService"))
				.then((service) => {
					Object.defineProperty(service, "mountSearchLanding", {
						get: () => () => {},
						set: () => {},
					});
					Object.defineProperty(service, "showSearchLanding", {
						get: () => false,
					});
				}),
		);

		featureValueIsInject("showDeletedUsersUsernames", true, () =>
			getRobloxI18nNamespace("Feature.NotApproved").then((naemspace) => {
				const label = naemspace["Heading.AccountDeleted"];
				if (!label) return;

				hijackResponse(async (req, res) => {
					if (!res) return;

					const url = new URL(req.url);
					if (
						url.hostname === getRobloxUrl("apis") &&
						url.pathname === "/user-profile-api/v1/user/profiles/get-profiles"
					) {
						const data = (await res?.clone()?.json()) as MultigetProfileDataResponse<
							ProfileField,
							ProfileFieldName
						>;
						const userIdToDataMapping = new Map<number, UserProfileResponse>();
						for (const item of data.profileDetails) {
							if (
								(item.isDeleted && item.names) ||
								(item.names?.combinedName === label &&
									(!item.names.username || item.names.username === label))
							) {
								userIdToDataMapping.set(item.userId, item);
							}
						}

						if (!userIdToDataMapping.size) return;

						return multigetUsersByIds({
							userIds: Array.from(userIdToDataMapping.keys()),
						}).then((data2) => {
							for (const item of data2) {
								const map = userIdToDataMapping.get(item.id);

								if (map) {
									if (map.names.combinedName) {
										map.names.combinedName = item.displayName;
									}

									if (map.names.displayName) {
										map.names.displayName = item.displayName;
									}

									if (map.names.username) {
										map.names.username = item.name;
									}
								}
							}

							return new Response(JSON.stringify(data), res);
						});
					}
				});
			}),
		);

		setInvokeListener("getLangNamespace", getRobloxI18nNamespace);

		// meow
		onSet(window, "Roblox").then((roblox) => {
			roblox.Seal = () => document.body.replaceWith(SEAL_EMOJI_CODE);
			roblox.Cat = () => {
				const rokitty = document.createElement("a");
				rokitty.style.setProperty("text-decoration", "none");
				rokitty.href = "https://rokitty.app";
				rokitty.textContent = KITTY_EMOJI_CODE;

				document.body.replaceWith(rokitty);
			};

			onSet(roblox, "RealTime").then((realTime) => {
				const client = realTime.Factory.GetClient();
				for (const type of LISTEN_NOTIFICATION_TYPES) {
					client.Subscribe(type, (data) => {
						sendMessage("realtimeNotification", {
							type,
							data,
						});
					});
				}
			});
			onSet(roblox, "CrossTabCommunication").then((crossTabCommunication) => {
				crossTabCommunication?.Kingmaker?.SubscribeToMasterChange((isMaster) => {
					sendMessage("masterTabChange", {
						isMaster,
					});
				});
			});

			setInvokeListener(
				"isMasterTab",
				() => roblox.CrossTabCommunication?.Kingmaker?.IsMasterTab() ?? false,
			);
		});

		hijackResponse(async (req, res) => {
			if (!res?.ok) return;

			const url = new URL(req.url);
			if (
				url.hostname === getRobloxUrl("friends") &&
				url.pathname.match(/^\/v1\/users\/\d+\/friends\/online$/)
			) {
				const data = (await res.clone().json()) as ListUserOnlineFriendsResponse;

				sendMessage("onlineFriendsFetched", data);
			}
		});

		setInvokeListener("chat.setupSortTypes", () => {
			return new Promise<void>((resolve) => {
				onSet(window, "angular").then((angular) => {
					watch("#chat-container", (element, kill) => {
						const scope = angular.element(element)?.scope<
							angular.IScope & {
								updateChatViewModel: () => void;
								chatUserDict: Record<
									string,
									{
										id: string;
										hasUnreadMessages: boolean;
										lastUpdated: string;
										displayMessage?: {
											parsedTimestamp: number;
										};
										created_at: string;
									}
								>;
								chatLibrary: {
									chatLayoutIds: string[];
								};
							}
						>?.();
						if (!scope) return;

						kill?.();
						let latestSortType: (typeof CHAT_SORT_TYPES)[number] | undefined;

						const updateChatConversations = (fromUpdate = false) => {
							if (!latestSortType) return;

							const ids = crossSort(Object.entries(scope.chatUserDict), (a, b) => {
								const aValue =
									a[1].displayMessage?.parsedTimestamp ??
									Date.parse(a[1].lastUpdated);
								const bValue =
									b[1].displayMessage?.parsedTimestamp ??
									Date.parse(b[1].lastUpdated);

								return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
							}).map(([index]) => index);

							if (latestSortType === "Default") {
								scope.chatLibrary.chatLayoutIds = ids;
							} else {
								scope.chatLibrary.chatLayoutIds = crossSort(ids, (a, b) => {
									const aConversation = scope.chatUserDict[a];
									const bConversation = scope.chatUserDict[b];

									switch (latestSortType) {
										case "UnreadFirst": {
											return aConversation.hasUnreadMessages
												? bConversation.hasUnreadMessages
													? 0
													: -1
												: 1;
										}
										case "NewestFirst": {
											return (
												new Date(bConversation.created_at).getTime() -
												new Date(aConversation.created_at).getTime()
											);
										}
										case "OldestFirst": {
											return (
												new Date(aConversation.created_at).getTime() -
												new Date(bConversation.created_at).getTime()
											);
										}
										// Should never reach this branch
										default: {
											return 0;
										}
									}
								});
							}

							if (!fromUpdate) scope.$apply();
						};

						hijackFunction(
							scope,
							(target, thisArg, args) => {
								const result = target.apply(thisArg, args);
								updateChatConversations(true);

								return result;
							},
							"updateChatViewModel",
						);

						addMessageListener("chat.updateSortType", (sortType) => {
							latestSortType = sortType;
							updateChatConversations();
						});

						resolve();
					});
				});
			});
		});

		featureValueIsInject("fixRobloxKingmakerAccountSwitching", true, () => {
			getAuthenticatedUser().then((authedUser) => {
				if (!authedUser) return;

				window.addEventListener(
					"storage",
					(e: StorageEvent) => {
						const key = e.key;
						for (const match of ROBLOX_REALTIME_KEY_PREFIXES) {
							if (typeof key === "string" && key.startsWith(match)) {
								const newKey = key.split(`:${authedUser.userId}`)[0];
								if (newKey === key) return;

								Object.defineProperty(e, "key", {
									get: () => newKey,
								});

								return;
							}
						}
					},
					{
						capture: true,
					},
				);

				for (const key of ["getItem", "setItem", "removeItem"]) {
					hijackFunction(
						globalThis.localStorage,
						(target, thisArg, args) => {
							for (const match of ROBLOX_REALTIME_KEY_PREFIXES) {
								if (typeof args[0] === "string" && args[0].startsWith(match)) {
									args[0] = `${args[0]}:${authedUser.userId}`;
									break;
								}
							}

							return target.apply(thisArg, args);
						},
						key,
					);
				}
			});
		});

		featureValueIsInject("clearRobloxCacheAutomatically", true, () => {
			hijackFunction(
				globalThis.localStorage,
				(target, thisArg, args) => {
					try {
						return target.apply(thisArg, args);
					} catch (err: unknown) {
						if (!(err instanceof DOMException) || err.name !== "QuotaExceededError") {
							throw err;
						}

						const keysRemoved = new Set<string>();
						let keysRemovedSize = 0;
						for (const key in globalThis.localStorage) {
							if (
								ROBLOX_CACHE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))
							) {
								keysRemovedSize +=
									(globalThis.localStorage.getItem(key)?.length ?? 0) +
									key.length;
								globalThis.localStorage.removeItem(key);
								keysRemoved.add(key);
							}
						}

						warn(
							`Removed ${prettyBytes(keysRemovedSize)} of cache (${keysRemoved.size} keys) due to quota exceeded`,
						);
						return target.apply(thisArg, args);
					}
				},
				"setItem",
			);
		});

		setInvokeListener("setup3DThumbnail", (data) => {
			const element = document.querySelector(data.selector);
			if (!element) return;

			window.ReactDOM.render(
				window.React.createElement(window.RobloxThumbnail3d!.Thumbnail3d!, {
					targetId: 1,
					getThumbnailJson: () => ({
						data: data.json,
					}),
				}),
				element,
			);
		});

		featureValueIsInject("3dThumbnailDynamicLighting", true, () => {
			// JUST IN CASE.
			const el = document.createElement("meta");
			el.id = "use-dynamic-thumbnail-lighting";
			el.setAttribute("name", "3d-dynamic-lighting");
			el.setAttribute("data-use-dynamic-thumbnail-lighting", "True");
			document.head.append(el);

			hijackCreateElement(
				(_, props) => !!props && "targetId" in props,
				(_, __, props) => {
					const propsType = props as unknown as {
						useDynamicLighting: boolean;
					};

					propsType.useDynamicLighting = true;
				},
			);

			onSet(window, "RobloxThumbnail3d").then((thumbnail3d) => {
				if (thumbnail3d?.thumbnail3dService?.loadObjAndMtl3D) {
					hijackFunction(
						thumbnail3d.thumbnail3dService,
						(target, thisArg, [targetId, element, json]) => {
							return target.apply(thisArg, [targetId, element, json, true]);
						},
						"loadObjAndMtl3D",
					);
				}
			});
		});

		featureValueIsInject("profileFetchFixes", true, () => {
			hijackRequest(async (req) => {
				const url = new URL(req.url);
				if (
					url.hostname === getRobloxUrl("apis") &&
					url.pathname === "/user-profile-api/v1/user/profiles/get-profiles"
				) {
					const data = (await req.clone().json()) as MultigetProfileDataRequest<
						ProfileField,
						ProfileFieldName
					>;

					if (data.userIds.length > 200) {
						return Promise.all(
							chunk(data.userIds, 200).map((userIds) =>
								multigetProfileData({
									userIds,
									fields: data.fields,
								}).then((data) => data.profileDetails),
							),
						).then((items) => {
							return new Response(
								JSON.stringify({
									profileDetails: items.flat(),
								}),
								{
									status: 200,
									headers: {
										"content-type": "application/json",
									},
								},
							);
						});
					}
				}
			});
		});
	},
} satisfies Page;
