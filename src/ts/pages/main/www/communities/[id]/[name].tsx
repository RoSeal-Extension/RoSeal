import { signal } from "@preact/signals";
import ItemContextMenu from "src/ts/components/core/ItemContextMenu";
import GroupAgentId from "src/ts/components/group/AgentId";
import GroupCreated from "src/ts/components/group/CreatedDate";
import DNDList from "src/ts/components/group/DNDList";
import GroupStoreSearch from "src/ts/components/group/GroupStoreSearch";
import CommunityJoinedDate from "src/ts/components/group/JoinedDate";
import PendingGroupsList from "src/ts/components/group/PendingGroupsList";
import GroupsTypeSwitch from "src/ts/components/group/TypeSwitch";
import BlockCreatorButton from "src/ts/components/item/BlockCreatorButton";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import {
	hideEl,
	modifyTitle,
	showEl,
	watch,
	watchOnce,
	watchTextContent,
} from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getGroupById, listUserGroupsRoles } from "src/ts/helpers/requests/services/groups";
import { listMyExperienceEvents } from "src/ts/helpers/requests/services/universes";
import { getAuthenticatedUser } from "src/ts/utils/authenticatedUser";
import { getDeviceMeta } from "src/ts/utils/context";
import { renderMentions } from "src/ts/utils/description";
import { setActiveGroup } from "src/ts/utils/groups";
import { determineCanJoinUser } from "src/ts/utils/joinData";
import { formatSeoName, getGroupProfileLink, getListCreationsLink } from "src/ts/utils/links";
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

		featureValueIs("formatItemMentions", true, () => {
			const handleEl = (el: HTMLElement) => {
				if (!el.textContent) {
					watchTextContent(el, () => handleEl(el), true);
				} else {
					renderMentions(el);
				}
			};
			watch(
				".group-description-content-text, .description-container .description-content, .group-description-dialog-body-content:not(.block)",
				handleEl,
			);
		});
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

		featureValueIs("userJoinCheck", true, () => {
			watch("#action-button-JoinExperience", (btn) => {
				const userLink = btn.closest("a");
				if (!userLink?.href) return;

				const parsedUserId = USER_PROFILE_REGEX.exec(
					getPathFromMaybeUrl(userLink.href).realPath,
				)?.[1];
				if (!parsedUserId) return;

				const userId = Number.parseInt(parsedUserId, 10);

				btn.classList.add("roseal-disabled");
				getDeviceMeta().then((data) =>
					determineCanJoinUser({
						userIdToFollow: userId,
						overridePlatformType: data?.platformType,
					})
						.then((data) => {
							if (data.message) {
								btn.textContent = data.message;
							}

							if (data.disabled) {
								btn.classList.add("roseal-grayscale");
							} else {
								btn.classList.remove("roseal-disabled");
							}
						})
						.catch(() => btn.classList.remove("roseal-disabled")),
				);
			});
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
