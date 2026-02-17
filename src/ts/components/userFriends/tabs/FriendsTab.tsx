import classNames from "classnames";
import { useCallback, useEffect, useMemo, useState } from "preact/hooks";
import {
	CONNECTIONS_TYPES_STORAGE_KEY,
	type ConnectionsTypesStorageValue,
	type ConnectionType,
	DEFAULT_ALL_CONNECTION_TYPE,
	DEFAULT_CONNECTION_TYPES,
	DEFAULT_NONE_CONNECTION_TYPE,
	FRIENDS_STATUS_FILTERS,
} from "src/ts/constants/friends";
import { presenceTypes } from "src/ts/constants/presence";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleLowerCase, asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { onNotificationType } from "src/ts/helpers/notifications";
import {
	multigetUniversesByIds,
	multigetUniversesPlayabilityStatuses,
} from "src/ts/helpers/requests/services/universes";
import {
	getUserFriendsStatus,
	listUserFriends,
	listUserFriendsCount,
	searchUserFriends,
	type SkinnyUserFriend,
	type UserPresence,
} from "src/ts/helpers/requests/services/users";
import { useDebounceValue } from "usehooks-ts";
import AvatarCardList from "../../core/avatarCard/List";
import Dropdown from "../../core/Dropdown";
import Icon from "../../core/Icon";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useDidMountEffect from "../../hooks/useDidMountEffect";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import useProfilesData from "../../hooks/useProfilesData";
import usePromise from "../../hooks/usePromise";
import CreateFriendLinkButton from "../CreateFriendLinkButton";
import FriendCard, { type FriendCardPageData } from "../FriendCard";
import type { SourceUniverseData } from "../Page";
import FriendsPageTitle from "../PageTitle";
import { getUserFriendshipsCreationDates, sortOnlineFriends } from "src/ts/utils/friends";
import useStorage from "../../hooks/useStorage";
import { getConnectionTypeDisplayName } from "../utils/types";
import CreateUpdateConnectionTypeModal from "../modals/CreateUpdateTypeModal";
import { crossSort } from "src/ts/utils/objects";

export type FriendsTabProps = {
	isMyProfile: boolean;
	userId: number;
	onlineFriends?: UserPresence[] | null;
	onlineFriendsFetched?: boolean;
};

export default function FriendsTab({
	isMyProfile,
	userId,
	onlineFriends,
	onlineFriendsFetched,
}: FriendsTabProps) {
	const [onlineFriendsMemoized, setOnlineFriendsMemoized] = useState<
		UserPresence[] | null | undefined
	>();
	const [authenticatedUser] = useAuthenticatedUser();
	const [createFriendLinksEnabled] = useFeatureValue("handleFriendLinks", true);
	const [getAccurateFriendDateEnabled] = useFeatureValue(
		"improvedUserFriendsPage.getAccurateFriendDate",
		false,
	);
	const [typesEnabled] = useFeatureValue("improvedUserFriendsPage.connectionsTypes", false);
	const [typesStorageValue, setTypesStorageValue, , typesStorageFetched] =
		useStorage<ConnectionsTypesStorageValue>(CONNECTIONS_TYPES_STORAGE_KEY, {
			customTypes: [],
			users: {},
			layout: [],
		});
	const [pageSize] = useFeatureValue("improvedUserFriendsPage.pageSize", 18);

	const [taggedUserIds] = usePromise(
		() => {
			if (!typesEnabled || !authenticatedUser || !isMyProfile) return;

			const userIds: number[] = [];

			for (const userId in typesStorageValue.users) {
				userIds.push(Number.parseInt(userId, 10));
			}

			return getUserFriendsStatus({
				targetUserId: authenticatedUser.userId,
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
		},
		[authenticatedUser, typesStorageValue.users, typesEnabled],
		false,
	);
	const [friendsCount, , , refreshFriendsCount] = usePromise(
		() =>
			listUserFriendsCount({
				userId,
			}).then((data) => data.count),
		[userId],
		false,
	);
	const [statusFilter, setStatusFilter] = useState<(typeof FRIENDS_STATUS_FILTERS)[number]>(
		FRIENDS_STATUS_FILTERS[0],
	);
	const [typeFilter, setTypeFilter] = useState<string | number>(DEFAULT_ALL_CONNECTION_TYPE.id);

	const [onlineFriendsProfileData, onlineFriendsProfileDataFetched] = useProfilesData(
		onlineFriendsMemoized || undefined,
	);
	const [taggedFriendsProfileData] = useProfilesData(
		useMemo(
			() =>
				taggedUserIds?.map((userId) => ({
					userId,
				})),
			[taggedUserIds],
		),
	);

	const [allTypes, showTypesFilter, displayTypeFilters] = useMemo(() => {
		if (!typesEnabled || !isMyProfile || !taggedUserIds)
			return [undefined, false, undefined] as const;

		const allTypes = [
			...DEFAULT_CONNECTION_TYPES,
			...typesStorageValue.customTypes,
			DEFAULT_NONE_CONNECTION_TYPE,
		];

		if (typesStorageValue.layout?.length) {
			crossSort(allTypes, (a, b) => {
				const aIndex = typesStorageValue.layout!.indexOf(a.id);
				const bIndex = typesStorageValue.layout!.indexOf(b.id);

				if (a.id === DEFAULT_NONE_CONNECTION_TYPE.id) {
					return 1;
				}

				if (b.id === DEFAULT_NONE_CONNECTION_TYPE.id) {
					return -1;
				}

				if (aIndex === -1) {
					return 1;
				}

				if (bIndex === -1) {
					return -1;
				}

				return aIndex > bIndex ? 1 : aIndex < bIndex ? -1 : 0;
			});
		}

		const filterTypes = [DEFAULT_ALL_CONNECTION_TYPE];
		for (const type of DEFAULT_CONNECTION_TYPES) {
			let shouldAdd = false;
			if (DEFAULT_NONE_CONNECTION_TYPE.id === type.id) {
				shouldAdd = true;
			} else {
				for (const key in typesStorageValue.users) {
					if (typesStorageValue.users[key] === type.id) {
						shouldAdd = true;
						break;
					}
				}
			}

			if (shouldAdd) {
				filterTypes.push(type);
			}
		}
		filterTypes.push(...typesStorageValue.customTypes);

		return [
			allTypes,
			taggedUserIds.length !== 0,
			filterTypes.map((item) => ({
				id: item.id,
				value: item.id,
				label: getConnectionTypeDisplayName(item),
			})),
		];
	}, [typesEnabled, taggedUserIds, typesStorageValue.customTypes, typesStorageValue.layout]);

	const updateConnectionTypesLayout = useCallback(
		(types: ConnectionType[]) =>
			setTypesStorageValue({
				...typesStorageValue,
				layout: types.map((type) => type.id),
			}),
		[typesStorageValue],
	);

	const [createTypeUserId, setCreateTypeUserId] = useState<number>();
	const [editTypeId, setOpenEditTypeId] = useState<string | number>();
	const editType = useMemo(() => {
		if (!allTypes || !editTypeId) return;

		for (const type of allTypes) {
			if (type.id === editTypeId && type.type === "custom") return type;
		}
	}, [editTypeId, allTypes]);

	const displayStatusFilters = useMemo(() => {
		return FRIENDS_STATUS_FILTERS.map((name) => ({
			value: name,
			label: getMessage(`friends.friends.statusFilter.${name}`),
		}));
	}, []);

	const statusPrefixItems = useMemo(() => {
		if (!isMyProfile) return;

		if (
			(!onlineFriendsFetched || !onlineFriendsProfileDataFetched) &&
			onlineFriendsMemoized?.length !== 0 &&
			!(onlineFriendsFetched === true && !onlineFriendsMemoized)
		) {
			return null;
		}

		if (!onlineFriendsMemoized) return;

		return sortOnlineFriends(
			onlineFriendsMemoized,
			onlineFriendsProfileData,
			typesEnabled ? typesStorageValue : undefined,
			typesEnabled ? allTypes : undefined,
		).map((friend) => ({
			id: friend.userId,
		}));
	}, [
		onlineFriendsMemoized,
		onlineFriendsFetched,
		onlineFriendsProfileData,
		onlineFriendsProfileDataFetched,
		typesStorageFetched,
	]);

	const typePrefixItems = useMemo(() => {
		if (typeFilter === DEFAULT_ALL_CONNECTION_TYPE.id) return;
		if (!taggedUserIds || statusPrefixItems === null || !allTypes) return null;

		if (statusPrefixItems) {
			const missingUserIds: number[] = [];
			for (const key in typesStorageValue.users) {
				const value = typesStorageValue.users[key];
				if (value !== typeFilter) continue;

				const userId = Number.parseInt(key, 10);
				if (taggedUserIds.includes(userId)) missingUserIds.push(userId);
			}

			const data = statusPrefixItems.filter((item) => {
				const key = missingUserIds.indexOf(item.id);
				if (key === -1) return false;

				missingUserIds.splice(key, 1);
				return true;
			});

			for (const id of missingUserIds) {
				data.push({
					id,
				});
			}

			return data;
		}

		return taggedUserIds.map((id) => ({
			id,
		}));
	}, [taggedUserIds, statusPrefixItems, typeFilter]);

	const replacementItems =
		typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id &&
		typeFilter !== DEFAULT_NONE_CONNECTION_TYPE.id
			? typePrefixItems
			: statusFilter !== "All" && statusFilter !== "Offline"
				? statusPrefixItems
				: undefined;
	const [search, setSearch] = useDebounceValue("", replacementItems ? 0 : 250);

	const {
		items,
		loading,
		pageNumber,
		maxPageNumber,
		hasAnyItems,
		pageData,
		queueReset,
		setPageNumber,
		reset,
		removeItem,
	} = usePages<
		SkinnyUserFriend & {
			pageData?: FriendCardPageData;
		},
		string
	>({
		paging: {
			method: "pagination",
			itemsPerPage: pageSize || 18,
		},
		getNextPage: (pageData) => {
			const cursor = pageData.nextCursor;

			return (
				search
					? searchUserFriends({
							userId,
							limit: 50,
							cursor,
							userSort: isMyProfile ? "FriendScore" : "Created",
							query: search,
						})
					: listUserFriends({
							userId,
							limit: 50,
							cursor,
							userSort: isMyProfile ? "FriendScore" : "Created",
						})
			).then((data) => {
				const transformedItems: (SkinnyUserFriend & {
					pageData?: FriendCardPageData;
				})[] = [];

				for (let i = 0; i < data.pageItems.length; i++) {
					const item = data.pageItems[i];
					if (item.id < 0) continue;

					transformedItems.push({
						id: item.id,
						pageData: search || isMyProfile ? undefined : { index: i, cursor },
					});
				}

				return {
					...pageData,
					items: transformedItems,
					nextCursor: data.nextCursor || undefined,
					hasNextPage: !!data.nextCursor,
				};
			});
		},
		items: {
			replacementItems,
			prefixItems:
				search ||
				(statusFilter !== "All" && statusFilter !== "Offline") ||
				(typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id &&
					typeFilter !== DEFAULT_NONE_CONNECTION_TYPE.id)
					? undefined
					: statusPrefixItems,
			filterItem: (item, index, arr) => {
				if (typeFilter === DEFAULT_NONE_CONNECTION_TYPE.id) {
					if (typesStorageValue.users[item.id]) return false;
				} else if (typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id) {
					if (search) {
						const profileData = taggedFriendsProfileData.find(
							(data) => data?.userId === item.id,
						);
						if (!profileData) {
							return false;
						}

						const lowerCaseSearch = asLocaleLowerCase(search);
						const lowerCaseCombinedName = asLocaleLowerCase(
							profileData.names.combinedName,
						);
						const lowerCaseUsername = asLocaleLowerCase(profileData.names.username);
						if (
							lowerCaseCombinedName.includes(lowerCaseSearch) ||
							lowerCaseUsername.includes(lowerCaseSearch)
						) {
							return true;
						}

						return false;
					}
				}

				if (statusFilter === "Offline") {
					return (
						onlineFriendsMemoized?.some((friend) => friend.userId === item.id) !== true
					);
				}

				if (statusFilter !== "All") {
					const onlineFriend = onlineFriendsMemoized?.find(
						(friend) => friend.userId === item.id,
					);
					if (!onlineFriend) {
						return false;
					}

					const presenceType = presenceTypes.find((presenceType) => {
						return presenceType.typeId === onlineFriend.userPresenceType;
					});

					if (presenceType?.type !== statusFilter) {
						return false;
					}

					if (search) {
						const profileData = onlineFriendsProfileData.find(
							(data) => data?.userId === item.id,
						);
						if (!profileData) {
							return false;
						}

						const lowerCaseSearch = asLocaleLowerCase(search);
						const lowerCaseCombinedName = asLocaleLowerCase(
							profileData.names.combinedName,
						);
						const lowerCaseUsername = asLocaleLowerCase(profileData.names.username);
						if (
							lowerCaseCombinedName.includes(lowerCaseSearch) ||
							lowerCaseUsername.includes(lowerCaseSearch)
						) {
							return true;
						}

						return false;
					}
					return true;
				}

				return arr.findIndex((item2) => item2.id === item.id) === index;
			},
		},
		dependencies: {
			reset: [search, statusFilter, typeFilter],
			refreshPage: [
				onlineFriendsMemoized,
				onlineFriendsProfileData,
				typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id && taggedFriendsProfileData,
				statusPrefixItems,
				statusFilter !== "All" && statusFilter !== "Offline"
					? onlineFriendsProfileData
					: undefined,
			],
		},
	});

	const [friendsSince, setFriendsSince] = useState<Record<number, Date>>({});
	useEffect(() => {
		if (authenticatedUser?.userId !== userId || !getAccurateFriendDateEnabled) {
			return;
		}

		getUserFriendshipsCreationDates(userId).then((data) => {
			setFriendsSince((currentData) => {
				const newData = { ...currentData };
				for (const itemId in data) {
					if (!newData[itemId]) {
						newData[itemId] = data[itemId];
					}
				}

				return newData;
			});
		});
	}, [authenticatedUser?.userId, userId, getAccurateFriendDateEnabled]);

	const [universeData, setUniverseData] = useState<Record<number, SourceUniverseData>>({});
	useEffect(() => {
		if (authenticatedUser?.userId !== userId || !onlineFriends) {
			return;
		}

		const universeIds: number[] = [];
		for (const item of onlineFriends) {
			if (item.universeId) {
				universeIds.push(item.universeId);
			}
		}

		Promise.all([
			multigetUniversesByIds({
				universeIds,
			}),
			multigetUniversesPlayabilityStatuses({
				universeIds,
			}),
		]).then(([universeData, universePlayabilityData]) => {
			setUniverseData((prev) => {
				const newData = { ...prev };
				for (const item of universeData) {
					newData[item.id] = {
						data: item,
						isPlayable: false,
					};
				}

				for (const item of universePlayabilityData) {
					newData[item.universeId] = {
						data: newData[item.universeId]?.data,
						isPlayable: item.isPlayable,
					};
				}

				return newData;
			});
		});
	}, [onlineFriends]);

	useEffect(() => {
		if (authenticatedUser?.userId !== userId) {
			return;
		}

		return onNotificationType("FriendshipNotifications", (data) => {
			if (data.Type !== "FriendshipRequested") {
				refreshFriendsCount();
				queueReset();

				if (data.Type === "FriendshipDestroyed") {
					for (const item of pageData.value.items) {
						if (
							item.id === data.EventArgs.UserId1 ||
							item.id === data.EventArgs.UserId2
						) {
							removeItem(item);
						}
					}
				}
			}
		});
	}, [authenticatedUser?.userId, userId]);

	useEffect(() => {
		if (!onlineFriendsMemoized) {
			setOnlineFriendsMemoized(onlineFriends);
		}
	}, [onlineFriends]);

	useDidMountEffect(() => {
		setOnlineFriendsMemoized(onlineFriends);
	}, [search, statusFilter]);

	const disabled = loading || (isMyProfile && !onlineFriendsFetched);

	return (
		<div className="friends-content section">
			{typesEnabled && (
				<CreateUpdateConnectionTypeModal
					show={createTypeUserId !== undefined || editTypeId !== undefined}
					data={editType}
					close={() => {
						setCreateTypeUserId(undefined);
						setOpenEditTypeId(undefined);
					}}
					createItem={(data) => {
						if (!createTypeUserId) return;

						const existingType = typesStorageValue.users[createTypeUserId];
						if (existingType) {
							let shouldDeleteType = true;

							for (const userId in typesStorageValue.users) {
								if (createTypeUserId.toString() !== userId) {
									if (typesStorageValue.users[userId] === existingType) {
										shouldDeleteType = false;
										break;
									}
								}
							}

							if (shouldDeleteType) {
								for (let i = 0; i < typesStorageValue.customTypes.length; i++) {
									if (typesStorageValue.customTypes[i].id === existingType) {
										typesStorageValue.customTypes.splice(i, 1);
										break;
									}
								}
							}
						}

						setTypesStorageValue({
							...typesStorageValue,
							customTypes: [...typesStorageValue.customTypes, data],
							users: {
								...typesStorageValue.users,
								[createTypeUserId]: data.id,
							},
						});
					}}
					updateItem={(partialItem) => {
						if (!editType) return;
						for (let i = 0; i < typesStorageValue.customTypes.length; i++) {
							const item = typesStorageValue.customTypes[i];

							if (editType.id === item.id) {
								typesStorageValue.customTypes[i] = {
									...item,
									...partialItem,
								};
								break;
							}
						}

						setTypesStorageValue({
							...typesStorageValue,
						});
					}}
					deleteItem={() => {
						if (typeFilter === editTypeId) {
							setTypeFilter(DEFAULT_ALL_CONNECTION_TYPE.id);
						}

						for (let i = 0; i < typesStorageValue.customTypes.length; i++) {
							const item2 = typesStorageValue.customTypes[i];

							if (item2.id === editTypeId) {
								typesStorageValue.customTypes.splice(i, 1);
								break;
							}
						}

						for (const key in typesStorageValue.users) {
							const typeId = typesStorageValue.users[key];
							if (typeId === editTypeId) {
								delete typesStorageValue.users[key];
							}
						}

						setTypesStorageValue({
							...typesStorageValue,
						});
					}}
				/>
			)}
			<FriendsPageTitle
				title={getMessage("friends.tabs.friends.withNumber", {
					number: asLocaleString(friendsCount || 0),
				})}
				tooltipContent={getMessage("friends.tabs.friends.tooltip")}
				disabled={disabled}
				onRefresh={() => {
					reset();
					refreshFriendsCount();
					setOnlineFriendsMemoized(onlineFriends);
				}}
			>
				<div
					className={classNames("friends-filter", {
						"roseal-disabled": disabled,
					})}
				>
					{onlineFriendsMemoized && (
						<Dropdown
							className="friends-filter-status"
							selectionItems={displayStatusFilters}
							selectedItemValue={statusFilter}
							onSelect={setStatusFilter}
						/>
					)}
					{showTypesFilter && displayTypeFilters && (
						<Dropdown
							className="friends-filter-type"
							selectionItems={displayTypeFilters}
							onSelect={setTypeFilter}
							selectedItemValue={typeFilter}
						/>
					)}
					<div className="friends-filter-searchbar-container form-control input-field">
						<Icon name="search" />
						<input
							className="friends-filter-searchbar-input"
							type="text"
							placeholder={getMessage("friends.friends.searchPlaceholder")}
							onChange={(e) => {
								setSearch(e.currentTarget.value);
							}}
						/>
					</div>
				</div>
				{createFriendLinksEnabled && isMyProfile && <CreateFriendLinkButton />}
			</FriendsPageTitle>
			{!hasAnyItems && (loading || (isMyProfile && !onlineFriendsFetched)) && (
				<div className="section-content-off">
					<Loading />
				</div>
			)}
			{!hasAnyItems &&
				!loading &&
				search === "" &&
				typeFilter === DEFAULT_ALL_CONNECTION_TYPE.id && (
					<div className="section-content-off">
						{getMessage(`friends.friends.noItems.${isMyProfile ? "you" : "someone"}`)}
					</div>
				)}
			{!loading &&
				items.length === 0 &&
				(typeFilter !== DEFAULT_ALL_CONNECTION_TYPE.id ||
					statusFilter !== "All" ||
					search !== "") && (
					<div className="section-content-off">
						{getMessage("friends.friends.noFilteredItems")}
					</div>
				)}
			{hasAnyItems && (onlineFriendsFetched || !isMyProfile) && (
				<AvatarCardList
					className={classNames({
						"roseal-disabled": disabled,
					})}
				>
					{items?.map((friend) => {
						const connectionTypeId = typesStorageValue.users[friend.id];

						return (
							<FriendCard
								pageUserId={userId}
								key={friend.id}
								id={friend.id}
								isFriends
								isMyProfile={isMyProfile}
								currentTab="friends"
								pageData={friend.pageData}
								universeData={universeData}
								removeCard={() => {
									for (const item of pageData.value.items) {
										if (item.id === friend.id) {
											removeItem(item);
										}
									}

									refreshFriendsCount();
								}}
								onlineFriends={onlineFriends}
								friendSince={
									getAccurateFriendDateEnabled
										? friendsSince?.[friend.id]
										: undefined
								}
								setFriendSince={(data) => {
									setFriendsSince((currentData) => {
										const newData = { ...currentData };
										newData[friend.id] = data;

										return newData;
									});
								}}
								availableConnectionTypes={allTypes}
								connectionTypeId={connectionTypeId}
								updateConnectionTypesLayout={updateConnectionTypesLayout}
								setConnectionType={(id) => {
									const newUsers = {
										...typesStorageValue.users,
										[friend.id]:
											id !== DEFAULT_NONE_CONNECTION_TYPE.id ? id : undefined,
									};

									for (let i = 0; i < typesStorageValue.customTypes.length; i++) {
										const type = typesStorageValue.customTypes[i];
										let shouldDelete = true;

										for (const key in newUsers) {
											if (newUsers[key] === type.id) {
												shouldDelete = false;
												break;
											}
										}

										if (shouldDelete) {
											typesStorageValue.customTypes.splice(i, 1);
											i--;

											if (typeFilter === type.id) {
												setTypeFilter(DEFAULT_ALL_CONNECTION_TYPE.id);
											}
										}
									}

									setTypesStorageValue({
										...typesStorageValue,
										users: newUsers,
									});
								}}
								openCreateType={(userId) => setCreateTypeUserId(userId)}
								openEditType={(id) => setOpenEditTypeId(id)}
							/>
						);
					})}
				</AvatarCardList>
			)}
			{(maxPageNumber > 1 || pageNumber > 1) && (
				<Pagination
					current={pageNumber}
					hasNext={maxPageNumber > pageNumber}
					onChange={(current) => {
						setPageNumber(current);
					}}
					disabled={disabled}
				/>
			)}
		</div>
	);
}
