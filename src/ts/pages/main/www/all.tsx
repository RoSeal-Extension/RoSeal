import { signal } from "@preact/signals";
import { render } from "preact";
import { useState } from "preact/hooks";
import ChatSortTypes from "src/ts/components/chat/SortTypes";
import Alert from "src/ts/components/core/Alert";
import Tooltip from "src/ts/components/core/Tooltip";
import DevExableRobuxAmount from "src/ts/components/experience/DevExableRobuxAmount";
import ChangeAvatarChatOptInButton from "src/ts/components/misc/ChangeAvatarChatOptInButton";
import ChangeJoinPrivacyButton from "src/ts/components/misc/ChangeJoinPrivacyButton";
import ChangeOnlineStatusPrivacyButton from "src/ts/components/misc/ChangeOnlineStatusPrivacyButton";
import ChangeVoiceOptInButton from "src/ts/components/misc/ChangeVoiceOptInButton";
import FastUserSearch from "src/ts/components/misc/FastUserSearch";
import PremiumStatusButton from "src/ts/components/misc/PremiumStatusButton";
import ShowcaseExperienceEventsNav from "src/ts/components/misc/ShowcaseExperienceEventsNav";
import SwitchThemeButton from "src/ts/components/misc/SwitchThemeButton";
import AgreementsUpdatedModal from "src/ts/components/modals/AgreementsUpdatedModal";
import JoinServerModal from "src/ts/components/modals/JoinServerModal";
import OnboardingModal from "src/ts/components/modals/OnboardingModal";
import PreventLogoutModal from "src/ts/components/modals/PreventLogoutModal";
import RobloxSessionModal from "src/ts/components/modals/RobloxSessionModal";
import VoiceChatSuspendedModal from "src/ts/components/modals/VoiceChatSuspendedModal";
import AccountsPopover from "src/ts/components/navigation/accounts/AccountsPopover";
import NavigationFavorites from "src/ts/components/navigation/Favorites";
import NavigationDesktopApp from "src/ts/components/navigation/OpenDesktopApp";
import { ACCOUNTS_FEATURE_ID } from "src/ts/constants/accountsManager";
import { ACCOUNT_TRACKING_PREVENTION_FEATURE_ID } from "src/ts/constants/accountTrackingPrevention";
import { AGREEMENTS_STORAGE_KEY, DISMISSED_ALERTS_STORAGE_KEY } from "src/ts/constants/alerts";
import {
	FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_LAST_SEEN_FEATURE_ID,
	FRIENDS_LAST_SEEN_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_STORAGE_DEFAULT_VALUE,
	FRIENDS_PRESENCE_NOTIFICATIONS_STORAGE_KEY,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
	type FriendsPresenceNotificationsStorageValue,
	USER_ONLINE_FRIENDS_FETCHED_SESSION_CACHE_STORAGE_KEY,
} from "src/ts/constants/friends";
import {
	ALLOWED_ITEMS_STORAGE_KEY,
	allowedItemsData,
	type AllowedItemsStorage,
	animalTextCount,
	BLOCKED_ITEMS_STORAGE_KEY,
	blockedItemsData,
	type BlockedItemsStorage,
	COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	COMMUNITY_SHOUT_NOTIFICATIONS_FEATURE_ID,
	COMMUNITY_SHOUT_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY,
	ONBOARDING_COMPLETED_STORAGE_KEY,
	PENDING_ROBUX_SESSION_CACHE_STORAGE_KEY,
	ROBUX_HISTORY_STORAGE_KEY,
	type RobuxHistoryStorageValue,
	SYNC_THEME_ENABLED_LOCALSTORAGE_KEY,
	TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
	TRADING_NOTIFICATIONS_FEATURE_ID,
	TRADING_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY,
	VOICE_CHAT_SUSPENSION_STORAGE_KEY,
} from "src/ts/constants/misc";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { invokeMessage } from "src/ts/helpers/communication/background";
import {
	addMessageListener,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { isMasterTab } from "src/ts/helpers/domInvokes";
import {
	hideEl,
	watch,
	watchAttributes,
	watchOnce,
	watchTextContent,
} from "src/ts/helpers/elements";
import {
	featureValueIs,
	getFeatureValue,
	multigetFeaturesValues,
} from "src/ts/helpers/features/helpers";
import { getFlag } from "src/ts/helpers/flags/flags";
import { getMessage, hasMessage } from "src/ts/helpers/i18n/getMessage";
import { abbreviateNumber } from "src/ts/helpers/i18n/intlFormats";
import {
	onRobloxPresenceUpdate,
	onRobloxPresenceUpdateDetails,
} from "src/ts/helpers/notifications";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { hasPermissions } from "src/ts/helpers/permissions";
import {
	presenceProcessor,
	updatePresenceFromOnlineFriends,
} from "src/ts/helpers/processors/presenceProcessor";
import {
	type BatchThumbnailRequest,
	thumbnailProcessor,
} from "src/ts/helpers/processors/thumbnailProcessor";
import {
	getUserSettingsAndOptions,
	listUserTransactionTotals,
	type UserSettingsOptions,
} from "src/ts/helpers/requests/services/account";
import type { Agent } from "src/ts/helpers/requests/services/assets";
import {
	type MarketplaceItemType,
	searchItems,
} from "src/ts/helpers/requests/services/marketplace";
import { getRoSealAlerts } from "src/ts/helpers/requests/services/roseal";
import {
	getUserInformedOfBan,
	getUserVoiceSettings,
	setUserInformedOfBan,
} from "src/ts/helpers/requests/services/voice";
import {
	getLocalStorage,
	getTimedStorage,
	onStorageValueUpdate,
	setTimedStorage,
	storage,
} from "src/ts/helpers/storage";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { getRobloxCDNUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { isAvatarItemBlocked, isExperienceBlocked } from "src/ts/utils/blockedItems";
import { checkExperiencesBlocked } from "src/ts/utils/blockedItemsMain";
import { getDeviceMeta, isIframe, onStringTyped } from "src/ts/utils/context";
import { isFocusedOnInput } from "src/ts/utils/dom";
import { changeAllTextTo } from "src/ts/utils/fun/changeText";
import { sealRain } from "src/ts/utils/fun/sealRain";
import type { CurrentServerJoinMetadata } from "src/ts/utils/gameLauncher";
import { clearFollowUserJoinData, determineCanJoinUser } from "src/ts/utils/joinData";
import {
	getAvatarMarketplaceLink,
	getListCreationsLink,
	getRoSealSettingsLink,
	getUserInventoryLink,
} from "src/ts/utils/links";
import { camelizeObject } from "src/ts/utils/objects";
import { randomInt } from "src/ts/utils/random";
import {
	AVATAR_ITEM_REGEX,
	AVATAR_MARKETPLACE_REGEX,
	CHARTS_REGEX,
	GROUP_DETAILS_REGEX,
	USER_PROFILE_REGEX,
} from "src/ts/utils/regex";
import {
	renderAfter,
	renderAppend,
	renderAppendBody,
	renderBefore,
	renderIn,
	renderPrepend,
} from "src/ts/utils/render";
import { syncTheme } from "src/ts/utils/theme";
import {
	getHashUrl,
	getResizeThumbnailUrl,
	parseCDNThumbnailUrl,
	parseResizeThumbnailUrl,
	thumbnailSizeMap,
} from "src/ts/utils/thumbnails";
import twemoji from "src/ts/utils/twemoji";
import { getPath, getPathFromMaybeUrl } from "src/ts/utils/url";
import { fetchCommunityShoutsAndUpdateData } from "../../background-alarms/fetchCommunityShouts";
import {
	fetchOnlineFriendsAndUpdateData,
	handleFriendsPresenceNotifications,
} from "../../background-alarms/fetchOnlineFriends";
import { onFeatureValueUpdate } from "src/ts/helpers/features/features";
import { fetchTradesAndUpdateData } from "../../background-alarms/fetchTrades";

export type StoredUniverseCache = [
	universeId: number,
	name: string,
	description: string | undefined,
	creatorType: Agent,
	creatorId: number,
][];

type ImageResolutionData = {
	element: HTMLImageElement;
	hash: string;
	url: string;
	originalUrl: string;
	failed: boolean;
};

export default {
	id: "all",
	isAllPages: true,
	css: ["css/all.css"],
	runInIframe: true,
	fn: () => {
		featureValueIs(ACCOUNT_TRACKING_PREVENTION_FEATURE_ID, true, async () => {
			const authenticatedUser = await getAuthenticatedUser();
			if (!authenticatedUser) return;

			const hasCookiePermissions = await hasPermissions({
				permissions: ["cookies"],
			});

			if (hasCookiePermissions) return;

			invokeMessage("checkAccountTrackingPrevention", {
				userId: authenticatedUser.userId,
			});
		});

		featureValueIs("robuxHistoryChart", true, () =>
			addMessageListener("recordRobuxHistory", async (data) => {
				const storageValue =
					((await storage.get(ROBUX_HISTORY_STORAGE_KEY))?.[ROBUX_HISTORY_STORAGE_KEY] as
						| RobuxHistoryStorageValue
						| undefined) ?? {};

				storageValue[data.userId] ??= [];

				const currentHour = Math.floor(Date.now() / 1_000 / 60 / 60);
				const latestRecord = storageValue[data.userId].at(-1);

				if (latestRecord?.robux === data.robux) return;

				if (latestRecord === undefined || currentHour !== latestRecord.date) {
					storageValue[data.userId].push({
						date: currentHour,
						robux: data.robux,
					});
				} else if (latestRecord) {
					latestRecord.robux = data.robux;
				}

				storage.set({
					[ROBUX_HISTORY_STORAGE_KEY]: storageValue,
				});
			}),
		);

		featureValueIs(COMMUNITY_SHOUT_NOTIFICATIONS_FEATURE_ID, true, () =>
			featureValueIs(COMMUNITY_SHOUT_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID, false, () =>
				getAuthenticatedUser().then((authenticatedUser) => {
					if (!authenticatedUser) return;

					getTimedStorage(
						COMMUNITY_SHOUT_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY,
						"session",
						1200_000,
						fetchCommunityShoutsAndUpdateData,
						authenticatedUser.userId,
					);
				}),
			),
		);

		featureValueIs(TRADING_NOTIFICATIONS_FEATURE_ID, true, () =>
			featureValueIs(TRADING_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID, false, () =>
				getAuthenticatedUser().then((authenticatedUser) => {
					if (!authenticatedUser) return;

					getTimedStorage(
						TRADING_NOTIFICATIONS_FETCHED_SESSION_CACHE_STORAGE_KEY,
						"session",
						600_000,
						fetchTradesAndUpdateData,
						authenticatedUser.userId,
					);
				}),
			),
		);

		multigetFeaturesValues([
			FRIENDS_LAST_SEEN_FEATURE_ID,
			FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID,
			FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
			FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID,
		]).then(async (data) => {
			if (
				!data[FRIENDS_LAST_SEEN_FEATURE_ID] &&
				!data[FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID]
			)
				return;

			if (
				data[FRIENDS_LAST_SEEN_BACKGROUND_CHECKS_FEATURE_ID] ||
				data[FRIENDS_PRESENCE_NOTIFICATIONS_BACKGROUND_CHECKS_FEATURE_ID]
			)
				return;

			getAuthenticatedUser().then((authenticatedUser) => {
				if (!authenticatedUser) return;

				getTimedStorage(
					USER_ONLINE_FRIENDS_FETCHED_SESSION_CACHE_STORAGE_KEY,
					"session",
					600_000,
					() =>
						fetchOnlineFriendsAndUpdateData().then((data) => {
							if (data) updatePresenceFromOnlineFriends(data.data);
						}),
					authenticatedUser.userId,
				);
			});
		});

		let masterTabListener: (() => void) | undefined;
		let masterTabChangeListener: (() => void) | undefined;

		const initializeCheckingFriends = () =>
			multigetFeaturesValues([
				FRIENDS_LAST_SEEN_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
			]).then(async (features) => {
				const enabled =
					features[FRIENDS_LAST_SEEN_FEATURE_ID] ||
					features[FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID];

				masterTabChangeListener?.();
				masterTabListener?.();

				if (!enabled) return;

				const checkMasterTab = () => {
					const minimal = features[FRIENDS_LAST_SEEN_FEATURE_ID]
						? onRobloxPresenceUpdate(async (data) => {
								const currentDate = Math.floor(Date.now() / 1_000);
								const currentStorageValue: Record<string, number> =
									(await storage.get(FRIENDS_LAST_SEEN_STORAGE_KEY))?.[
										FRIENDS_LAST_SEEN_STORAGE_KEY
									] ?? {};

								for (const userId of data) {
									currentStorageValue[userId] = currentDate;
								}

								return storage.set({
									[FRIENDS_LAST_SEEN_STORAGE_KEY]: currentStorageValue,
								});
							})
						: undefined;
					const detailed = features[FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID]
						? onRobloxPresenceUpdateDetails(async (data) => {
								const storageValue: FriendsPresenceNotificationsStorageValue =
									(
										await storage.get(
											FRIENDS_PRESENCE_NOTIFICATIONS_STORAGE_KEY,
										)
									)?.[FRIENDS_PRESENCE_NOTIFICATIONS_STORAGE_KEY] ??
									FRIENDS_PRESENCE_NOTIFICATIONS_STORAGE_DEFAULT_VALUE;

								await handleFriendsPresenceNotifications(
									data,
									storageValue,
									features[
										FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID
									],
									features[
										FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID
									],
									features[FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID],
								);
							})
						: undefined;

					return () => {
						minimal?.();
						detailed?.();
					};
				};
				if (await isMasterTab()) masterTabListener = checkMasterTab();

				masterTabChangeListener = addMessageListener("masterTabChange", (data) => {
					if (!masterTabListener && data.isMaster) {
						masterTabListener = checkMasterTab();
						return;
					}

					if (masterTabListener && !data.isMaster) {
						masterTabListener();
						masterTabListener = undefined;
					}
				});
			});

		onFeatureValueUpdate(
			[
				FRIENDS_LAST_SEEN_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INEXPERIENCE_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_INSTUDIO_FEATURE_ID,
				FRIENDS_PRESENCE_NOTIFICATIONS_TYPE_ONLINE_FEATURE_ID,
			],
			initializeCheckingFriends,
		);
		initializeCheckingFriends();

		featureValueIs("syncBrowserThemeOption", true, async () => {
			const isEnabled = getLocalStorage(SYNC_THEME_ENABLED_LOCALSTORAGE_KEY) === true;

			if (isEnabled) {
				syncTheme();
			}
		});

		getFeatureValue("animalText").then((value) => {
			if (!value?.[0]) {
				return;
			}

			changeAllTextTo(
				new Array(animalTextCount[value[1]]).fill(0).map((_, index) => {
					const key = `animalText.${value[1]}.${index + 1}`;
					if (!hasMessage(key)) {
						return "";
					}
					return getMessage(key);
				}),
			);
		});

		getFeatureValue("animalImages").then((value) => {
			if (!value?.[0]) {
				return;
			}

			searchItems({
				keyword: value[1].toLowerCase(),
				category: 11,
				limit: 120,
				includeNotForSale: true,
			}).then(({ data }) => {
				const requests: BatchThumbnailRequest[] = [];

				for (const item of data) {
					if (item.itemType === "Asset") {
						requests.push({
							requestId: item.id.toString(),
							size: "420x420",
							targetId: item.id,
							type: "Asset",
						});
					}
				}

				thumbnailProcessor.requestBatch(requests).then((data) => {
					const images: string[] = [];
					const hashes: string[] = [];
					for (const item of data) {
						if (item.imageUrl) {
							images.push(item.imageUrl);
							const data = parseResizeThumbnailUrl(item.imageUrl);
							if (data) {
								hashes.push(data.hash);
							}
						}
					}

					if (!images.length) return;

					const handleImgSrc = (img: HTMLElement) => {
						if (img.closest("footer")) return;
						if (img.tagName !== "IMG") return;

						const src = img.getAttribute("src")!;
						const hash =
							parseResizeThumbnailUrl(src)?.hash ?? parseCDNThumbnailUrl(src);
						if (hash && hashes.includes(hash)) {
							return;
						}

						img.setAttribute("src", images[randomInt(0, images.length - 1)]!);
					};

					watch<HTMLImageElement>("img", handleImgSrc);

					watchAttributes(
						document.body,
						(_, element) => handleImgSrc(element),
						["src"],
						undefined,
						true,
					);
				});
			});
		});

		getFeatureValue("userAvatarHeadshotOverride").then((value) => {
			if (!value?.[0]) return;

			const handleImgSrc = (img: HTMLElement) => {
				const src = img.getAttribute("src");
				if (!src) return;

				const data = parseResizeThumbnailUrl(src);
				if (!data) {
					const newSrc = src.replaceAll("AvatarHeadshot", value[1]);
					if (newSrc !== src) {
						img.setAttribute("src", newSrc);
					}
					return;
				}

				if (data.hash.includes("AvatarHeadshot")) {
					data.hash = data.hash.replaceAll("AvatarHeadshot", value[1]);
					data.type = value[1];
					const newSrc = getResizeThumbnailUrl(data);
					if (newSrc !== src) {
						img.setAttribute("src", newSrc);
					}
				}
			};

			watch<HTMLImageElement>("img", handleImgSrc);
			watch<HTMLImageElement>("img", (img) => {
				handleImgSrc(img);
				watchAttributes(img, (_, img) => handleImgSrc(img), ["src"]);
			});
		});

		getFeatureValue("imageResolutionOverride").then((value) => {
			if (!value?.[0]) return;

			const handledImages: ImageResolutionData[] = [];
			const handleImgSrc = (img: HTMLImageElement) => {
				const src = img.getAttribute("src");
				if (!src) {
					return;
				}
				const metadata = parseResizeThumbnailUrl(src);
				if (!metadata) {
					return;
				}

				for (const handledImage of handledImages) {
					if (handledImage.element === img && handledImage.hash === metadata.hash) {
						if (handledImage.url !== src && !handledImage.failed) {
							img.setAttribute("src", handledImage.url);
						}
						return;
					}
				}

				let newUrl = src;
				if (value[1] === "native") {
					newUrl = getHashUrl(metadata.hash);
				} else {
					const size =
						thumbnailSizeMap[
							`${metadata.width}x${metadata.height}` as keyof typeof thumbnailSizeMap
						]?.[value[1]];

					if (size) {
						newUrl = getResizeThumbnailUrl({
							...metadata,
							...size,
						});
					}
				}

				handledImages.push({
					element: img,
					hash: metadata.hash,
					url: newUrl,
					originalUrl: src,
					failed: false,
				});
				img.setAttribute("src", newUrl);

				const onErrorListener = () => {
					for (const handledImage of handledImages) {
						if (handledImage.element === img) {
							handledImage.failed = true;
							img.setAttribute("src", handledImage.originalUrl);
							break;
						}
					}
				};

				const onLoadListener = () => {
					img.removeEventListener("error", onErrorListener);
				};
				img.addEventListener("error", onErrorListener);
				img.addEventListener("load", onLoadListener, {
					once: true,
				});
			};
			watch<HTMLImageElement>("img", (img) => {
				handleImgSrc(img);
				watchAttributes(img, (_, img) => handleImgSrc(img), ["src"]);
			});

			watch(
				"img",
				(img) => {
					for (const handledImage of handledImages) {
						if (handledImage.element === img) {
							handledImages.splice(handledImages.indexOf(handledImage), 1);
							break;
						}
					}
				},
				true,
			);
		});

		// prevent iframes at this point
		if (isIframe) return;
		featureValueIs(ACCOUNTS_FEATURE_ID, true, () => {
			const logoutData = signal<{
				show: boolean;
				onLogout?: () => void;
			}>({
				show: false,
			});

			renderAppendBody(<PreventLogoutModal data={logoutData} />);
			watch("#settings-popover-menu .logout-menu-item", (el) => {
				el.addEventListener("click", (e) => {
					if (!e.isTrusted) return;

					e.stopImmediatePropagation();
					logoutData.value = {
						show: true,
						onLogout: () => {
							el.click();
						},
					};
				});
			});

			watchOnce(".rbx-navbar-right ul").then((el) => {
				renderIn(<AccountsPopover />, el);
			});
		});

		//renderAppendBody(<ToastContainer position="bottom-left" />);

		getFeatureValue("favoritesNav").then((value) => {
			if (!value?.[0]) {
				return;
			}

			watchOnce("#nav-inventory").then((el) =>
				renderAfter(<NavigationFavorites />, el.parentElement!),
			);
		});

		addMessageListener("onlineFriendsFetched", (data) => {
			updatePresenceFromOnlineFriends(
				camelizeObject(data.data, {
					pascalCase: true,
					deep: true,
				}),
			);
		});

		getFeatureValue("changeInventoryNav").then(async (value) => {
			if (!value?.[0]) {
				return;
			}

			const authenticatedUser = await getAuthenticatedUser();
			if (!authenticatedUser) {
				return;
			}
			watchOnce<HTMLAnchorElement>("#nav-inventory").then((el) => {
				el.href = getUserInventoryLink(authenticatedUser.userId, value[1]);
			});
		});

		featureValueIs("pendingRobuxNav", true, () => {
			addMessageListener("updatePendingRobux", (data) => {
				setTimedStorage(
					PENDING_ROBUX_SESSION_CACHE_STORAGE_KEY,
					"session",
					data.robux,
					data.userId,
				);
			});
			getAuthenticatedUser().then((user) => {
				if (!user) {
					return;
				}

				getTimedStorage(
					PENDING_ROBUX_SESSION_CACHE_STORAGE_KEY,
					"session",
					300_000,
					() =>
						listUserTransactionTotals({
							timeFrame: "Month",
							transactionType: "pendingRobux",
							userId: user.userId,
						}).then((data) => data.pendingRobuxTotal),
					user.userId,
				).then((pendingRobuxTotal) => {
					if (!pendingRobuxTotal) {
						return;
					}

					watchOnce("#nav-robux-amount").then((robuxAmount) => {
						renderAfter(
							<Tooltip
								includeContainerClassName={false}
								containerClassName="text xsmall pending-robux-count"
								button={
									<span>
										{getMessage("pendingRobux", {
											total: abbreviateNumber(pendingRobuxTotal),
										})}
									</span>
								}
								placement="bottom"
							>
								{getMessage("pendingRobux.tooltip")}
							</Tooltip>,
							robuxAmount,
						);
					});
				});
			});
		});

		featureValueIs("slashToSearch", true, () =>
			watchOnce("body").then((body) => {
				onStringTyped(body, "/", (e) => {
					if (isFocusedOnInput()) return;

					e.preventDefault();
					document.querySelector<HTMLDivElement>("#navbar-search-input")?.focus();
				});
			}),
		);

		featureValueIs("sealsPages", true, () =>
			watchOnce("body").then((body) =>
				onStringTyped(body, "do a seal rain", () => sealRain()),
			),
		);
		featureValueIs("moveAgeBracket", true, () => {
			watchOnce("#right-navigation-header .age-bracket-label-age").then((label) => {
				watchOnce("#navigation > ul .text-nav").then((navigation) => {
					navigation.append(label);
				});
			});
		});

		getFlag("onboarding", "showOnboarding").then(async (showOnboarding) => {
			if (showOnboarding) {
				const completedOnboarding = (await storage.get(ONBOARDING_COMPLETED_STORAGE_KEY))?.[
					ONBOARDING_COMPLETED_STORAGE_KEY
				];

				if (completedOnboarding !== true) {
					renderAppendBody(
						<OnboardingModal
							type={completedOnboarding === "previousVersion" ? "update" : "install"}
							accept={() =>
								storage.set({
									[ONBOARDING_COMPLETED_STORAGE_KEY]: true,
								})
							}
						/>,
					);
				}
			}
		});

		getRoSealAlerts()
			.then((alertInfo) => {
				storage.get(AGREEMENTS_STORAGE_KEY).then((value) => {
					const data: number | undefined = value[AGREEMENTS_STORAGE_KEY];
					const updateLastAccept = () => {
						storage.set({
							[AGREEMENTS_STORAGE_KEY]: Date.now(),
						});
					};

					if (!data) {
						return updateLastAccept();
					}

					if (data < alertInfo.agreementsUpdated) {
						renderAppendBody(<AgreementsUpdatedModal accept={updateLastAccept} />);
					}
				});

				if (alertInfo.alerts?.length)
					storage.get(DISMISSED_ALERTS_STORAGE_KEY).then((value) => {
						const data: { id: number }[] = value[DISMISSED_ALERTS_STORAGE_KEY] ?? [];

						const currentDate = Date.now();
						const shownAlerts = alertInfo.alerts!.filter(
							(alert) =>
								(!alert.dismissable ||
									!data?.find((item) => item.id === alert.id)) &&
								(!alert._targets ||
									alert._targets.includes(import.meta.env.TARGET)) &&
								(!alert._versions ||
									alert._versions.includes(import.meta.env.VERSION)) &&
								(!alert._startDate || alert._startDate < currentDate) &&
								(!alert._endDate || alert._endDate > currentDate),
						);

						if (shownAlerts.length > 0) {
							watchOnce(".alert-container").then((alertContainer) => {
								renderIn(
									() =>
										shownAlerts.map((alert) => {
											const [show, setShow] = useState(true);

											return (
												<Alert
													key={alert.id}
													type={alert.alertType}
													contentLink={alert.contentLink}
													showDismiss={alert.dismissable}
													onDismiss={() => {
														setShow(false);
														data.push({
															id: alert.id,
														});

														storage.set({
															[DISMISSED_ALERTS_STORAGE_KEY]: data,
														});
													}}
													show={show}
												>
													{alert.content}
												</Alert>
											);
										}),
									alertContainer,
								);
							});
						}
					});
			})
			.catch(() => {});

		featureValueIs("chatSorts", true, () =>
			watchOnce("#chat-body .chat-search").then((search) =>
				renderAppend(<ChatSortTypes />, search),
			),
		);

		featureValueIs("showVoiceChatSuspension", true, async () => {
			const data = await getUserVoiceSettings();
			const authenticatedUser = await getAuthenticatedUser();
			if (!authenticatedUser) return;

			const suspension =
				(await storage.get(VOICE_CHAT_SUSPENSION_STORAGE_KEY))[
					VOICE_CHAT_SUSPENSION_STORAGE_KEY
				] ?? {};
			const { informedOfBan } = await getUserInformedOfBan();

			const lastId = suspension[authenticatedUser.userId];
			const currentId = Math.ceil((data.bannedUntil?.Seconds ?? 0) / 60);
			if (
				data.isBanned &&
				data.bannedUntil?.Seconds &&
				currentId !== lastId &&
				!informedOfBan
			) {
				renderAppendBody(
					<VoiceChatSuspendedModal
						data={data}
						hide={() => {
							setUserInformedOfBan({
								informedOfBan: true,
							}).catch(() => {});
							storage
								.set({
									VoiceChatSuspension: {
										...suspension,
										[authenticatedUser.userId]: currentId,
									},
								})
								.catch(() => {});
						}}
					/>,
				);
			}

			if (lastId && !data.isBanned) {
				if (Object.keys(suspension).length > 1) {
					storage.set({
						VoiceChatSuspension: {
							...suspension,
							[authenticatedUser.userId]: undefined,
						},
					});
				} else storage.remove("VoiceChatSuspension");
			}
		});

		featureValueIs("showcaseExperienceEventsNav", true, () => {
			watchOnce("#navigation .left-col-list").then((list) => {
				renderAppend(<ShowcaseExperienceEventsNav />, list);
			});
		});

		getFeatureValue("customErrorPageImage").then((value) => {
			if (!value?.[0]) return;

			watch<HTMLImageElement>(".request-error-page-content img", (img) => {
				img.src =
					value[1] === "bunny"
						? "https://dk135eecbplh9.cloudfront.net/assets/blt4e1a38d8ce4da3f9/404-img.png"
						: `https://${getRobloxCDNUrl("images", "/Maintenance.png")}`;
			});
		});

		featureValueIs("errorPageMachineId", true, () => {
			watch(
				".request-error-page-content:not(.roseal-error-page) .action-buttons",
				(actionButtons) => {
					renderAfter(
						<div className="machine-id-container text small">
							{getMessage("errorPage.machineId", {
								robloxMachineId: (
									<span className="machine-id">
										{document.head.dataset.machineId}
									</span>
								),
							})}
						</div>,
						actionButtons,
					);
				},
			);
		});
		featureValueIs("robloxSessionMetadata", true, () =>
			renderAppendBody(<RobloxSessionModal />),
		);

		featureValueIs("improvedServerJoinModal", true, () => {
			const data = signal<CurrentServerJoinMetadata | null>();
			const resolveOnJoin = signal<() => void>();

			setInvokeListener("setGameLaunchData", (newData) => {
				if (resolveOnJoin.value) {
					resolveOnJoin.value();
				}

				data.value = newData;
				return new Promise<void>((resolve) => {
					resolveOnJoin.value = resolve;
				});
			});

			renderAppendBody(<JoinServerModal data={data} resolveOnJoin={resolveOnJoin} />);
		});

		featureValueIs("fastUserSearchNav", true, () => {
			const searchInput = signal("");
			watch<HTMLUListElement>(
				"#right-navigation-header .navbar-search .new-dropdown-menu",
				(dropdownMenu) => {
					const input =
						dropdownMenu.parentElement?.querySelector<HTMLInputElement>(
							"#navbar-search-input",
						);
					if (!input) return;

					searchInput.value = input.value;
					input.addEventListener("input", (e) => {
						searchInput.value = (e.target as HTMLInputElement).value;
					});

					renderPrepend(
						<FastUserSearch
							search={searchInput}
							menu={dropdownMenu}
							container={dropdownMenu.parentElement as HTMLDivElement}
						/>,
						dropdownMenu,
					);
				},
			);
		});

		featureValueIs("creatorDashboardNav", true, () => {
			watch<HTMLAnchorElement>("#header-develop-sm-link, #header-develop-md-link", (link) => {
				link.href = getListCreationsLink();

				watchAttributes(
					link,
					() => {
						link.href = getListCreationsLink();
					},
					["href"],
					true,
				);
			});
		});

		getFeatureValue("robuxNavigationDevExCurrencyAmount").then((data) => {
			if (!data?.[0]) return;

			watch("#buy-robux-popover-menu > div:not(.devexable-currency)", (div) => {
				renderAfter(<DevExableRobuxAmount currency={data[1]} />, div);
			});
		});

		watch<HTMLAnchorElement>("#header .rbx-navbar .nav-menu-title", async (title) => {
			const href = title.getAttribute("href");
			if (!href) return;

			let headerType: "charts" | "marketplace" | "create" | "robux" | undefined;
			if (title.id === "header-develop-md-link") {
				headerType = "create";
			} else if (title.classList.contains("robux-menu-btn")) {
				headerType = "robux";
			} else if (href.match(AVATAR_MARKETPLACE_REGEX)) {
				headerType = "marketplace";
			} else if (href.match(CHARTS_REGEX)) {
				headerType = "charts";
			}

			if (!headerType) return;

			const featurePrefix = `topNavigationCustomization.${headerType}` as const;
			const headerValue = await getFeatureValue(featurePrefix);
			if (!headerValue?.[0]) return;

			if (headerValue?.[1] === "hide") {
				title.closest("li")?.setAttribute("data-display-none", "");
				return;
			}

			const [text, link] = await Promise.all([
				getFeatureValue(`${featurePrefix}.text`),
				getFeatureValue(`${featurePrefix}.link`),
			]);

			if (text?.[0] && text[1] !== undefined) {
				title.textContent = text[1];
			}

			if (link?.[0] && link[1] !== undefined) {
				title.setAttribute("href", link[1]);

				if (title.id)
					watchAttributes(
						title,
						(_, __, newValue) => {
							if (newValue === link[1]!) return;
							title.setAttribute("href", link[1]!);
						},
						["href"],
					);
			}
		});

		getFeatureValue("customEmojis").then((value) => {
			if (!value?.[0]) return;

			if (value[1] !== "twemoji") {
				twemoji.base = `${import.meta.env.FLUENTUI_EMOJI_BASE_URL}${value[1] === "fluentuiColor" ? "color" : "flat"}/`;
			}

			watchOnce("body").then((body) => {
				twemoji.parse(body);

				const nextSetToHandle = new Set<HTMLElement>();
				watch(
					"*",
					(el) => {
						if (el instanceof HTMLImageElement) return;

						nextSetToHandle.add(el);
					},
					false,
					false,
					false,
				);

				watchTextContent(body, (el) => {
					if (el.nodeType === Node.TEXT_NODE) {
						nextSetToHandle.add(el);
					}
				});

				setInterval(() => {
					if (!nextSetToHandle.size) return;

					for (const el of nextSetToHandle) {
						twemoji.parse(el);
					}

					nextSetToHandle.clear();
				}, 500);
			});
		});

		featureValueIs("marketplaceLandingParity", true, () =>
			watch("#header .nav-menu-title", (title) => {
				const href = title.getAttribute("href");
				if (!href) return;

				if (href.match(AVATAR_MARKETPLACE_REGEX)) {
					title.setAttribute(
						"href",
						getAvatarMarketplaceLink({
							Landing: "true",
						}),
					);
				}
			}),
		);

		featureValueIs("openDesktopAppNav", true, () =>
			watchOnce("#nav-blog").then((blogItem) => {
				const parent = blogItem.parentElement;
				if (!parent) return;

				renderBefore(<NavigationDesktopApp />, parent);
			}),
		);

		featureValueIs("blockedItems", true, () =>
			storage.get([BLOCKED_ITEMS_STORAGE_KEY, ALLOWED_ITEMS_STORAGE_KEY]).then((value) => {
				const blockedData = value[BLOCKED_ITEMS_STORAGE_KEY] as
					| BlockedItemsStorage
					| undefined;
				const allowedData = value[ALLOWED_ITEMS_STORAGE_KEY] as
					| AllowedItemsStorage
					| undefined;

				onStorageValueUpdate(
					[BLOCKED_ITEMS_STORAGE_KEY, ALLOWED_ITEMS_STORAGE_KEY],
					(key, newValue) => {
						if (key === BLOCKED_ITEMS_STORAGE_KEY) {
							blockedItemsData.value = newValue as BlockedItemsStorage;
						} else if (key === ALLOWED_ITEMS_STORAGE_KEY) {
							allowedItemsData.value = newValue as AllowedItemsStorage;
						}
					},
				);

				if (!blockedData && !allowedData) {
					return;
				}

				setInvokeListener("checkBlockedUniverses", ({ ids }) =>
					checkExperiencesBlocked(ids),
				);
				blockedItemsData.value = blockedData;
				allowedItemsData.value = allowedData;

				sendMessage("setBlockedItems", {
					blockedItems: blockedData,
					allowedItems: allowedData,
				});

				const _hasCreatorConfig =
					blockedData?.creators.length || allowedItemsData.value?.creators.length;
				const hasCreatorConfig = _hasCreatorConfig !== undefined && _hasCreatorConfig !== 0;
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

				if (hasExperienceConfig) {
					/*
					horrible for performance.
					
					watch<HTMLElement>(".game-card-container:last-child", async (lastChild) => {
						if (
							lastChild.closest(
								"#games-carousel-page, #HomeContainer, #games-search-page",
							) ||
							!lastChild.isConnected
						)
							return;

						console.log("hi");

						const list = lastChild.parentElement;
						if (!list) return;

						const checkUniverseIds: number[] = [];
						if (shouldExperienceRequest)
							for (const element of list.children) {
								const idStr = element.closest("group-games-item")
									? element
											.querySelector(".thumbnail-2d-container")
											?.getAttribute("thumbnail-target-id")
									: element.querySelector(".game-card-link")?.getAttribute("id");

								if (!idStr) continue;

								checkUniverseIds.push(Number.parseInt(idStr, 10));
							}

						const blockedUniverseIds = checkUniverseIds.length
							? await checkExperiencesBlocked(checkUniverseIds)
							: undefined;

						for (const element of list.children) {
							const name = element.querySelector(".game-card-name")?.textContent;
							const idStr = element.closest("group-games-item")
								? element
										.querySelector(".thumbnail-2d-container")
										?.getAttribute("thumbnail-target-id")
								: element.querySelector(".game-card-link")?.getAttribute("id");

							if (!idStr) continue;

							const id = Number.parseInt(idStr, 10);
							if (
								isExperienceBlocked(
									id,
									undefined,
									undefined,
									name,
									undefined,
									blockedUniverseIds,
								)
							) {
								if (
									element.parentElement?.classList.contains("list-item") ||
									element.parentElement?.tagName === "GROUP-GAMES-ITEM"
								) {
									const listItem = element.closest<HTMLElement>(".list-item");

									if (listItem) {
										hideEl(listItem, undefined, "data-item-is-blocked");
									}
								} else {
									hideEl(
										element as HTMLElement,
										undefined,
										"data-item-is-blocked",
									);
								}
							}
						}
					});*/

					watch<HTMLElement>(".link-card-container", async (element) => {
						const name = element.querySelector(".link-card-title")?.textContent;
						const idStr = element
							.querySelector("[chat-game-icon]")
							?.getAttribute("universe-id");

						const id = idStr ? Number.parseInt(idStr, 10) : undefined;

						const blockedUniverseIds =
							shouldExperienceRequest && id
								? await checkExperiencesBlocked([id])
								: undefined;
						if (
							isExperienceBlocked(
								id,
								undefined,
								undefined,
								name,
								undefined,
								blockedUniverseIds,
							)
						) {
							hideEl(element, undefined, "data-item-is-blocked");
						}
					});
				}

				if (hasItemConfig) {
					watch<HTMLAnchorElement>(
						".item-card .item-card-name, group-store-item .item-card-name, .sponsored-item-card .item-card-name, .item-card-container .item-card-name",
						(el) => {
							const name = el.textContent ?? "";
							if (!name) return;
							const card = el.closest<HTMLDivElement>(
								".item-card, group-store-item, .sponsored-item-card, .item-card-container",
							);

							if (!card) return;

							const creatorLink =
								el.querySelector<HTMLAnchorElement>("a.creator-name")?.href;
							let creatorType: Agent | undefined;
							let creatorTargetId: number | undefined;

							if (creatorLink) {
								const userMatch = USER_PROFILE_REGEX.exec(
									getPathFromMaybeUrl(creatorLink).realPath,
								)?.[1];
								const groupMatch = GROUP_DETAILS_REGEX.exec(
									getPathFromMaybeUrl(creatorLink).realPath,
								)?.[2];

								const type = userMatch ? "User" : "Group";
								const idStr = userMatch ?? groupMatch;

								if (type && idStr) {
									creatorType = type;
									creatorTargetId = Number.parseInt(idStr, 10);
								}
							} else {
								const groupMatch = GROUP_DETAILS_REGEX.exec(getPath().realPath);
								if (groupMatch) {
									creatorType = "Group";
									creatorTargetId = Number.parseInt(groupMatch[1], 10);
								}
							}

							let itemType: MarketplaceItemType | undefined;
							let itemId: number | undefined;
							const link = card.querySelector<HTMLAnchorElement>(
								"a.item-card-link, a.item-card-container",
							)?.href;
							if (link) {
								const path = getPathFromMaybeUrl(link).realPath;
								const match = AVATAR_ITEM_REGEX.exec(path);

								const type = match?.[1] === "bundles" ? "Bundle" : "Asset";
								const idStr = match?.[2];

								if (type && idStr) {
									itemId = Number.parseInt(idStr, 10);
									itemType = type;
								}
							}

							if (!itemId && !itemType) {
								const thumbnailContainer = card.querySelector(
									"thumbnail-2d .thumbnail-2d-container",
								);

								if (thumbnailContainer) {
									const type =
										thumbnailContainer.getAttribute("thumbnail-type") ===
										"BundleThumbnail"
											? "Bundle"
											: "Asset";

									const idStr =
										thumbnailContainer.getAttribute("thumbnail-target-id");
									if (type && idStr) {
										itemId = Number.parseInt(idStr, 10);
										itemType = type;
									}
								}
							}

							if (
								isAvatarItemBlocked(
									itemId,
									itemType,
									creatorType,
									creatorTargetId,
									name,
								)
							) {
								hideEl(card, true, "data-item-is-blocked");
							}
						},
					);
				}
			}),
		);

		onRobloxPresenceUpdateDetails((data) => {
			for (const item of data) {
				presenceProcessor.updateItem(
					{
						userId: item.userId,
					},
					item,
				);
			}
		});

		featureValueIs("userJoinCheck", true, () =>
			getDeviceMeta().then((deviceMeta) => {
				const overrideDeviceType = deviceMeta?.deviceType ?? "Desktop";

				setInvokeListener("determineCanJoinUser", (data) => {
					return determineCanJoinUser({
						userIdToFollow: data.userIdToFollow,
						overrideDeviceType,
					});
				});

				onRobloxPresenceUpdateDetails((data) => {
					for (const item of data) {
						clearFollowUserJoinData({
							userIdToFollow: item.userId,
							overrideDeviceType,
						});
					}
				});

				watch(
					".popover .card-with-game .place-btn.btn-growth-sm, .react-friends-carousel-container:not(.roseal-friends-carousel-container) .in-game-friend-card .btn-growth-sm",
					(btn) => {
						const popover = btn.closest('.popover[class*="people-info-"]');

						let id: number | undefined;
						if (popover) {
							for (const className of popover.classList) {
								const idStr = className.split("people-info-")[1];

								if (idStr && idStr !== "card-container") {
									id = Number.parseInt(idStr, 10);
									break;
								}
							}
						} else {
							const link = btn
								.closest(".friends-carousel-tile")
								?.querySelector<HTMLAnchorElement>(
									".friends-carousel-tile-labels",
								)?.href;

							if (link) {
								const path = getPathFromMaybeUrl(link).realPath;
								const match = USER_PROFILE_REGEX.exec(path);
								if (match) {
									id = Number.parseInt(match[1], 10);
								}
							}
						}

						if (!id) {
							return;
						}

						btn.classList.add("roseal-disabled");
						determineCanJoinUser({
							userIdToFollow: id,
							overrideDeviceType,
						})
							.then((data) => {
								if (data.message) {
									btn.textContent = data.message;
								}
								/*
								if (data.asyncMessage) {
									data.asyncMessage.then((message) => {
										if (message) btn.textContent = message;
									});
								}*/
								if (data.disabled) {
									btn.classList.add("roseal-grayscale");
								} else {
									btn.classList.remove("roseal-disabled");
								}
							})
							.catch(() => btn.classList.remove("roseal-disabled"));
					},
				);
			}),
		);

		getFeatureValue("changeFriendsNav").then((value) => {
			if (!value?.[0]) {
				return;
			}

			watchOnce<HTMLAnchorElement>("#left-navigation-container #nav-friends").then(
				(navFriends) => {
					const link = new URL(navFriends.href);
					link.hash = `#!/${value[1]}`;

					const newLink = link.toString();
					navFriends.href = newLink;

					watchAttributes(
						navFriends,
						(_, element) => {
							if (element.href !== newLink) {
								element.href = newLink;
							}
						},
						["href"],
						true,
					);
				},
			);
		});

		getFeatureValue("changeMessagesNav").then((value) => {
			if (!value?.[0]) {
				return;
			}

			watchOnce<HTMLAnchorElement>("#left-navigation-container #nav-message").then(
				(navMessages) => {
					const link = new URL(navMessages.href);
					link.hash = `#!/${value[1]}`;

					const newLink = link.toString();
					navMessages.href = newLink;

					watchAttributes(
						navMessages,
						(_, element) => {
							if (element.href !== newLink) {
								element.href = newLink;
							}
						},
						["href"],
						true,
					);
				},
			);
		});

		featureValueIs("premiumStatusNavbar", true, () =>
			watchOnce('[data-testid="navigation-search-input"]').then((searchInput) =>
				renderAfter(<PremiumStatusButton />, searchInput),
			),
		);

		featureValueIs("switchThemeNavbar", true, () => {
			watchOnce("#navbar-stream").then((stream) => {
				renderBefore(<SwitchThemeButton />, stream);
			});
		});

		featureValueIs("changeVoiceOptInNavbar", true, () => {
			watchOnce("#navbar-stream").then((stream) => {
				renderBefore(<ChangeVoiceOptInButton />, stream);
			});
		});

		featureValueIs("changeAvatarChatOptInNavbar", true, () => {
			watchOnce("#navbar-stream").then((stream) => {
				renderBefore(<ChangeAvatarChatOptInButton />, stream);
			});
		});

		multigetFeaturesValues(["changeJoinPrivacyNavbar", "changeOnlineStatusPrivacyNavbar"]).then(
			(value) => {
				const joinPrivacyEnabled = value.changeJoinPrivacyNavbar;
				const onlineStatusPrivacyEnabled = value.changeOnlineStatusPrivacyNavbar;
				if (!joinPrivacyEnabled && !onlineStatusPrivacyEnabled) {
					return;
				}

				const settings = signal<UserSettingsOptions>();
				getUserSettingsAndOptions().then((value) => {
					settings.value = value;
				});

				watchOnce("#navbar-stream").then((stream) => {
					if (joinPrivacyEnabled)
						renderBefore(<ChangeJoinPrivacyButton settings={settings} />, stream);

					if (onlineStatusPrivacyEnabled)
						renderBefore(
							<ChangeOnlineStatusPrivacyButton settings={settings} />,
							stream,
						);
				});
			},
		);
		featureValueIs("rosealSettingsInDropdown", true, () =>
			watch("#settings-popover-menu", (menu) => {
				const li = document.createElement("li");
				const firstSetting = menu.querySelector("li");
				if (firstSetting) {
					firstSetting.after(li);
				} else {
					menu.append(li);
				}

				render(
					<a className="rbx-menu-item" href={getRoSealSettingsLink()}>
						{getMessage("rosealSettings", {
							sealEmoji: SEAL_EMOJI_COMPONENT,
						})}
					</a>,
					li,
				);
			}),
		);
	},
} satisfies Page;
