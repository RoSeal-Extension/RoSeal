import { type Signal, signal } from "@preact/signals";
import { type VNode, createElement } from "preact";
import ItemContextMenu from "../components/core/ItemContextMenu";
import { renderAppend, renderBefore, renderIn, renderPrepend } from "../utils/render";
import { watch, watchBeforeLoad, watchOnce } from "./elements";

/*
EXPERIENCE_CONTEXT_MENU = "#game-context-menu";
EXPERIENCE_CONTEXT_MENU_CONTAINER = ".game-calls-to-action";

ITEM_CONTEXT_MENU_REGULAR = "#item-context-menu";
ITEM_CONTEXT_MENU_NEW = "#item-context-menu > .item-context-menu";
ITEM_CONTEXT_MENU_CONTAINER = "#item-details-container > .section-content";
ITEM_CONTEXT_MENU_REACT_CONTAINER = "#item-details-container .item-details-info-header .right";
ITEM_CONTEXT_MENU_REACT = "#game-instance-dropdown-menu .dropdown-menu";

USER_CONTEXT_MENU_ANGULAR = "#profile-header-more";
USER_CONTEXT_MENU_REACT = ".profile-header-more";
USER_CONTEXT_MENU_CONTAINER = ".profile-header:not(.hidden) .profile-header-content";

USER_CONTEXT_MENU_MUI = "[aria-label='More']"
USER_CONTEXT_MENU_MUI_CONTAINER = ".profile-header-buttons"

LOOK_CONTEXT_MENU_CONTAINER = ".look-name-container"
LOOK_CONTEXT_MENU = "#game-instance-dropdown-menu .dropdown-menu"
*/

let containerContextMenus: [Signal<VNode[]>, boolean?] | undefined;
let currentWatcher: (() => void) | undefined;

export async function modifyItemContextMenu<T extends VNode | (() => VNode)>(
	_elements: T | T[],
	override?: boolean,
) {
	const elements = (Array.isArray(_elements) ? _elements : ([_elements] as T[])).map(
		(Element) => {
			// @ts-expect-error: Fine, quiet
			// biome-ignore lint/correctness/useJsxKeyInIterable: fine
			return typeof Element === "function" ? <Element /> : Element;
		},
	) as VNode[];

	if (containerContextMenus) {
		containerContextMenus[0].value = [...containerContextMenus[0].value, ...elements];
		if (override) {
			containerContextMenus[1] = override;
		}
		return clearContextMenus;
	}

	containerContextMenus = [signal(elements), override];

	const isAvatarItemPage = !!(await watchBeforeLoad("item-details"));
	const hasReactContextMenu = !(await watchBeforeLoad("#item-context-menu"));

	// Experience context menu, item container context menu, user context menu
	const containerSelector = `.game-calls-to-action, ${
		isAvatarItemPage && hasReactContextMenu
			? "#item-details-container .item-details-info-header .right"
			: "#item-details-container > .section-content, #item-container > .section-content"
	}, .profile-header:not(.hidden) .profile-header-content, .group-header .group-menu, .group-profile-header-info .actions-container, .look-name-container, .profile-header-buttons, .user-profile-header-info > .flex.gap-small > div:has(#user-profile-header-contextual-menu-button)`;
	const container = await watchOnce(containerSelector);

	// Inner context menu, for avatar items we get the inner .item-context-menu
	// profile-header-more is a className in the react profile header
	const hasContextMenu = !!container?.querySelector(
		`#game-context-menu, ${
			isAvatarItemPage
				? hasReactContextMenu
					? ".right .item-context-menu"
					: "#item-context-menu > .item-context-menu"
				: "#item-context-menu"
		}, .profile-header-more, .group-header .group-menu .btn-generic-more-sm, .look-context-menu, .profile-header-buttons .profile-header-more-icon, [data-testid="MoreHorizIcon"], #user-profile-header-contextual-menu-button`,
	);

	const isExperience = container.classList.contains("game-calls-to-action");
	const isUserProfile = container.classList.contains("profile-header-content");
	const isGroup = container.classList.contains("group-menu");
	const isLook = container.classList.contains("look-name-container");

	if (hasContextMenu) {
		// Remember to keep .popover, otherwise it will catch the .popover-content
		currentWatcher = watch(
			`#game-context-menu .popover .dropdown-menu,${
				hasReactContextMenu && isAvatarItemPage
					? " #game-instance-dropdown-menu .dropdown-menu,"
					: " #item-context-menu .popover .dropdown-menu,"
			} .profile-header-more .dropdown-menu, .group-header .group-menu .popover .dropdown-menu${isLook ? ", #game-instance-dropdown-menu .dropdown-menu" : ""}, .MuiPopover-root ul, .foundation-web-portal-zindex[style*="--radix-popper"] .foundation-web-menu > .padding-small`,
			(dropdownMenu) => {
				dropdownMenu.classList.add("flex-dropdown-menu");
				if (containerContextMenus?.[1]) {
					for (const child of dropdownMenu.children) {
						child.setAttribute("data-display-none", "");
					}
				}

				renderIn(
					// @ts-expect-error: fine
					createElement(() => containerContextMenus[0].value, {}),
					dropdownMenu,
				);
			},
		);
	} else {
		if (isGroup || isLook || isUserProfile) {
			// not handled
			return;
		}

		currentWatcher = watch(containerSelector, (container) => {
			const fn = () => {
				return (
					<ItemContextMenu
						id={
							hasReactContextMenu && isAvatarItemPage
								? undefined
								: isExperience
									? "game-context-menu"
									: "item-context-menu"
						}
						containerClassName={
							hasReactContextMenu && isAvatarItemPage
								? "item-context-menu my-ctx-menu"
								: undefined
						}
						dropdownClassName="flex-dropdown-menu"
						wrapChildren={false}
						includeContextMenuClassName={!hasContextMenu && !isAvatarItemPage}
					>
						{containerContextMenus?.[0].value}
					</ItemContextMenu>
				);
			};

			const refreshBtnContainer =
				container.querySelector("#refresh-details-button")?.parentElement;
			if (refreshBtnContainer) {
				renderBefore(fn, refreshBtnContainer);
				return;
			}
			(isExperience ? renderPrepend : renderAppend)(fn, container);
		});
	}

	return clearContextMenus;
}

export function clearContextMenus() {
	if (currentWatcher) {
		currentWatcher();
		currentWatcher = undefined;
	}

	containerContextMenus = undefined;
}
