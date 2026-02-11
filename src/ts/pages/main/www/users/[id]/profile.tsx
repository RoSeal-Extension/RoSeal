import { signal } from "@preact/signals";
import { isSameDay, setYear } from "date-fns";
import { type ContainerNode, render } from "preact";
import Thumbnail from "src/ts/components/core/Thumbnail";
import BlockCreatorButton from "src/ts/components/item/BlockCreatorButton";
import CopyShareLinkButton from "src/ts/components/misc/CopyShareLinkButton";
import UserProfileCurrentlyWearing from "src/ts/components/users/userProfile/avatar/CurrentlyWearing";
import Download3DAvatarButton from "src/ts/components/users/userProfile/avatar/DownloadAvatarButton";
import BlockedScreen from "src/ts/components/users/userProfile/BlockedScreen";
import UserCommunityJoinedDateCarousel from "src/ts/components/users/userProfile/communities/JoinedDateCarousel";
import UserCommunityJoinedDateGrid from "src/ts/components/users/userProfile/communities/JoinedDateGrid";
import UserCommunityRoleGrid from "src/ts/components/users/userProfile/communities/RoleGrid";
import CustomizeProfileButton from "src/ts/components/users/userProfile/CustomizeProfileButton";
import FilteredTextPreview from "src/ts/components/users/userProfile/FilteredTextPreview";
import UserJoinDate from "src/ts/components/users/userProfile/JoinDate";
import UserLastSeen from "src/ts/components/users/userProfile/LastSeen";
import ConfirmUnfriendModal from "src/ts/components/users/userProfile/modals/ConfirmUnfriendModal";
import MutualFriendsHeader from "src/ts/components/users/userProfile/MutualFriendsHeader";
import PlayerBadgesContainer from "src/ts/components/users/userProfile/PlayerBadgesContainer";
import UserPortraitView from "src/ts/components/users/userProfile/PortraitView";
import UserProfilePublishedAvatars from "src/ts/components/users/userProfile/publishedAvatars/Carousel";
import RemoveFollowerButton from "src/ts/components/users/userProfile/RemoveFollowerButton";
import RobloxBadgesContainer from "src/ts/components/users/userProfile/RobloxBadgesContainer";
import TacoButton from "src/ts/components/users/userProfile/TacoButton";
import TrackConnectionActivityButton from "src/ts/components/users/userProfile/TrackConnectionActivity";
import UserProfileLocale from "src/ts/components/users/userProfile/UserLocale";
import UserRAPHeader from "src/ts/components/users/userProfile/UserRAPHeader";
import { USER_BIRTHDAYS } from "src/ts/constants/birthdays";
import {
	FRIENDS_LAST_SEEN_FEATURE_ID,
	FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID,
} from "src/ts/constants/friends";
import {
	PROFILE_BACKGROUND_ASSETS,
	type ProfileBackgroundAsset,
	ROBLOX_AUDIO_ASSETS,
	ROBLOX_IMAGE_ASSETS,
} from "src/ts/constants/robloxAssets";
import { ROBLOX_USERS } from "src/ts/constants/robloxUsers";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { watch, watchAttributes, watchOnce, watchTextContent } from "src/ts/helpers/elements";
import {
	featureValueIs,
	getFeatureValue,
	multigetFeaturesValues,
	setFeatureValue,
} from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import { onRobloxPresenceUpdateDetails } from "src/ts/helpers/notifications";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { listUserGroupsRoles } from "src/ts/helpers/requests/services/groups";
import { filterText, getProfileComponentsData } from "src/ts/helpers/requests/services/misc";
import {
	checkUsersReciprocalBlocked,
	getOpenCloudUser,
	getUserFriendStatus,
	multigetUsersPresences,
	unfriendUser,
} from "src/ts/helpers/requests/services/users";
import { checkItemTimes } from "src/ts/specials/times";
import { listAllUserCollectibleItems } from "src/ts/utils/assets";
import { getAuthenticatedUser, isAuthenticated } from "src/ts/utils/authenticatedUser";
import { tryOpenCloudAuthRequest } from "src/ts/utils/cloudAuth";
import { getDeviceMeta } from "src/ts/utils/context";
import { renderMentions } from "src/ts/utils/description";
import { isFocusedOnInput, onDOMReady } from "src/ts/utils/dom";
import { sealRain } from "src/ts/utils/fun/sealRain";
import { clearFollowUserJoinData, determineCanJoinUser } from "src/ts/utils/joinData";
import { crossSort } from "src/ts/utils/objects";
import { randomInt } from "src/ts/utils/random";
import { GROUP_DETAILS_REGEX, USER_PROFILE_REGEX } from "src/ts/utils/regex";
import {
	renderAfter,
	renderAppend,
	renderAppendBody,
	renderAsContainer,
	renderBefore,
	renderIn,
	renderPrepend,
} from "src/ts/utils/render";

export default {
	id: "user.profile",
	regex: [USER_PROFILE_REGEX],
	css: ["css/userProfile.css"],
	fn: async ({ regexMatches }) => {
		if (!(await isAuthenticated())) return;

		featureValueIs("viewUserPublishedAvatars", true, () =>
			watchOnce(".profile-tab-content > .profile-store").then((store) =>
				renderAfter(<UserProfilePublishedAvatars userId={profileUserId} />, store),
			),
		);

		const authenticatedUser = (await getAuthenticatedUser())!;
		const profileUserId = Number.parseInt(regexMatches![0]?.[1], 10);
		const isMyProfile = authenticatedUser?.userId === profileUserId;

		featureValueIs("profilePlayerBadgesObtainedDates", true, () =>
			watch(".profile-platform-container #player-badges-container", (container) => {
				renderAsContainer(<PlayerBadgesContainer userId={profileUserId} />, container);
			}),
		);

		getFeatureValue("improvedUserCurrentlyWearing").then((data) => {
			if (data) {
				watchOnce("#profile-current-wearing-avatar .profile-avatar-right").then((right) =>
					renderAsContainer(
						<UserProfileCurrentlyWearing userId={profileUserId} />,
						right,
					),
				);
			} else {
				featureValueIs("viewUserEquippedEmotes", true, () =>
					watchOnce(
						".profile-accoutrements-container:not(.roseal-emotes-container)",
					).then((container) => {
						renderBefore(
							<UserProfileCurrentlyWearing userId={profileUserId} forEmotes />,
							container,
						);
					}),
				);
			}
		});

		featureValueIs("userProfileDownload3DAvatar", true, () =>
			watchOnce<HTMLDivElement>(
				".profile-avatar-left .thumbnail-2d-container, .profile-avatar-left .thumbnail-3d-container",
			).then((container) =>
				renderAfter(<Download3DAvatarButton userId={profileUserId} />, container),
			),
		);

		featureValueIs("viewUserProfilePortrait", true, () =>
			watchOnce<HTMLDivElement>(
				".profile-avatar-left .thumbnail-2d-container, .profile-avatar-left .thumbnail-3d-container",
			).then((container) =>
				renderAfter(<UserPortraitView userId={profileUserId} />, container),
			),
		);

		multigetFeaturesValues([
			"improvedUserFriendsPage.mutualsTab",
			"viewUserRAP",
			FRIENDS_LAST_SEEN_FEATURE_ID,
		]).then((features) => {
			if (
				!features[FRIENDS_LAST_SEEN_FEATURE_ID] &&
				!features["improvedUserFriendsPage.mutualsTab"] &&
				!features.viewUserRAP
			)
				return;

			const collectiblesPromise = features.viewUserRAP
				? listAllUserCollectibleItems(profileUserId).then((data) =>
						crossSort(data, (a, b) => b.recentAveragePrice - a.recentAveragePrice),
					)
				: undefined;

			const showLastSeen = signal(false);
			if (!isMyProfile && features[FRIENDS_LAST_SEEN_FEATURE_ID])
				getUserFriendStatus({
					userId: profileUserId,
				}).then((data) => {
					showLastSeen.value = data.status === "Friends";
				});
			watchOnce(".user-profile-header > .flex-nowrap:not(.user-profile-header-info)").then(
				(el) =>
					renderAppend(
						() => (
							<>
								{features["improvedUserFriendsPage.mutualsTab"] && !isMyProfile && (
									<MutualFriendsHeader userId={profileUserId} useV2 />
								)}
								{collectiblesPromise && (
									<UserRAPHeader
										userId={profileUserId}
										allCollectiblesPromise={collectiblesPromise}
										useV2
									/>
								)}
								{showLastSeen.value && (
									<UserLastSeen userId={profileUserId} useV2 />
								)}
							</>
						),
						el,
					),
			);
		});

		if (isMyProfile) {
			featureValueIs("copyShareLinks", true, () =>
				modifyItemContextMenu(() => <CopyShareLinkButton type="User" id={profileUserId} />),
			);
		} else {
			featureValueIs("viewUserProfileLocale", true, () => {
				const localePromise = tryOpenCloudAuthRequest(
					authenticatedUser.userId,
					authenticatedUser.isUnder13 === false,
					(credentials) =>
						getOpenCloudUser({
							credentials,
							userId: profileUserId,
						}).then((data) => data.locale),
				).catch(() => undefined);

				watchOnce(".user-profile-header-details-avatar-container").then((el) => {
					const afterEl = el.nextElementSibling?.lastElementChild;
					if (afterEl) {
						renderAfter(
							<UserProfileLocale userId={profileUserId} promise={localePromise} />,
							afterEl as HTMLElement,
						);
					}
				});
			});

			featureValueIs(FRIENDS_PRESENCE_NOTIFICATIONS_FEATURE_ID, true, () =>
				getUserFriendStatus({
					userId: profileUserId,
				}).then((data) => {
					if (data.status !== "Friends") return;

					modifyItemContextMenu(() => (
						<TrackConnectionActivityButton userId={profileUserId} />
					));
				}),
			);

			featureValueIs(FRIENDS_LAST_SEEN_FEATURE_ID, true, () => {
				getUserFriendStatus({
					userId: profileUserId,
				}).then((data) => {
					if (data.status !== "Friends") return;

					modifyItemStats("User", () => <UserLastSeen userId={profileUserId} />);
				});
			});
			featureValueIs("liveProfilePresenceUpdate", true, () => {
				setInterval(() => {
					if (isFocusedOnInput()) return;

					multigetUsersPresences({
						userIds: [profileUserId],
					}).then((data) => {
						if (isFocusedOnInput()) return;

						const mappedData = new Map();
						for (const item of data.userPresences) {
							mappedData.set(item.userId, item);
						}

						document.dispatchEvent(
							new CustomEvent("Roblox.Presence.Update", {
								detail: mappedData,
							}),
						);
					});
				}, 1_500);
			});
		}

		featureValueIs("desktopPastUsernamesButton", true, () => {
			watch(".modal-title > h4", async (h4) => {
				if (
					h4.textContent ===
					(await getLangNamespace("Feature.Profile"))["Label.PastUsername"]
				) {
					h4.closest(".modal")?.classList.add("past-usernames-modal");
				}
			});

			watchOnce(".profile-name-history .tooltip-pastnames").then((tooltipBtn) => {
				tooltipBtn.addEventListener("click", () => {
					(tooltipBtn.previousElementSibling as HTMLButtonElement | null)?.click();
				});
			});
		});

		featureValueIs("confirmRemoveConnection", true, async () => {
			const removeText = (await getLangNamespace("Feature.Profile"))[
				"Label.RemoveConnection"
			];

			const show = signal(false);
			let stop = false;
			const onClickUnfriend = (e: MouseEvent) => {
				if (stop || !e.isTrusted) return;
				e.stopImmediatePropagation();
				e.stopPropagation();

				show.value = true;
			};
			const onClickNeutral = () => {
				show.value = false;
			};
			const onClickAction = (shouldStop?: boolean) => {
				if (shouldStop) {
					stop = true;
					setFeatureValue("confirmRemoveConnection", false);
				}

				show.value = false;

				unfriendUser({
					userId: profileUserId,
				});
			};

			renderAppendBody(
				<ConfirmUnfriendModal
					show={show}
					onClickAction={onClickAction}
					onClickNeutral={onClickNeutral}
				/>,
			);
			const handleChange = (el: HTMLElement) => {
				if (el.textContent !== removeText) {
					el.removeEventListener("click", onClickUnfriend, {
						capture: true,
					});
					return;
				}

				el.addEventListener("click", onClickUnfriend, {
					capture: true,
				});
			};

			watch(".foundation-web-portal-zindex button", (el) => {
				if (stop) return;

				handleChange(el);
				watchTextContent(el, () => {
					if (stop) return;

					handleChange(el);
				});
			});
		});

		featureValueIs("cancelFriendRequests", true, async () => {
			let label: HTMLElement | undefined;
			let label2: HTMLElement | undefined;

			const pendingText = (await getLangNamespace("Feature.Profile"))["Action.Pending"];

			const cancelFriendRequest = () =>
				unfriendUser({ userId: profileUserId }).then(() => {
					if (!label) return;

					const cancelledText = getMessage("user.cancelFriendRequest.cancelled");
					label.textContent = cancelledText;
					label.classList.add("disabled", "Mui-disabled", "opacity-[0.5]");
					label.setAttribute("disabled", "");
					label.removeEventListener("click", cancelFriendRequest, {
						capture: true,
					});

					if (label2) {
						label2.textContent = cancelledText;
						label2.classList.add("disabled", "Mui-disabled", "opacity-[0.5]");
						label2.setAttribute("disabled", "");
						label2.removeEventListener("click", cancelFriendRequest, {
							capture: true,
						});
					}
				});

			const handleChange = (el: HTMLElement) => {
				if (el.textContent !== pendingText) {
					el.removeEventListener("click", cancelFriendRequest);
					return;
				}

				el.classList.remove("disabled", "Mui-disabled", "opacity-[0.5]");
				el.removeAttribute("disabled");
				el.textContent = getMessage("user.cancelFriendRequest");

				if (label) {
					label2 = el;
				} else {
					label = el;
				}

				el.addEventListener("click", cancelFriendRequest, {
					capture: true,
				});
			};

			watch(
				".profile-header-buttons button, .buttons-show-on-desktop button, .buttons-show-on-mobile button",
				(el) => {
					handleChange(el);
					watchTextContent(el, () => {
						handleChange(el);
					});
				},
			);
		});

		if (profileUserId !== authenticatedUser?.userId) {
			featureValueIs("removeFollowers", true, () => {
				modifyItemContextMenu(<RemoveFollowerButton userId={profileUserId} />);
			});
		}

		featureValueIs("userJoinCheck", true, () =>
			getDeviceMeta().then((deviceMeta) => {
				const overridePlatformType = deviceMeta?.platformType ?? "Desktop";

				onRobloxPresenceUpdateDetails((data) => {
					for (const item of data) {
						clearFollowUserJoinData({
							userIdToFollow: item.userId,
							overridePlatformType,
						});
					}
				});

				const joinButtonLabel = getLangNamespace("Feature.Profile").then(
					(data) => data["Action.JoinGame"],
				);
				watch(
					".desktop-action .btn-join-game, .profile-header-buttons > button, .buttons-show-on-desktop button, .buttons-show-on-mobile button",
					async (desktop) => {
						if (
							desktop.querySelector("span")?.textContent !== (await joinButtonLabel)
						) {
							return;
						}

						const mobile = document.querySelector(".mobile-action .btn-join-game");

						desktop.classList.add("roseal-disabled");
						mobile?.classList.add("roseal-disabled");

						determineCanJoinUser({
							userIdToFollow: profileUserId,
							overridePlatformType,
						})
							.then((data) => {
								if (data.disabled) {
									desktop.classList.add("roseal-grayscale");
									mobile?.classList.add("roseal-grayscale");
								} else {
									desktop.classList.remove("roseal-disabled");
									mobile?.classList.remove("roseal-disabled");
								}
								if (data.message) {
									desktop.querySelector("button, span")!.textContent =
										data.message;
								}
								/*
							if (data.asyncMessage) {
								data.asyncMessage.then((message) => {
									if (message)
										desktop.querySelector("button")!.textContent = message;
								});
							}*/
							})
							.catch(() => {
								desktop.classList.remove("roseal-disabled");
								mobile?.classList.remove("roseal-disabled");
							});
					},
				);
			}),
		);

		featureValueIs("formatItemMentions", true, () =>
			// use ng-binding to ensure that it is angular.
			watch(
				".profile-about-content-text.ng-binding, .profile-about-content-text[ng-non-bindable], .foundation-web-dialog-content .description-content, .user-profile-header > pre.description-content",
				(el) => renderMentions(el),
			),
		);

		featureValueIs("userProfileEasterEggs", true, () => {
			switch (profileUserId) {
				case ROBLOX_USERS.parryGripp: {
					watch(".user-profile-header-info", (desktopActions) => {
						const btn = (
							<TacoButton audioAssetId={ROBLOX_AUDIO_ASSETS.parryGrippTacoSong} />
						);
						renderAfter(btn, desktopActions);
					});
					break;
				}
				case ROBLOX_USERS.sayerSooth: {
					const birthdate = new Date(USER_BIRTHDAYS.sayerSooth);
					const date = new Date();

					if (isSameDay(date, setYear(birthdate, date.getFullYear()))) {
						sealRain(randomInt(10_000, 50_000), undefined, false);
					}
					break;
				}
				case ROBLOX_USERS.notValra: {
					watchOnce(".profile-platform-container").then((content) => {
						renderAfter(
							<Thumbnail
								containerClassName="roseal-valra"
								request={{
									type: "Asset",
									targetId: ROBLOX_IMAGE_ASSETS.gilbertDecal,
									size: "420x420",
								}}
							/>,
							content,
						);
					});
					break;
				}
				case ROBLOX_USERS.aliceeeNight: {
					watchOnce("#container-main").then((container) => {
						onDOMReady(() => {
							container.classList.add("has-background-color");
							container.style.setProperty("--profile-background-color", "#432f4e");
						});
					});
					break;
				}
			}
		});

		featureValueIs("cssFixes", true, () =>
			watch("#SaveInfoSettings", (el) => {
				el.classList.replace("btn-control-md", "btn-primary-md");
			}),
		);

		featureValueIs("previewFilteredText", true, () =>
			watch(
				"#SaveInfoSettings, .foundation-web-dialog-overlay .gap-small:has(.personal-field-description) .content-action-emphasis",
				(btn) => {
					let field =
						document.body.querySelector<HTMLTextAreaElement>(
							".foundation-web-dialog-overlay .personal-field-description",
						) ||
						document.body.querySelector<HTMLTextAreaElement>(
							"profile-description.profile-field-description",
						);
					let buttons =
						document.body.querySelector<HTMLButtonElement>(
							".foundation-web-dialog-overlay .gap-small:has(.personal-field-description) .content-action-emphasis",
						) ||
						document.body.querySelector<HTMLButtonElement>(
							"profile-description .description-buttons",
						);
					if (!field || !buttons) {
						return;
					}

					let currentText: string | undefined;
					let filterPreviewDiv: ContainerNode | undefined;
					btn.addEventListener(
						"click",
						(e) => {
							field =
								document.body.querySelector<HTMLTextAreaElement>(
									".foundation-web-dialog-overlay .personal-field-description",
								) ||
								document.body.querySelector<HTMLTextAreaElement>(
									"profile-description.profile-field-description",
								);
							buttons =
								document.body.querySelector<HTMLButtonElement>(
									".foundation-web-dialog-overlay .gap-small:has(.personal-field-description) .content-action-emphasis",
								) ||
								document.body.querySelector<HTMLButtonElement>(
									"profile-description .description-buttons",
								);

							if (!field) return;

							if (filterPreviewDiv) {
								render(null, filterPreviewDiv);
								filterPreviewDiv = undefined;
							}

							if (currentText === field.value) {
								currentText = undefined;

								return;
							}

							btn.classList.add("disabled");

							e.stopImmediatePropagation();

							const skipThrough = (sendEvent?: boolean) => {
								btn.classList.remove("disabled");
								if (field) currentText = field.value;

								if (sendEvent) {
									if (btn.click) {
										btn.click();
									} else {
										// I have no idea why i had this, but it's here!
										btn.dispatchEvent(new CustomEvent("click"));
									}
								}
							};

							const textToFilter = field.value;
							filterText({
								text: textToFilter,
							})
								.then((data) => {
									if (data.moderationLevel === 1) {
										return skipThrough(true);
									}

									if (!field || !buttons) return;

									filterPreviewDiv = renderBefore(
										<FilteredTextPreview
											text={field.value}
											filteredText={data.filteredText}
											moderationLevel={data.moderationLevel}
										/>,
										buttons,
									);
									skipThrough();
								})

								.catch(() => skipThrough(true));
						},
						{
							capture: true,
						},
					);
				},
			),
		);

		featureValueIs("pastUsernamesCount", true, () => {
			getLangNamespace("Feature.Profile").then((data) => {
				const expectText = data["Label.PreviousNames"];

				watch(".group-description-dialog-body-header", (text) => {
					if (text.textContent !== expectText) return;

					const count = text.nextElementSibling?.textContent?.split("; ").length;
					if (count)
						text.textContent = getMessage("user.pastUsernamesCount", {
							count,
						});
				});
			});

			watchOnce(".profile-name-history .tooltip-pastnames").then((tooltip) => {
				const count = (
					tooltip.dataset.originalTitle ?? tooltip.getAttribute("title")
				)?.split(", ").length;

				if (!count) {
					return;
				}

				const text = tooltip.nextElementSibling;
				if (text) {
					if (!text.textContent?.length) {
						watchTextContent(
							text,
							() => {
								text.textContent = getMessage("user.pastUsernamesCount", {
									count,
								});
							},
							true,
						);
					} else {
						text.textContent = getMessage("user.pastUsernamesCount", {
							count,
						});
					}
				}
			});
		});

		featureValueIs("profileCustomization", true, () => {
			const selectedBackground = signal<ProfileBackgroundAsset>();
			if (profileUserId === authenticatedUser.userId) {
				watchOnce(".profile-header-buttons").then((btns) => {
					renderPrepend(
						<CustomizeProfileButton
							selectedBackground={selectedBackground}
							container={btns}
						/>,
						btns,
					);
				});

				watch(
					".buttons-show-on-desktop .button-container, .buttons-show-on-mobile .button-container",
					(btns) => {
						renderPrepend(
							<CustomizeProfileButton
								selectedBackground={selectedBackground}
								container={btns}
							/>,
							btns,
						);
					},
				);
			}

			selectedBackground.subscribe((value) => {
				watchOnce("#container-main").then((main) => {
					if (value) {
						main.style.setProperty("--profile-background-color", value.hex);
						main.classList.add("has-background-color");
					} else {
						main.style.removeProperty("--profile-background-color");
						main.classList.remove("has-background-color");
					}
				});
			});

			getProfileComponentsData({
				profileType: "User",
				profileId: profileUserId.toString(),
				components: [
					{
						component: "ProfileBackground",
					},
				],
			}).then((data) => {
				const assetId = data.components.ProfileBackground?.assetId;

				if (data.components.ProfileBackground?.assetId) {
					for (const asset of PROFILE_BACKGROUND_ASSETS) {
						if (asset.modelAssetId === assetId) {
							selectedBackground.value = asset;
							return;
						}
					}
				}
			});
		});

		featureValueIs("showCommunityJoinedDate", true, () => {
			const groupIdToJoinedDate = signal<Record<string, string>>({});

			watch<HTMLAnchorElement>(
				"groups-showcase-grid .list-item .card-item, .btr-profile-groups .game-card .game-card-container a, .profile-communities .base-tile-metadata",
				(card) => {
					if (card.parentElement?.querySelector(".group-joined-date")) {
						return;
					}

					const link = card.closest("a")?.href;
					if (!link) {
						return;
					}

					const path = new URL(link).pathname;
					const idStr = GROUP_DETAILS_REGEX.exec(path)?.[2];
					if (!idStr) {
						return;
					}

					const id = Number.parseInt(idStr, 10);
					if (!card.parentElement) return;

					renderAppend(
						<UserCommunityJoinedDateGrid
							userId={profileUserId}
							groupId={id}
							state={groupIdToJoinedDate}
						/>,
						card.parentElement,
					);
				},
			);

			watch("#groups-switcher .slide-item-stats .hlist", (stats) => {
				if (stats.parentElement?.querySelector(".group-joined-date")) {
					return;
				}

				const link = stats.closest("li")?.querySelector("a")?.href;
				if (!link) {
					return;
				}

				const path = new URL(link).pathname;
				const idStr = GROUP_DETAILS_REGEX.exec(path)?.[2];
				if (!idStr) {
					return;
				}

				const id = Number.parseInt(idStr, 10);
				renderIn(
					<UserCommunityJoinedDateCarousel
						userId={profileUserId}
						groupId={id}
						state={groupIdToJoinedDate}
					/>,
					stats,
				);
			});
		});

		featureValueIs("showUserCommunitiesRoles", true, () =>
			listUserGroupsRoles({
				userId: profileUserId,
			}).then((data) => {
				watch(".profile-communities .base-tile-metadata", (card) => {
					const link = card.closest("a")?.href;
					if (!link) {
						return;
					}

					const path = new URL(link).pathname;
					const idStr = GROUP_DETAILS_REGEX.exec(path)?.[2];
					if (!idStr) {
						return;
					}

					const id = Number.parseInt(idStr, 10);
					const roleName = data.data.find((item) => item.group.id === id)?.role?.name;
					if (!roleName || !card.parentElement) return;

					renderAppend(<UserCommunityRoleGrid roleName={roleName} />, card.parentElement);
				});
			}),
		);

		if (profileUserId !== authenticatedUser?.userId) {
			featureValueIs("userBlockedScreen", true, () => {
				let currentBlockedContainer: ContainerNode | undefined;
				let currentViewerBlockedContainer: ContainerNode | undefined;

				const checkIfBlocked = () =>
					checkUsersReciprocalBlocked({
						userIds: [profileUserId],
						overrideCache: true,
					}).then(([{ isBlocked, isBlockingViewer }]) => {
						if (isBlockingViewer && !currentViewerBlockedContainer) {
							watchOnce(
								"#profile-header-title-container-name, .details-actions.desktop-action, .profile-header-buttons",
							).then((action) => {
								action.parentElement?.classList.add("viewer-is-blocked");

								if (currentViewerBlockedContainer) return;

								currentViewerBlockedContainer = renderAfter(
									<div className="viewer-blocked-text text">
										{getMessage("user.viewerBlocked")}
									</div>,
									action,
								);
							});
						} else if (!isBlockingViewer && currentViewerBlockedContainer) {
							render(null, currentViewerBlockedContainer);
							currentViewerBlockedContainer = undefined;

							document
								.querySelector(".viewer-is-blocked")
								?.classList.remove("viewer-is-blocked");
						}

						if (isBlocked && !currentBlockedContainer) {
							watchOnce(
								document.querySelector(".btr-profile")
									? ".profile-container"
									: ".profile-platform-container",
							).then((container) => {
								container.classList.add("user-is-blocked");

								setTimeout(() => {
									if (currentBlockedContainer) return;

									currentBlockedContainer = renderAppend(
										<BlockedScreen
											userId={profileUserId}
											onViewClick={() => {
												render(null, currentBlockedContainer!);
												currentBlockedContainer = undefined;
												container.classList.add("user-blocked-bypass");
											}}
										/>,
										container,
									);
								}, 100);
							});
						} else if (!isBlocked && currentBlockedContainer) {
							render(null, currentBlockedContainer);
							currentBlockedContainer = undefined;

							document.body
								?.querySelector(".user-is-blocked")
								?.classList.remove("user-is-blocked", "user-blocked-bypass");
						}
					});

				watch(
					".btn-friends > button, .profile-header-buttons > button, .buttons-show-on-desktop button, .buttons-show-on-mobile button",
					(button) => {
						watchAttributes(button, checkIfBlocked, ["class"]);
					},
				);

				checkIfBlocked();
			});
		}

		checkItemTimes("userProfiles").then(async (shouldHandle) => {
			if (!shouldHandle) {
				return;
			}

			const [joinText, statisticsText] = await getLangNamespace("Feature.Profile").then(
				(ns) => [ns["Label.JoinDate"], ns["Heading.Statistics"]],
			);

			watch(
				".foundation-web-dialog-overlay .group-description-dialog-body-header",
				(header) => {
					if (header.textContent !== statisticsText) return;

					renderAsContainer(
						<UserJoinDate userId={profileUserId} useV2 />,
						header.nextElementSibling! as HTMLElement,
					);
				},
			);

			watch(
				".profile-stats-container .profile-stat, #profile-statistics-container .profile-stat",
				(el, kill) => {
					const label = el.querySelector(".text-label, span")?.textContent;

					if (!label) {
						return;
					}

					if (label !== joinText) {
						return;
					}

					const render = () =>
						renderAsContainer(<UserJoinDate userId={profileUserId} />, el);

					const content = el.querySelector(".text-lead, time");
					if (!content) {
						return;
					}

					kill?.();
					if (content?.textContent?.length) {
						render();
					} else {
						watchTextContent(content, (node, kill) => {
							if (node.textContent?.length) {
								kill?.();
								render();
							}
						});
					}
				},
			);
		});

		featureValueIs("blockedItems", true, () =>
			modifyItemContextMenu(<BlockCreatorButton type="User" id={profileUserId} />),
		);
	},
} satisfies Page;
