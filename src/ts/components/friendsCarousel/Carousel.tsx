import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import usePromise from "../hooks/usePromise";
import useFeatureValue from "../hooks/useFeatureValue";
import {
	CONNECTIONS_TYPES_STORAGE_KEY,
	type ConnectionsTypesStorageValue,
	DEFAULT_ALL_CONNECTION_TYPE,
	DEFAULT_CONNECTION_TYPES,
	DEFAULT_NONE_CONNECTION_TYPE,
	FRIEND_TILE_WIDTH,
} from "src/ts/constants/friends";
import useOnlineFriends from "../hooks/useOnlineFriends";
import {
	getUserFriendsStatus,
	listMyNewFriendRequestsCount,
	listUserFriends,
	listUserFriendsCount,
	type SkinnyUserFriend,
} from "src/ts/helpers/requests/services/users";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getChatMetadata } from "src/ts/helpers/requests/services/chat";
import { useWindowSize } from "usehooks-ts";
import { getUserFriendsLink } from "src/ts/utils/links";
import FriendsListShimmerCard from "./ShimmerCard";
import FriendsListCard from "./Card";
import useProfilesData from "../hooks/useProfilesData";
import { sortOnlineFriends } from "src/ts/utils/friends";
import useStorage from "../hooks/useStorage";
import { calculateFriendsCarouselNewOffsetWidth } from "src/ts/utils/friendsCarousel";
import { blockedItemsData } from "src/ts/constants/misc";
import { multigetDevelopUniversesByIds } from "src/ts/helpers/requests/services/universes";
import { isExperienceBlocked } from "src/ts/utils/blockedItems";
import Dropdown from "../core/Dropdown";
import { getConnectionTypeDisplayName } from "../userFriends/utils/types";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import classNames from "classnames";
import { crossSort } from "src/ts/utils/objects";
import ConnectCard from "./ConnectCard";
import type { Signal } from "@preact/signals";

// only supported for current user for now

export type FriendsListCarouselProps = {
	userId: number;
	friendsCount?: Promise<number>;
	overrideRows?: number;
	btr: Signal<boolean>;
	btrSecondRow: Signal<boolean>;
};
export default function FriendsListCarousel({
	userId,
	overrideRows,
	btr,
	btrSecondRow,
	friendsCount: _friendsCount,
}: FriendsListCarouselProps) {
	const [rows] = useFeatureValue("homeFriendsRows", [false, 1]);
	const [connectionTypesEnabled] = useFeatureValue(
		"improvedUserFriendsPage.connectionsTypes",
		false,
	);
	const [addConnectionsCardDisabled] = useFeatureValue("hideAddFriendsButton", false);

	const [visibleFriendsList, setVisibleFriendsList] = useState<SkinnyUserFriend[]>();
	const [listIsFull, setListIsFull] = useState(false);
	const [visibleTileCount, setVisibleTileCount] = useState(0);

	const [typeFilter, setTypeFilter] = useState<string | number>(DEFAULT_ALL_CONNECTION_TYPE.id);

	const parentRef = useRef<HTMLDivElement | null>(null);
	const containerRef = useRef<HTMLDivElement | null>(null);

	const [connectionTypesStorageValue] = useStorage<ConnectionsTypesStorageValue>(
		CONNECTIONS_TYPES_STORAGE_KEY,
		{
			customTypes: [],
			users: {},
			layout: [],
		},
	);
	const [taggedUserIds, taggedUserIdsFetched] = usePromise(() => {
		if (!connectionTypesEnabled) return;

		const userIds: number[] = [];

		for (const userId in connectionTypesStorageValue.users) {
			userIds.push(Number.parseInt(userId, 10));
		}

		return getUserFriendsStatus({
			targetUserId: userId,
			userIds,
		}).then((data) => {
			const userIdsThatAreFriends: number[] = [];
			for (const item of data) {
				if (item.status === "Friends") {
					userIdsThatAreFriends.push(item.id);
				}
			}

			return userIdsThatAreFriends;
		});
	}, [userId, connectionTypesStorageValue.users, connectionTypesEnabled]);
	const [newFriendRequestCount] = usePromise(() => {
		if (addConnectionsCardDisabled) return;

		return listMyNewFriendRequestsCount().then((data) => data.count);
	}, [addConnectionsCardDisabled]);

	const [friendsCount] = usePromise(() => {
		if (!_friendsCount) {
			return listUserFriendsCount({
				userId,
			}).then((data) => data.count);
		}

		return _friendsCount;
	}, [_friendsCount, userId]);

	const [_onlineFriends, _onlineFriendsFetched] = useOnlineFriends();
	const [onlineFriends, onlineFriendsFetched] = useMemo(() => {
		return [_onlineFriends, _onlineFriendsFetched];
	}, [_onlineFriendsFetched]);

	const [onlineFriendsProfileData, onlineFriendsProfileDataFetched] =
		useProfilesData(onlineFriends);
	const [otherFriends, otherFriendsFetched] = usePromise(
		() =>
			listUserFriends({
				userId,
				limit: 50,
				userSort: "FriendScore",
			}).then((data) => data.pageItems),
		[userId],
	);
	const [canAccessChat] = usePromise(
		() => getChatMetadata().then((data) => data.isChatEnabled),
		[userId],
	);
	const connectionTypes = useMemo(() => {
		if (!connectionTypesEnabled) return;
		const filterTypes = [DEFAULT_ALL_CONNECTION_TYPE];
		for (const type of [
			...DEFAULT_CONNECTION_TYPES,
			...connectionTypesStorageValue.customTypes,
		]) {
			let shouldAdd = false;
			for (const key in connectionTypesStorageValue.users) {
				if (connectionTypesStorageValue.users[key] === type.id) {
					shouldAdd = true;
					break;
				}
			}

			if (shouldAdd) {
				filterTypes.push(type);
			}
		}

		if (connectionTypesStorageValue.layout)
			crossSort(filterTypes, (a, b) => {
				const aIndex = connectionTypesStorageValue.layout!.indexOf(a.id);
				const bIndex = connectionTypesStorageValue.layout!.indexOf(b.id);

				if (aIndex === -1) {
					return 1;
				}

				if (bIndex === -1) {
					return -1;
				}

				if (a.id === DEFAULT_NONE_CONNECTION_TYPE.id) {
					return 1;
				}

				if (b.id === DEFAULT_NONE_CONNECTION_TYPE.id) {
					return -1;
				}

				return aIndex > bIndex ? 1 : aIndex < bIndex ? -1 : 0;
			});

		return filterTypes;
	}, [
		connectionTypesStorageValue.users,
		connectionTypesStorageValue.customTypes,
		connectionTypesStorageValue.layout,
		connectionTypesEnabled,
	]);

	const friendsList = useMemo(() => {
		if (
			!onlineFriendsFetched ||
			!otherFriendsFetched ||
			!taggedUserIdsFetched ||
			(onlineFriends?.length && !onlineFriendsProfileDataFetched)
		)
			return;

		const users: SkinnyUserFriend[] = [];
		const usersMapCheck = new Map<number, boolean>();

		if (onlineFriends)
			for (const friend of sortOnlineFriends(
				onlineFriends,
				onlineFriendsProfileData,
				connectionTypesEnabled ? connectionTypesStorageValue : undefined,
				connectionTypesEnabled ? connectionTypes : undefined,
			)) {
				const typeId = connectionTypesStorageValue.users[friend.userId];

				if (typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id) {
					if (typeId !== typeFilter) continue;
				}

				users.push({
					id: friend.userId,
				});
				usersMapCheck.set(friend.userId, true);
			}

		if (typeFilter === DEFAULT_ALL_CONNECTION_TYPE.id) {
			if (otherFriends) {
				for (const friend of otherFriends) {
					if (usersMapCheck.get(friend.id)) continue;

					users.push({
						id: friend.id,
					});
					usersMapCheck.set(friend.id, true);
				}
			}
		} else if (taggedUserIds) {
			for (const userId of taggedUserIds) {
				if (usersMapCheck.get(userId)) continue;

				if (typeFilter === connectionTypesStorageValue.users[userId]) {
					users.push({
						id: userId,
					});
					usersMapCheck.set(userId, true);
				}
			}
		}

		return users;
	}, [
		typeFilter,
		onlineFriendsFetched,
		otherFriends,
		otherFriendsFetched,
		taggedUserIdsFetched,
		onlineFriendsProfileDataFetched,
	]);

	const [blockedUniverseIds] = usePromise(() => {
		if (!onlineFriends) return;

		if (
			!blockedItemsData.value?.creators.length &&
			!blockedItemsData.value?.experiences.ids &&
			!blockedItemsData.value?.experiences.names.length &&
			!blockedItemsData.value?.experiences.descriptions.length
		)
			return;

		const universeIds: number[] = [];
		for (const friend of onlineFriends) {
			if (friend.universeId) {
				universeIds.push(friend.universeId);
			}
		}

		return multigetDevelopUniversesByIds({
			ids: universeIds,
		}).then((data) => {
			const blockedUniverseIds: number[] = [];
			for (const item of data) {
				if (
					isExperienceBlocked(
						item.id,
						item.creatorType,
						item.creatorTargetId,
						item.name,
						item.description,
					)
				) {
					blockedUniverseIds.push(item.id);
				}
			}

			return blockedUniverseIds;
		});
	}, [blockedItemsData.value, onlineFriends]);

	const { width: windowWidth } = useWindowSize();

	const totalRows = useMemo(() => {
		return (rows?.[0] ? rows?.[1] : undefined) ?? (btrSecondRow.value ? 2 : 1);
	}, [rows?.[1], rows?.[0], overrideRows, btrSecondRow.value]);

	useEffect(() => {
		if (!parentRef.current) return;

		let totalWidth = parentRef.current.offsetWidth;
		if (totalRows !== 1 && totalWidth !== undefined) {
			totalWidth = calculateFriendsCarouselNewOffsetWidth(parentRef.current, totalRows);
		}

		let visibleTileCount = Math.floor(totalWidth / FRIEND_TILE_WIDTH);
		if (!addConnectionsCardDisabled) {
			visibleTileCount--;
		}

		if (friendsCount !== undefined && friendsCount !== null) {
			setVisibleTileCount(Math.min(visibleTileCount, friendsCount));
		} else {
			setVisibleTileCount(visibleTileCount);
		}

		if (!friendsList) {
			return;
		}

		const friendListLength = friendsList.length;

		setListIsFull(
			FRIEND_TILE_WIDTH *
				(addConnectionsCardDisabled ? friendListLength : friendListLength + 1) >
				totalWidth,
		);
		setVisibleFriendsList(friendsList.slice(0, visibleTileCount));
	}, [
		parentRef.current?.offsetWidth,
		friendsList,
		totalRows,
		windowWidth,
		friendsCount,
		addConnectionsCardDisabled,
	]);

	const typesDropdownItems = useMemo(() => {
		if (connectionTypes?.length === 1) return;

		return connectionTypes?.map((type) => ({
			id: type.id,
			value: type.id,
			label: getConnectionTypeDisplayName(type),
		}));
	}, [connectionTypes]);

	if (friendsCount === 0) return null;

	return (
		<div className="react-friends-carousel-container roseal-friends-carousel-container">
			<div className="container-header people-list-header">
				<h2>
					{getMessage("connectionsCarousel.title", {
						count: asLocaleString(friendsCount ?? "?"),
						countText: (contents: string) => (
							<span className="friends-count">{contents}</span>
						),
					})}
				</h2>
				{typesDropdownItems && (
					<Dropdown
						className="connection-type-filter-dropdown"
						selectionItems={typesDropdownItems}
						selectedItemValue={typeFilter}
						onSelect={setTypeFilter}
					/>
				)}
				<a
					href={getUserFriendsLink(userId)}
					className="btn-secondary-xs btn-more see-all-link-icon"
				>
					{getMessage("connectionsCarousel.seeAll")}
				</a>
			</div>
			<div
				className={classNames({
					"btr-friends-list": btr.value,
					"btr-friends-secondRow": btrSecondRow.value && totalRows === 2,
				})}
			>
				<div className="friends-carousel-container" ref={parentRef}>
					<div
						className={
							listIsFull
								? "friends-carousel-list-container"
								: "friends-carousel-list-container-not-full"
						}
						ref={containerRef}
					>
						{!addConnectionsCardDisabled && (
							<ConnectCard count={newFriendRequestCount} />
						)}
						{!visibleFriendsList &&
							visibleTileCount >= 0 &&
							new Array(visibleTileCount).fill(<FriendsListShimmerCard />)}
						{visibleFriendsList?.map((user) => {
							const _typeId = connectionTypesStorageValue.users[user.id];
							const connectionType = useMemo(() => {
								if (
									!_typeId ||
									!connectionTypes ||
									typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id
								)
									return;
								for (const type of connectionTypes) {
									if (type.id === _typeId) return type;
								}
							}, [connectionTypes, _typeId, connectionTypesEnabled, typeFilter]);

							return (
								<FriendsListCard
									userId={user.id}
									canChat={canAccessChat === true}
									blockedUniverseIds={blockedUniverseIds || undefined}
									connectionType={connectionType}
								/>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
