import { signal } from "@preact/signals";
import { isSameDay, setYear } from "date-fns";
import { type ContainerNode, render } from "preact";
import BlockCreatorButton from "src/ts/components/item/BlockCreatorButton";
import CopyShareLinkButton from "src/ts/components/misc/CopyShareLinkButton";
import BlockedScreen from "src/ts/components/users/userProfile/BlockedScreen";
import UserCommunityJoinedDateCarousel from "src/ts/components/users/userProfile/communities/JoinedDateCarousel";
import UserCommunityJoinedDateGrid from "src/ts/components/users/userProfile/communities/JoinedDateGrid";
import CustomizeProfileButton from "src/ts/components/users/userProfile/CustomizeProfileButton";
import Download3DAvatarButton from "src/ts/components/users/userProfile/avatar/DownloadAvatarButton";
import FilteredTextPreview from "src/ts/components/users/userProfile/FilteredTextPreview";
import UserJoinDate from "src/ts/components/users/userProfile/JoinDate";
import UserLastSeen from "src/ts/components/users/userProfile/LastSeen";
import ConfirmUnfriendModal from "src/ts/components/users/userProfile/modals/ConfirmUnfriendModal";
import MutualFriendsHeader from "src/ts/components/users/userProfile/MutualFriendsHeader";
import PlayerBadgesContainer from "src/ts/components/users/userProfile/PlayerBadgesContainer";
import UserPortraitView from "src/ts/components/users/userProfile/PortraitView";
import RemoveFollowerButton from "src/ts/components/users/userProfile/RemoveFollowerButton";
import RobloxBadgesContainer from "src/ts/components/users/userProfile/RobloxBadgesContainer";
import SearchMarketplaceItemsButton from "src/ts/components/users/userProfile/SearchMarketplaceItemsButton";
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
import { filterText, getProfileComponentsData } from "src/ts/helpers/requests/services/misc";
import {
	checkUsersReciprocalBlocked,
	getUserFriendStatus,
	multigetUsersPresences,
	unfriendUser,
} from "src/ts/helpers/requests/services/users";
import { checkItemTimes } from "src/ts/specials/times";
import { getAuthenticatedUser, isAuthenticated } from "src/ts/utils/authenticatedUser";
import { getDeviceMeta } from "src/ts/utils/context";
import { renderMentions } from "src/ts/utils/description";
import { isFocusedOnInput } from "src/ts/utils/dom";
import { sealRain } from "src/ts/utils/fun/sealRain";
import { clearFollowUserJoinData, determineCanJoinUser } from "src/ts/utils/joinData";
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
import UserProfileCurrentlyWearing from "src/ts/components/users/userProfile/avatar/CurrentlyWearing";

export default {
	id: "user.profile",
	regex: [USER_PROFILE_REGEX],
	css: ["css/userProfile.css"],
	fn: async ({ regexMatches }) => {
		if (!(await isAuthenticated())) return;

		const authenticatedUser = (await getAuthenticatedUser())!;
		const profileUserId = Number.parseInt(regexMatches![0]?.[1], 10);

		featureValueIs("robloxBadgesObtainedDates", true, () =>
			watch(
				".profile-platform-container #roblox-badges-container, .btr-profile-left .placeholder-robloxbadges, .btr-profile-left #roblox-badges-container",
				(container) => {
					renderAsContainer(<RobloxBadgesContainer userId={profileUserId} />, container);
				},
			),
		);

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

		featureValueIs("viewUserRAP", true, () =>
			watchOnce(".profile-header-social-counts").then((el) =>
				renderAppend(<UserRAPHeader userId={profileUserId} />, el),
			),
		);

		if (authenticatedUser.userId === profileUserId) {
			featureValueIs("copyShareLinks", true, () =>
				modifyItemContextMenu(() => <CopyShareLinkButton type="User" id={profileUserId} />),
			);
		} else {
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

			featureValueIs("improvedUserFriendsPage.mutualsTab", true, () =>
				watchOnce(".profile-header-social-counts").then((el) =>
					renderAppend(<MutualFriendsHeader userId={profileUserId} />, el),
				),
			);

			featureValueIs("liveProfilePresenceUpdate", true, () => {
				setInterval(() => {
					if (isFocusedOnInput()) return;

					multigetUsersPresences({
						userIds: [profileUserId],
					}).then((data) => {
						if (isFocusedOnInput()) return;

						document.dispatchEvent(
							new CustomEvent("Roblox.Presence.Update", {
								detail: data.userPresences,
							}),
						);
					});
				}, 1_500);
			});
		}

		multigetFeaturesValues(["viewUserProfileLocale", "linkUserMarketplaceShop"]).then(
			(data) => {
				if (!data.linkUserMarketplaceShop && !data.viewUserProfileLocale) return;

				watchOnce("#profile-header-container .header-names, .profile-header-names").then(
					(details) => {
						const div = document.createElement("div");
						div.classList.add("header-misc");
						details.after(div);

						if (data.viewUserProfileLocale)
							renderIn(<UserProfileLocale userId={profileUserId} />, div);
						if (data.linkUserMarketplaceShop)
							renderIn(<SearchMarketplaceItemsButton userId={profileUserId} />, div);
					},
				);
			},
		);

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
			let label: HTMLElement | undefined;

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

				label?.click();
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

				label = el;
				el.addEventListener("click", onClickUnfriend, {
					capture: true,
				});
			};

			watch(".profile-header-buttons button", (el) => {
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

			const pendingText = (await getLangNamespace("Feature.Profile"))["Action.Pending"];

			const cancelFriendRequest = () =>
				unfriendUser({ userId: profileUserId }).then(() => {
					if (!label) return;

					const cancelledText = getMessage("user.cancelFriendRequest.cancelled");
					label.textContent = cancelledText;
					label.classList.add("disabled", "Mui-disabled");
					label.setAttribute("disabled", "");
					label.removeEventListener("click", cancelFriendRequest, {
						capture: true,
					});
				});

			const handleChange = (el: HTMLElement) => {
				if (el.textContent !== pendingText) {
					el.removeEventListener("click", cancelFriendRequest);
					return;
				}

				el.classList.remove("disabled", "Mui-disabled");
				el.removeAttribute("disabled");
				el.textContent = getMessage("user.cancelFriendRequest");

				label = el;
				el.addEventListener("click", cancelFriendRequest, {
					capture: true,
				});
			};

			watch(".profile-header-buttons button", (el) => {
				handleChange(el);
				watchTextContent(el, () => {
					handleChange(el);
				});
			});
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
					".desktop-action .btn-join-game, .profile-header-buttons > button",
					async (desktop) => {
						if (desktop.className.includes("Mui")) {
							if (
								desktop.querySelector("span")?.textContent !==
								(await joinButtonLabel)
							) {
								return;
							}
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

		featureValueIs("showAdministratorBadgeUserHeader", true, () =>
			watchOnce(
				"#roseal-roblox-badges-container .icon-badge-administrator, #roblox-badges-container .icon-badge-administrator",
			).then((icon) => {
				const badge = icon.closest("a");
				if (!badge) return;

				const clone = badge.cloneNode(true) as HTMLDivElement;
				clone.classList.add("roseal-admin-badge");
				clone.querySelector(".user-profile-pop-up-text")?.remove();

				watchOnce(".profile-header-title-container > span").then((span) => {
					span.after(clone);
				});
			}),
		);

		featureValueIs("formatItemMentions", true, () =>
			// use ng-binding to ensure that it is angular.
			// if it randomly becomes React, it won't frick up

			watch(
				".profile-about-content-text.ng-binding, .profile-about-content-text[ng-non-bindable]",
				(el) => renderMentions(el),
			),
		);

		featureValueIs("userProfileEasterEggs", true, () => {
			if (profileUserId === ROBLOX_USERS.parryGripp) {
				watchOnce(".profile-header-main").then((desktopActions) => {
					const btn = (
						<TacoButton audioAssetId={ROBLOX_AUDIO_ASSETS.parryGrippTacoSong} />
					);
					renderAfter(btn, desktopActions);
				});
			} else if (profileUserId === ROBLOX_USERS.sayerSooth) {
				const birthdate = new Date(USER_BIRTHDAYS.sayerSooth);
				const date = new Date();

				if (isSameDay(date, setYear(birthdate, date.getFullYear()))) {
					sealRain(randomInt(10_000, 50_000), undefined, false);
				}
			}
		});

		featureValueIs("cssFixes", true, () =>
			watch("#SaveInfoSettings", (el) => {
				el.classList.replace("btn-control-md", "btn-primary-md");
			}),
		);

		featureValueIs("previewFilteredText", true, () =>
			watch("#SaveInfoSettings", (btn) => {
				const field = document.body.querySelector<HTMLTextAreaElement>(
					"profile-description .personal-field-description",
				);
				const buttons = document.body.querySelector<HTMLButtonElement>(
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
							currentText = field.value;

							if (sendEvent) {
								btn.dispatchEvent(new CustomEvent("click"));
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
			}),
		);

		featureValueIs("pastUsernamesCount", true, () => {
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
						<CustomizeProfileButton selectedBackground={selectedBackground} />,
						btns,
					);
				});
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
				"groups-showcase-grid .list-item .card-item, .btr-profile-groups .game-card .game-card-container a",
				(card) => {
					if (card.parentElement?.querySelector(".group-joined-date")) {
						return;
					}

					const link = card.href;
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
								".details-actions.desktop-action, .profile-header-buttons",
							).then((action) => {
								action.parentElement?.classList.add("viewer-is-blocked");

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

				watch(".btn-friends > button, .profile-header-buttons > button", (button) => {
					watchAttributes(button, checkIfBlocked, ["class"]);
				});

				checkIfBlocked();
			});
		}

		checkItemTimes("userProfiles").then((shouldHandle) => {
			if (!shouldHandle) {
				return;
			}

			watch(
				".profile-stats-container .profile-stat, #profile-statistics-container .profile-stat",
				async (el, kill) => {
					const label = el.querySelector(".text-label, span")?.textContent;

					if (!label) {
						return;
					}

					const expect = await getLangNamespace("Feature.Profile").then(
						(ns) => ns["Label.JoinDate"],
					);

					if (label !== expect) {
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
