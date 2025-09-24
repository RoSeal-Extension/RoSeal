import { render } from "preact";
import CreateFriendLinkButton from "src/ts/components/userFriends/CreateFriendLinkButton";
import FriendCardContextMenu from "src/ts/components/userFriends/FriendCardContextMenu";
import UserFriendsPage, { type FriendsTabType } from "src/ts/components/userFriends/Page";
import { watch, watchOnce, watchTextContent } from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { profileProcessor } from "src/ts/helpers/processors/profileProcessor";
import { getUserProfileDocument } from "src/ts/helpers/requests/services/misc";
import { getUserById } from "src/ts/helpers/requests/services/users";
import { getAuthenticatedUser, isAuthenticated } from "src/ts/utils/authenticatedUser";
import { USER_FRIENDS_REGEX } from "src/ts/utils/regex";
import { renderAfter } from "src/ts/utils/render";
import { listAllFriends } from "src/ts/utils/users";

export default {
	id: "user.friends",
	regex: [USER_FRIENDS_REGEX],
	css: ["css/userFriends.css"],
	injectScripts: [
		{
			document: getUserProfileDocument,
			selectors: [['[data-bundlename="ProfileBadges"]']],
		},
	],
	fn: async ({ regexMatches }) => {
		const authenticatedUser = await getAuthenticatedUser();
		const targetUserId = regexMatches?.[0]?.[2]
			? Number.parseInt(regexMatches?.[0]?.[2], 10)
			: authenticatedUser!.userId;

		const isRedesignedFriendsPageEnabled = await getFeatureValue("improvedUserFriendsPage");
		if (isRedesignedFriendsPageEnabled) {
			watchOnce("#friends-web-app").then((app) => {
				app.id = "roseal-friends-web-app";
				app.replaceChildren();
				render(
					<UserFriendsPage
						userId={targetUserId}
						isMyProfile={authenticatedUser?.userId === targetUserId}
					/>,
					app,
				);
			});

			return;
		}

		if (!(await isAuthenticated())) return;
		const isCurrentUserPage = targetUserId === authenticatedUser?.userId;

		if (!isCurrentUserPage)
			featureValueIs("userPagesNewTitle", true, () =>
				getUserById({ userId: targetUserId })
					.then((data) => {
						const { name, displayName } = data;
						if (name === displayName) return;

						watch(".friends-title", (title) => {
							const newText = getMessage("friends.newTitle", {
								displayName,
								username: name,
							});

							watchTextContent(title, () => {
								if (newText === title.textContent) return;
								title.textContent = newText;
							});

							title.textContent = newText;
						});
					})
					.catch(() => {}),
			);

		if (!isCurrentUserPage) {
			return;
		}

		featureValueIs("handleFriendLinks", true, () =>
			watch(".friends-subtitle", (subtitle) => {
				const currentTab = subtitle
					.closest<HTMLDivElement>(".rbx-tabs-horizontal")
					?.querySelector(".rbx-tab-heading.active")?.parentElement?.id;

				if (currentTab !== "friends") return;
				renderAfter(
					<CreateFriendLinkButton />,
					subtitle.parentElement?.querySelector(".friends-filter") ?? subtitle,
				);
			}),
		);

		featureValueIs("userFriendsMoreActions", true, () => {
			const friends = listAllFriends(targetUserId).then((data) =>
				profileProcessor.requestBatch(
					data.map((item) => ({
						userId: item.id,
					})),
				),
			);

			watchOnce(".page-content .nav-tabs > li").then((tab) => {
				const content = tab.closest(".page-content")!;

				const hiddenUserIds: Record<string, number[]> = {};
				watch<HTMLElement>(".friends-content .avatar-card:last-child", async () => {
					const cards = document.body.querySelectorAll<HTMLElement>(
						".friends-content .avatar-card",
					);
					const currentTabId =
						content.querySelector(".rbx-tab-heading.active")?.parentElement?.id;
					if (!currentTabId) return;

					for (const card of cards) {
						const cardUserId = Number.parseInt(card.id, 10);
						if (!cardUserId || hiddenUserIds[currentTabId]?.includes(cardUserId)) {
							continue;
						}

						const caption = card.querySelector<HTMLElement>(".avatar-card-caption");
						if (caption) {
							caption.classList.add("has-menu");
							card.querySelector(".avatar-card-menu")?.remove();

							renderAfter(
								<FriendCardContextMenu
									userId={cardUserId}
									tabId={currentTabId as FriendsTabType}
									isFriends={friends.then((friends) =>
										friends.some((item) => item.userId === cardUserId),
									)}
									isDeleted={friends.then(
										(friends) =>
											friends.find((item) => item.userId === cardUserId)
												?.isDeleted,
									)}
									hideCard={(addToHidden) => {
										card.style.setProperty("display", "none");

										if (addToHidden) {
											hiddenUserIds[currentTabId] ??= [];
											hiddenUserIds[currentTabId].push(cardUserId);
										}
									}}
									showOtherOptions
								/>,
								caption,
							);
						}
					}
				});
			});
		});
	},
} satisfies Page;
