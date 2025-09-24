import { signal } from "@preact/signals";
import type angular from "angular";
import type { ComponentType } from "preact";
import {
	addMessageListener,
	sendMessage,
	setInvokeListener,
} from "src/ts/helpers/communication/dom";
import { watch } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import { hijackCreateElement } from "src/ts/helpers/hijack/react";
import { onSet } from "src/ts/helpers/hijack/utils";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { GROUP_DETAILS_REGEX } from "src/ts/utils/regex";

export type GroupStoreAngularScope = angular.IScope & {
	storePager: {
		isBusy: () => boolean;
		loadFirstPage: () => void;
		setPagingParameter: (key: string, value: string) => void;
		getPagingParameter: (key: string) => string | null;
		getCurrentPageNumber: () => number;
	};
	$ctrl: {
		storeItems: unknown[];
	};
};

export default {
	id: "community.profile",
	regex: [GROUP_DETAILS_REGEX],
	globalDependencies: ["angular"],
	fn: ({ dependencies, regexMatches }) => {
		const groupId = signal(Number.parseInt(regexMatches![0][2], 10));

		featureValueIsInject("moveCommunitySocialLinks", true, () => {
			let groupProviderType: ComponentType | undefined;
			let groupProviderProps: Record<string, Record<string, unknown>> | undefined;

			let previousSocialLinks: unknown | undefined;
			hijackCreateElement(
				(_, props) => !!props && "communityProfileHeaderData" in props,
				(_, type, props) => {
					groupProviderType = type as ComponentType;
					groupProviderProps = props as Record<string, Record<string, unknown>>;

					const socialLinksContainer = document.body?.querySelector(
						".roseal-social-links-container",
					);
					if (!groupProviderProps?.aboutData?.socialLinks && socialLinksContainer) {
						socialLinksContainer.remove();
					}
				},
			);

			hijackCreateElement(
				(_, props) => !!props && "socialLinks" in props && !("open" in props),
				(createElement, type, props) => {
					const insightsContainer = document.querySelector(".profile-insights-container");
					if (!insightsContainer) {
						return;
					}

					const socialLinksContainer = document.body?.querySelector(
						".roseal-social-links-container",
					);
					if (socialLinksContainer) {
						if (previousSocialLinks === (props as Record<string, unknown>).socialLinks)
							return;

						socialLinksContainer.remove();
					}
					previousSocialLinks = (props as Record<string, unknown>).socialLinks;

					if (groupProviderType && groupProviderProps) {
						const div = document.createElement("div");
						div.classList.add("roseal-social-links-container");
						insightsContainer.before(div);

						try {
							if (
								(groupProviderProps as Record<string, unknown>).groupId ===
								groupId.value
							)
								window.ReactDOM.render(
									createElement(() => {
										const theme = window.ReactUtilities.useTheme();
										const cache = window.Roblox.ui.createCache();

										return createElement(
											window.Roblox.ui.CacheProvider,
											{
												cache,
											},
											createElement(
												groupProviderType!,
												groupProviderProps!,
												createElement(
													window.Roblox.ui.UIThemeProvider,
													{
														theme,
													},
													createElement(
														type,
														props as Record<string, unknown>,
													),
												),
											),
										);
									}, {}),
									div,
								);
						} catch {}
					}

					return;
				},
			);
		});

		addMessageListener("group.setActiveGroup", (data) => {
			groupId.value = data.groupId;
			document.body?.querySelector(".roseal-social-links-container")?.remove();
			const scope = dependencies!.angular.element("[group-base] div").scope<
				angular.IScope & {
					layout?: {
						loadGroupError?: boolean;
					};
					linkedCommunityInfo?: unknown;
					updateGroup?: (groupId: number) => void;
					loadProfilePlatform?: (groupId: number) => void;
					groupAnnouncement?: unknown;
				}
			>();
			if (scope) {
				if (scope.layout?.loadGroupError) {
					scope.layout.loadGroupError = false;
				}
				if (scope.linkedCommunityInfo) {
					scope.linkedCommunityInfo = {};
				}
				if (scope.groupAnnouncement) {
					scope.groupAnnouncement = {};
				}

				scope.loadProfilePlatform?.(data.groupId);
				scope.updateGroup?.(data.groupId);
			}
			document.body?.querySelector(".dismissable-announcement-upsell-banner")?.remove();
			const storeScope = dependencies!.angular
				.element("group-store .group-store")
				?.scope<GroupStoreAngularScope>();
			if (storeScope) {
				storeScope.storePager.setPagingParameter("keyword", "");
			}

			watch("group-description div", (div, kill) => {
				const $ctrl = dependencies!.angular.element(div).scope<
					angular.IScope & {
						$ctrl: {
							groupId: number;
						};
					}
				>()?.$ctrl;
				if ($ctrl.groupId === data.groupId) {
					kill?.();
					dependencies!.angular
						.element("group-description div")
						?.scope<angular.IScope & { $ctrl: { $onInit: () => void } }>()
						?.$ctrl?.$onInit?.();
				}
			});
		});

		let paginationEnabled = false;
		let hasSetup = false;
		let wallScope:
			| (angular.IScope & {
					groupWall: {
						posts: [];
						pager: {
							loadNextPage: () => void;
							loadPreviousPage: () => void;
							isBusy: () => boolean;
							canLoadNextPage: () => boolean;
						};
					};
					isInfiniteScrollingDisabled: () => boolean;
			  })
			| undefined = undefined;

		watch("group-wall .section", (section) => {
			wallScope = dependencies!.angular
				.element(section)
				.scope<Exclude<typeof wallScope, undefined>>();
			if (wallScope && paginationEnabled) {
				wallScope.isInfiniteScrollingDisabled = () => true;
			}

			if (!hasSetup) {
				hasSetup = true;

				setupGroupWallPagination();
			}
		});

		const setupGroupWallPagination = () => {
			setInvokeListener("group.wall.setupPagination", () => {
				paginationEnabled = true;

				if (wallScope) {
					wallScope.isInfiniteScrollingDisabled = () => true;
				}
			});

			setInvokeListener(
				"group.wall.onReady",
				() =>
					new Promise((resolve) => {
						if (!wallScope?.groupWall.pager.isBusy()) return resolve(true);

						const interval = setInterval(() => {
							if (!wallScope?.groupWall.pager.isBusy()) {
								clearInterval(interval);

								resolve(true);
							}
						}, 100);
					}),
			);

			addMessageListener("group.wall.paginate", (forward) => {
				if (!wallScope) return;
				wallScope.groupWall.posts = [];

				if (forward) {
					wallScope.groupWall.pager.loadNextPage();
				} else {
					wallScope.groupWall.pager.loadPreviousPage();
				}
			});

			setInvokeListener(
				"group.wall.canLoadNextPage",
				() => wallScope?.groupWall.pager.canLoadNextPage() ?? false,
			);
		};

		setInvokeListener("group.store.canSearch", () => {
			const scope = window.angular
				.element("group-store .group-store")
				?.scope<GroupStoreAngularScope>();

			if (!scope) {
				return false;
			}

			if (
				(scope.storePager.getPagingParameter("keyword") ||
					scope.storePager.getCurrentPageNumber() > 1 ||
					scope.$ctrl.storeItems.length) &&
				!scope.storePager.isBusy()
			) {
				return true;
			}

			return onSet(scope.$ctrl, "storeItems", true).then((items) => {
				return !!(
					scope.storePager.getPagingParameter("keyword") ||
					scope.storePager.getCurrentPageNumber() > 1 ||
					items.length
				);
			});
		});

		setInvokeListener("group.store.setSearchQuery", (query) => {
			const scope = window.angular
				.element("group-store .group-store")
				?.scope<GroupStoreAngularScope>();

			if (scope) {
				scope.storePager.setPagingParameter("keyword", query);
				scope.storePager.loadFirstPage();

				return onSet(scope.$ctrl, "storeItems", true).then(() => {});
			}
		});

		featureValueIsInject("groupOrganization", true, () => {
			hijackResponse((req, res) => {
				if (!res?.ok) {
					return;
				}

				const url = new URL(req.url);

				if (url.hostname === getRobloxUrl("groups")) {
					if (
						url.pathname.match(/^\/v1\/groups\/\d+\/users$/) ||
						(url.pathname.match(/^\/v1\/groups\/\d+\/users\/\d+$/) &&
							req.method === "DELETE")
					) {
						sendMessage("group.list.update", undefined);
						return;
					}
				}
			});
		});
	},
} satisfies Page<"angular">;
