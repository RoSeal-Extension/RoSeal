import { signal } from "@preact/signals";
import { render } from "preact";
import ItemContextMenu from "src/ts/components/core/ItemContextMenu";
import GroupAgentId from "src/ts/components/group/AgentId";
import CommunityShoutNotificationsToggle from "src/ts/components/group/CommunityShoutNotificationsToggle";
import GroupCreated from "src/ts/components/group/CreatedDate";
import DNDList from "src/ts/components/group/DNDList";
import GroupStoreSearch from "src/ts/components/group/GroupStoreSearch";
import CommunityJoinedDate from "src/ts/components/group/JoinedDate";
import PendingGroupsList from "src/ts/components/group/PendingGroupsList";
import GroupsTypeSwitch from "src/ts/components/group/TypeSwitch";
import GroupWallPaginator from "src/ts/components/group/WallPaginator";
import BlockCreatorButton from "src/ts/components/item/BlockCreatorButton";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import { ROBLOX_COMMUNITIES } from "src/ts/constants/robloxCommunities";
import { invokeMessage } from "src/ts/helpers/communication/dom";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { hideEl, modifyTitle, showEl, watch, watchOnce } from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getGroupById, listUserGroupsRoles } from "src/ts/helpers/requests/services/groups";
import { listMyExperienceEvents } from "src/ts/helpers/requests/services/universes";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { renderMentions } from "src/ts/utils/description";
import { setActiveGroup } from "src/ts/utils/groups";
import {
	formatSeoName,
	getGroupProfileLink,
	getListCreationsLink,
	getUserTradeLink,
} from "src/ts/utils/links";
import { GROUP_DETAILS_REGEX, USER_PROFILE_REGEX } from "src/ts/utils/regex";
import { renderAfter, renderAppend, renderAsContainer, renderBefore } from "src/ts/utils/render";
import { getPath, getPathFromMaybeUrl } from "src/ts/utils/url";

export default {
	id: "community.details",
	regex: [GROUP_DETAILS_REGEX],
	css: ["css/communityProfile.css"],
	fn: ({ regexMatches }) => {
		const groupId = signal(Number.parseInt(regexMatches![0][2], 10));
		const groupName = signal(regexMatches![0][4].replaceAll("-", " "));

		featureValueIs("communityWallTradeLinks", true, () =>
			watch<HTMLAnchorElement>(".group-comments-container .content-emphasis", (userLink) => {
				if (!ROBLOX_COMMUNITIES.TradeCommunities.includes(groupId.value)) return;

				const link = userLink.href;
				if (!link) return;

				const path = getPathFromMaybeUrl(link);
				const match = USER_PROFILE_REGEX.exec(path.realPath);
				if (match) {
					const userId = Number.parseInt(match[1], 10);
					renderAfter(
						<a
							className="text-link user-trade-link text-label-medium"
							href={getUserTradeLink(userId)}
						>
							{getMessage("group.wall.post.trade")}
						</a>,
						userLink,
					);
				}
			}),
		);

		featureValueIs("communityShoutNotifications", true, () =>
			watch("#group-shout .container-header > h2", (h2) => {
				if (h2.parentElement?.querySelector(".group-announcements-notifications-icon"))
					return;
				h2.parentElement?.classList.add("flex", "items-center", "justify-between");
				h2.classList.add("grow-1");

				renderAfter(
					() => <CommunityShoutNotificationsToggle communityId={groupId.value} />,
					h2,
				);
			}),
		);

		featureValueIs("showRequestToJoinCommunity", true, () => {
			const expectedText = getLangNamespace("Feature.Groups").then(
				(record) => record["Action.JoinGroup"],
			);
			watch(`[ng-bind="'Action.JoinGroup' | translate"], .actions-btn span`, async (join) => {
				if (join.textContent !== (await expectedText)) return;
				getGroupById({
					groupId: groupId.value,
				}).then((data) => {
					if (!data.publicEntryAllowed) {
						join.textContent = getMessage("group.join.requestToJoin");
					}
				});
			});
		});

		featureValueIs("disableGroupWallInfiniteScrolling", true, () =>
			invokeMessage("group.wall.setupPagination", undefined).then(() => {
				watch("group-wall", (wall) => {
					const previousPaginator = wall.querySelector("#group-wall-paginate");
					if (previousPaginator) {
						render(null, previousPaginator);
					}

					renderAppend(<GroupWallPaginator />, wall);
				});
			}),
		);

		featureValueIs("showCommunityJoinedDate", true, () => {
			let currentContainer: HTMLElement | undefined;
			watch(".profile-insights-container", (container) => {
				if (currentContainer === container) return;
				currentContainer = container;

				if (container.closest(".MuiSkeleton-root") || !container.isConnected) return;

				renderAppend(() => <CommunityJoinedDate groupId={groupId.value} />, container);
			});
		});

		featureValueIs("viewUserGroupJoinRequests", true, () =>
			watch<HTMLElement>(
				".group-react-groups-list:not(.pending-join-requests)",
				(joinedGroups) => {
					const parent = joinedGroups.parentElement!;
					if (parent.classList.contains("hide-pending-groups")) return;

					parent.classList.add("hide-pending-groups");

					renderBefore(<GroupsTypeSwitch container={parent} />, joinedGroups);
					renderAfter(
						<PendingGroupsList groupId={groupId} groupName={groupName} />,
						joinedGroups,
					);
				},
			),
		);

		featureValueIs("groupOrganization", true, () =>
			watchOnce<HTMLElement>("group-react-groups-list").then((joinedGroups) => {
				renderAsContainer(
					<DNDList activeGroupId={groupId} activeGroupName={groupName} />,
					joinedGroups,
				);
			}),
		);

		featureValueIs("hideEmptyGroupEvents", true, async () => {
			const authenticatedUser = await getAuthenticatedUser();
			const hideEmptyOwner = await getFeatureValue("hideEmptyGroupEvents.hideEmptyForOwner");

			if (!authenticatedUser) {
				return;
			}

			const roles = await listUserGroupsRoles({
				userId: authenticatedUser.userId,
			});

			if (hideEmptyOwner) {
				modifyItemContextMenu(() => (
					<>
						{roles?.data.find((role) => role.group.id === groupId.value)?.role.rank ===
							255 && (
							<li id="create-event-li" className="roseal-menu-item">
								<a
									id="create-event-btn"
									href={getListCreationsLink(undefined, groupId.value)}
								>
									{getMessage("group.contextMenu.createEvent")}
								</a>
							</li>
						)}
					</>
				));
			}

			const eventsTab = await watchOnce("#events");
			const otherTabs = eventsTab.parentElement?.querySelectorAll<HTMLElement>(
				"& > .group-tab:not(#events)",
			);

			if (!otherTabs) {
				return;
			}

			groupId.subscribe((value) => {
				hideEl(eventsTab);

				if (
					!hideEmptyOwner &&
					roles?.data.find((role) => role.group.id === value)?.role.rank === 255
				) {
					showEl(eventsTab);

					return;
				}

				listMyExperienceEvents({
					groupId: value,
					filterBy: "upcoming",
					fromUtc: new Date().toISOString(),
					sortBy: "startUtc",
					sortOrder: "Desc",
				}).then((data) => {
					if (groupId.value !== value) {
						return;
					}
					if (data.data.length) {
						showEl(eventsTab);

						return;
					}

					if (eventsTab.classList.contains("active")) {
						eventsTab.parentElement?.querySelector<HTMLLIElement>("#about")?.click();
					}
				});
			});
		});

		featureValueIs("formatItemMentions", true, () =>
			watch(
				".group-description-content-text, .description-container .description-content, .group-description-dialog-body-content:not(.block)",
				(el) => renderMentions(el),
			),
		);
		featureValueIs("showGroupCreatedDate", true, () => {
			modifyItemStats("Group", () => <GroupCreated groupId={groupId.value} />);
		});

		featureValueIs("showGroupAgentId", true, () => {
			modifyItemStats("Group", () => <GroupAgentId groupId={groupId.value} />);
		});

		featureValueIs("searchGroupStore", true, () => {
			watch("group-store .see-all-link-icon", (el) => {
				if (el.parentElement?.querySelector(".keyword-search-input")) {
					return;
				}

				renderBefore(<GroupStoreSearch groupId={groupId} />, el);
			});
		});

		featureValueIs("groupSeamlessNavigation", true, () => {
			let justChangedTab = false;
			globalThis.addEventListener("hashchange", () => {
				if (location.hash.startsWith("#!/forums")) return;
				try {
					if (justChangedTab) {
						justChangedTab = false;
						return;
					}

					if (!justChangedTab) {
						document.body
							?.querySelector<HTMLLIElement>(
								`#horizontal-tabs .group-tab#${location.hash.replace("#!/", "")}`,
							)
							?.click();
					}
				} catch {}
			});

			const realNameMapping = new Map<number, string>();
			groupName.subscribe((value) => {
				const name = realNameMapping.get(groupId.value) ?? value;
				if (name) {
					modifyTitle(name);
					realNameMapping.set(groupId.value, name);
				}
			});

			globalThis.addEventListener("popstate", () => {
				if (justChangedTab) {
					justChangedTab = false;
					return;
				}

				if (location.hash.startsWith("#!/forums")) return;

				const detail = getPath().realPath.match(GROUP_DETAILS_REGEX);
				if (!detail) return;

				const newGroupId = Number.parseInt(detail[2], 10);
				const newGroupName = detail[4]?.replaceAll("-", " ");

				if (!newGroupId || !newGroupName) return;
				if (newGroupId === groupId.value) {
					if (newGroupName !== formatSeoName(groupName.value)) {
						groupName.value = newGroupName;
					}
					return;
				}
				setActiveGroup(groupId, groupName, newGroupId, newGroupName, false);
			});

			watch<HTMLLIElement>("#horizontal-tabs .group-tab", (tab) => {
				if (tab.id?.startsWith("btr")) return;

				tab.addEventListener("click", (e) => {
					if (justChangedTab || !e.isTrusted) {
						return;
					}

					justChangedTab = true;
					setTimeout(() => {
						history.replaceState(
							undefined,
							"",
							getGroupProfileLink(groupId.value, groupName.value, tab.id),
						);
					}, 100);
				});
			});

			watch<HTMLAnchorElement>(
				".groups-list .group-cards:not(.roseal-scrollbar) li a, group-card .card-item, [group-react-groups-list] .groups-list-item",
				(group) => {
					group.addEventListener(
						"click",
						(event) => {
							const newGroupName =
								group.title ||
								group.querySelector(".game-card-name, .text-title-medium")
									?.textContent ||
								"unnamed";
							const match = group.href.match(/(\d+)/);
							if (match) {
								const newGroupId = Number.parseInt(match[1], 10);
								if (groupId) {
									event.preventDefault();
									if (groupId.value === newGroupId) return;
									setActiveGroup(groupId, groupName, newGroupId, newGroupName);
								}
							}
						},
						true,
					);
				},
			);
		});

		featureValueIs("viewItemMedia", true, () => {
			modifyItemContextMenu(() => (
				<ViewIconAssetButton itemType="Group" itemId={groupId.value} />
			));
		});

		featureValueIs("blockedItems", true, () => {
			watch(`[ng-bind="'Label.GroupLocked' | translate"]`, (el) =>
				renderAfter(
					() => (
						<ItemContextMenu containerClassName="deleted-community-context-menu">
							<BlockCreatorButton type="Group" id={groupId.value} />
						</ItemContextMenu>
					),
					el,
				),
			);
			modifyItemContextMenu(() => <BlockCreatorButton type="Group" id={groupId.value} />);
		});
	},
} satisfies Page;
