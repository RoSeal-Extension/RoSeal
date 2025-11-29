import type { Signal } from "@preact/signals";
import Fuse from "fuse.js";
import { useEffect, useMemo } from "preact/hooks";
import { FAST_SEARCH_USER_LIMIT } from "src/ts/constants/misc";
import { watch, watchAttributes } from "src/ts/helpers/elements";
import { profileProcessor } from "src/ts/helpers/processors/profileProcessor";
import { multigetUsersByNames, searchUserFriends } from "src/ts/helpers/requests/services/users";
import { robloxNavigateTo } from "src/ts/utils/context";
import { USERNAME_REGEX } from "src/ts/utils/regex";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useOnlineFriends from "../hooks/useOnlineFriends";
import useProfilesData from "../hooks/useProfilesData";
import usePromise from "../hooks/usePromise";
import FastUserSearchItem from "./FastUserSearchItem";

export type FastUserSearchProps = {
	search: Signal<string>;
	menu: HTMLUListElement;
	container: HTMLDivElement;
};

export type FastUserSearchDetail = {
	id?: number;
	hasVerifiedBadge: boolean;
	combinedName: string;
	username: string;
	isFriends?: boolean;
	isLoading?: boolean;
	isYou?: boolean;
};

export default function FastUserSearch({ search, menu, container }: FastUserSearchProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [onlineFriends] = useOnlineFriends();
	const [onlineFriendsProfileData] = useProfilesData(onlineFriends || undefined);

	const onlineFriendsSearch = useMemo(() => {
		if (!onlineFriendsProfileData) return;

		const items: FastUserSearchDetail[] = [];
		const match = new Fuse(
			onlineFriendsProfileData.filter((item) => !item?.isDeleted),
			{
				keys: [
					{
						name: "names.username",
						weight: 2,
					},
					"names.combinedName",
				],
				shouldSort: true,
				threshold: 0.3,
			},
		);

		const onlineFriendsSearched = match.search(search.value, {
			limit: FAST_SEARCH_USER_LIMIT,
		});

		for (const item of onlineFriendsSearched) {
			if (!item.item) continue;

			items.push({
				id: item.item.userId,
				hasVerifiedBadge: item.item.isVerified,
				combinedName: item.item.names.combinedName,
				username: item.item.names.username,
				isFriends: true,
			});
		}

		return items;
	}, [search.value]);
	const [exactUserSearch] = usePromise(() => {
		if (onlineFriends)
			for (const item of onlineFriendsProfileData) {
				if (item?.names.username.toLowerCase() === search.value.toLowerCase()) {
					if (item.isDeleted) return null;

					return {
						id: item.userId,
						hasVerifiedBadge: item.isVerified,
						combinedName: item.names.combinedName,
						username: item.names.username,
						isFriends: true,
					};
				}
			}

		return multigetUsersByNames({
			usernames: [search.value],
			excludeBannedUsers: true,
		}).then((data) => {
			const user = data[0];
			if (!user) return null;

			return {
				id: user.id,
				hasVerifiedBadge: user.hasVerifiedBadge,
				combinedName: user.displayName,
				username: user.name,
			};
		});
	}, [search.value]);

	const [allFriendsSearch] = usePromise(async () => {
		if (!search.value || !authenticatedUser) return;

		const data = await searchUserFriends({
			userId: authenticatedUser.userId,
			query: search.value,
			userSort: "FriendScore",
			limit: FAST_SEARCH_USER_LIMIT,
		});

		const profileData = await profileProcessor.requestBatch(
			data.pageItems.map((item) => ({
				userId: item.id,
			})),
		);

		const items: FastUserSearchDetail[] = [];
		for (const item of profileData) {
			if (item.isDeleted) continue;

			items.push({
				id: item.userId,
				hasVerifiedBadge: item.isVerified,
				combinedName: item.names.combinedName,
				username: item.names.username,
				isFriends: true,
			});
		}

		return items;
	}, [search.value, authenticatedUser?.userId]);

	const results = useMemo(() => {
		const items: FastUserSearchDetail[] = [];
		const addedUserIds = new Set<number>();

		if (USERNAME_REGEX.test(search.value) ? exactUserSearch !== null : exactUserSearch) {
			if (exactUserSearch) {
				addedUserIds.add(exactUserSearch.id);
			}

			items.push(
				exactUserSearch || {
					username: search.value,
					hasVerifiedBadge: false,
					combinedName: search.value,
					isLoading: true,
					isFriends: false,
				},
			);
		}

		if (onlineFriendsSearch) {
			for (const item of onlineFriendsSearch) {
				if (item.id && !addedUserIds.has(item.id)) {
					addedUserIds.add(item.id);
					items.push(item);
				}
			}
		}

		if (allFriendsSearch) {
			for (const item of allFriendsSearch) {
				if (item.id && !addedUserIds.has(item.id)) {
					addedUserIds.add(item.id);
					items.push(item);
				}
			}
		}

		return items.slice(0, FAST_SEARCH_USER_LIMIT);
	}, [allFriendsSearch, exactUserSearch, onlineFriendsSearch]);

	useEffect(() => {
		let selectedIndex = 0;

		const onClassUpdate = (el: HTMLElement) => {
			if (!el.classList.contains("navbar-search-option")) {
				return;
			}

			const parent = el.parentElement;
			if (!parent) return;

			let index = -1;
			for (let i = 0; i < parent.childNodes.length; i++) {
				if (parent.childNodes[i] === el) {
					index = i;
					break;
				}
			}

			if (index === -1) return;

			if (el.classList.contains("new-selected")) {
				if (index !== selectedIndex) {
					el.classList.remove("new-selected");
				}
			} else if (index === selectedIndex) {
				el.classList.add("new-selected");
			}
		};

		const updateAll = () => {
			selectedIndex = Math.min(menu.children.length, selectedIndex);
			for (const item of menu.children) {
				if (item.nodeType === Node.ELEMENT_NODE) {
					onClassUpdate(item as HTMLElement);
				}
			}
		};

		watch<HTMLElement>("#right-navigation-header .navbar-search-option", (el) => {
			updateAll();

			watch(el, updateAll, true);
		});

		const onKeyDown = (e: KeyboardEvent) => {
			const moveDown = e.key === "ArrowDown" || e.key === "Tab";
			if (!moveDown && e.key !== "ArrowUp") return;

			if (moveDown) {
				selectedIndex++;

				if (selectedIndex >= menu.children.length) {
					selectedIndex = 0;
				}
			} else {
				selectedIndex--;

				if (selectedIndex < 0) {
					selectedIndex = menu.children.length - 1;
				}
			}

			updateAll();
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (e.key !== "Enter") return;

			const selected = menu.querySelector(".new-selected");
			if (!selected) return;

			const selectedLink = selected.querySelector("a")?.href;

			if (selectedLink) {
				robloxNavigateTo(selectedLink);
			}

			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
		};

		const elWatcher = watchAttributes(
			menu,
			(_, el) => onClassUpdate(el),
			["class"],
			false,
			true,
		);

		container.addEventListener("keydown", onKeyDown);
		container.addEventListener("keyup", onKeyUp, {
			capture: true,
		});

		return () => {
			elWatcher();
			container.removeEventListener("keyup", onKeyUp, {
				capture: true,
			});
			container.removeEventListener("keydown", onKeyDown);
		};
	}, []);

	return results.map((item) => (
		<FastUserSearchItem
			key={item.id}
			{...item}
			isYou={!!authenticatedUser && item.id === authenticatedUser.userId}
		/>
	));
}
