import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { FRIEND_REQUESTS_FILTER_SORTS } from "src/ts/constants/friends";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { SortOrder } from "src/ts/helpers/requests/services/badges";
import { listUserGroupsRoles } from "src/ts/helpers/requests/services/groups";
import { getProfileComponentsData } from "src/ts/helpers/requests/services/misc";
import {
	multigetUniversesByIds,
	multigetUniversesPlayabilityStatuses,
} from "src/ts/helpers/requests/services/universes";
import {
	listMyFriendRequests,
	listMyFriendRequestsCount,
	listUserFriendRecommendations,
	type UserFriendRequest,
} from "src/ts/helpers/requests/services/users";
import { crossSort } from "src/ts/utils/objects";
import AvatarCardList from "../../core/avatarCard/List";
import Button from "../../core/Button";
import Dropdown from "../../core/Dropdown";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import usePromise from "../../hooks/usePromise";
import FriendCard from "../FriendCard";
import FriendRequestFilters from "../modals/FriendRequestFilters";
import IgnoreAllFriendRequestsModal from "../modals/IgnoreFriendRequestModal";
import type { SourceUniverseData } from "../Page";
import FriendsPageTitle from "../PageTitle";

export type FriendRequestsTabProps = {
	userId: number;
	refreshNewFriendRequestsCount: () => void;
};

export type UserFriendRequestAdditionalComponents = {
	robloxBadgeIds: number[];
	mutualCommunitiesCount: number;
	connectionsCount: number;
	followersCount: number;
	followingsCount: number;
	isPremium: boolean;
	isVerified: boolean;
	joinedDate?: number;
};

export type UserFriendRequestWithComponents = UserFriendRequest & {
	components?: UserFriendRequestAdditionalComponents;
};

export type FriendRequestsFilters = {
	robloxBadgeIds?: number[];
	minMutualCommunitiesCount?: number;
	maxMutualCommunitiesCount?: number;
	minConnectionsCount?: number;
	maxConnectionsCount?: number;
	minFollowersCount?: number;
	maxFollowersCount?: number;
	minFollowingsCount?: number;
	maxFollowingsCount?: number;
	isPremium?: boolean;
	isVerified?: boolean;
	minJoinedDate?: number;
	maxJoinedDate?: number;
	minMutualConnectionsCount?: number;
	maxMutualConnectionsCount?: number;
	sortBy: (typeof FRIEND_REQUESTS_FILTER_SORTS)[number];
};

function checkValue<T>(value: T, min?: NoInfer<T>, max?: NoInfer<T>) {
	if (typeof value === "number") {
		return (
			(min === undefined || value >= (min as number)) &&
			(max === undefined || value <= (max as number))
		);
	}

	if (typeof value === "boolean") {
		return min === undefined || min === value;
	}

	if (Array.isArray(value)) {
		return (
			!(min as unknown[] | undefined)?.length ||
			(min as unknown[]).every((item) => value.includes(item))
		);
	}

	return false;
}

export default function FriendRequestsTab({
	userId,
	refreshNewFriendRequestsCount,
}: FriendRequestsTabProps) {
	const [pageSize] = useFeatureValue("improvedUserFriendsPage.pageSize", 18);
	const [advancedFilteringEnabled] = useFeatureValue(
		"improvedUserFriendsPage.advancedFiltering",
		false,
	);
	const [peopleYouMayKnowEnabled] = useFeatureValue(
		"improvedUserFriendsPage.peopleYouMayKnow",
		false,
	);

	const [friendRequestsCountData, , , refreshFriendRequestsCount] = usePromise(
		() => listMyFriendRequestsCount(),
		[],
		false,
	);

	const [sortOrder, setSortOrder] = useState<SortOrder>("Desc");
	const [filters, setFilters] = useState<FriendRequestsFilters>({
		sortBy: "sentDate",
	});
	const [myGroups] = usePromise(
		() =>
			listUserGroupsRoles({
				userId,
			}).then((data) => data.data.map((group) => group.group.id)),
		[userId],
	);
	const [hasSetFilters, shouldRequestProfilePlatform] = useMemo(() => {
		let hasSetFilters = false;

		for (const key in filters) {
			hasSetFilters = true;
			if (
				key !== "minMutualConnectionsCount" &&
				key !== "maxMutualConnectionsCount" &&
				(key !== "sortBy" || filters[key] !== "sentDate")
			) {
				return [true, true];
			}
		}

		return [hasSetFilters, false];
	}, [filters]);
	const sortOptions = useMemo(
		() =>
			FRIEND_REQUESTS_FILTER_SORTS.map((id) => ({
				id,
				value: id,
				label: getMessage(`friends.sorts.requests.${id}`),
			})),
		[],
	);

	const [ignoreAllFriendRequestsModalOpen, setIgnoreAllFriendRequestsModalOpen] = useState(false);

	const [recommendedUsers, , , , setRecommendedUsers] = usePromise(() => {
		if (!peopleYouMayKnowEnabled) return;

		return listUserFriendRecommendations({
			userId,
			source: "AddFriendsPage",
		}).then((data) => data.data);
	}, [userId, peopleYouMayKnowEnabled]);

	const {
		items,
		loading,
		pageNumber,
		maxPageNumber,
		hasAnyItems,
		allItems,
		fetchedAllPages,
		shouldBeDisabled,
		loadAllItems,
		setPageNumber,
		reset,
		removeItem,
	} = usePages<UserFriendRequestWithComponents, string>({
		paging: {
			method: "pagination",
			itemsPerPage: pageSize || 18,
			immediatelyLoadAllData: filters.sortBy !== "sentDate",
		},
		items: {
			shouldAlwaysUpdate: true,
			transformItem: (request) =>
				getProfileComponentsData({
					profileType: "User",
					profileId: request.id.toString(),
					components: [
						{
							component: "Communities",
						},
						{
							component: "UserProfileHeader",
						},
						{
							component: "RobloxBadges",
						},
						{
							component: "Statistics",
						},
					],
					includeCredentials: false,
				}).then((data) => {
					const robloxBadgeIds: number[] = [];
					if (data.components.RobloxBadges) {
						for (const item of data.components.RobloxBadges.robloxBadgeList) {
							robloxBadgeIds.push(item.type.id);
						}
					}

					let mutualCommunitiesCount = 0;
					if (myGroups && data.components.Communities)
						for (const item of myGroups) {
							if (data.components.Communities.groupsIds.includes(item)) {
								mutualCommunitiesCount++;
							}
						}

					return {
						...request,
						components: {
							robloxBadgeIds,
							mutualCommunitiesCount,
							connectionsCount:
								data.components.UserProfileHeader?.counts?.friendsCount ?? 0,
							followersCount:
								data.components.UserProfileHeader?.counts?.followersCount ?? 0,
							followingsCount:
								data.components.UserProfileHeader?.counts?.followingsCount ?? 0,
							isVerified: data.components.UserProfileHeader?.isVerified ?? false,
							isPremium: data.components.UserProfileHeader?.isPremium ?? false,
							joinedDate: data.components.Statistics
								? Math.floor(
										new Date(
											data.components.Statistics.userJoinedDate,
										).getTime() / 1_000,
									)
								: undefined,
						},
					};
				}),
			sortItems:
				advancedFilteringEnabled && filters.sortBy !== "sentDate"
					? (arr) =>
							crossSort(arr, (a, b) => {
								const direction = sortOrder === "Desc" ? -1 : 1;

								switch (filters.sortBy) {
									case "joinedDate": {
										return (
											((a.components?.joinedDate ?? 0) >
											(b.components?.joinedDate ?? 0)
												? 1
												: -1) * direction
										);
									}
									case "mutualCommunitiesCount": {
										return (
											((a.components?.mutualCommunitiesCount ?? 0) >
											(b.components?.mutualCommunitiesCount ?? 0)
												? 1
												: -1) * direction
										);
									}
									case "mutualConnectionsCount": {
										return (
											((a.mutualFriendsList.length ?? 0) >
											(b.mutualFriendsList.length ?? 0)
												? 1
												: -1) * direction
										);
									}
									case "connectionsCount": {
										return (
											((a.components?.connectionsCount ?? 0) >
											(b.components?.connectionsCount ?? 0)
												? 1
												: -1) * direction
										);
									}
									case "followingsCount": {
										return (
											((a.components?.followingsCount ?? 0) >
											(b.components?.followingsCount ?? 0)
												? 1
												: -1) * direction
										);
									}
									case "followersCount": {
										return (
											((a.components?.followersCount ?? 0) >
											(b.components?.followersCount ?? 0)
												? 1
												: -1) * direction
										);
									}
									// not implmented
									default: {
										return 0;
									}
								}
							})
					: undefined,
			filterItem: advancedFilteringEnabled
				? (item) => {
						if (!item.components && shouldRequestProfilePlatform) {
							return false;
						}

						return (
							checkValue(
								item.mutualFriendsList.length,
								filters.minMutualConnectionsCount,
								filters.maxMutualConnectionsCount,
							) &&
							(!shouldRequestProfilePlatform ||
								(item.components !== undefined &&
									checkValue(item.components.isPremium, filters.isPremium) &&
									checkValue(item.components.isVerified, filters.isVerified) &&
									checkValue(
										item.components.robloxBadgeIds,
										filters.robloxBadgeIds,
									) &&
									checkValue(
										item.components.mutualCommunitiesCount,
										filters.minMutualCommunitiesCount,
										filters.maxMutualCommunitiesCount,
									) &&
									checkValue(
										item.components.followersCount,
										filters.minFollowersCount,
										filters.maxFollowersCount,
									) &&
									checkValue(
										item.components.connectionsCount,
										filters.minConnectionsCount,
										filters.maxConnectionsCount,
									) &&
									checkValue(
										item.components.followingsCount,
										filters.minFollowingsCount,
										filters.maxFollowingsCount,
									) &&
									checkValue(
										item.components.joinedDate,
										filters.minJoinedDate,
										filters.maxJoinedDate,
									)))
						);
					}
				: undefined,
		},
		getNextPage: (pageData) =>
			listMyFriendRequests({
				limit: 100,
				cursor: pageData.nextCursor,
				sortOrder,
			}).then((data) => {
				return {
					...pageData,
					items: data.data,
					nextCursor: data.nextPageCursor || undefined,
					hasNextPage: data.nextPageCursor !== null,
				};
			}),
		dependencies: {
			reset: [userId, sortOrder],
			refreshToFirstPage: [
				advancedFilteringEnabled,
				filters,
				hasSetFilters && myGroups,
				shouldRequestProfilePlatform,
			],
		},
	});

	useEffect(() => {
		if (filters.sortBy === "sentDate") return;

		loadAllItems();
	}, [filters.sortBy]);

	const [universeData, setUniverseData] = useState<Record<number, SourceUniverseData>>({});
	const friendRequestsCount = fetchedAllPages
		? allItems.length
		: friendRequestsCountData?.count || 0;

	useEffect(() => {
		const universeIds: number[] = [];
		for (const item of allItems) {
			if (item.friendRequest?.sourceUniverseId) {
				universeIds.push(item.friendRequest.sourceUniverseId);
			}
		}

		if (recommendedUsers) {
			for (const item of recommendedUsers) {
				if (item.friendRequest?.sourceUniverseId) {
					universeIds.push(item.friendRequest.sourceUniverseId);
				}
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
	}, [allItems, recommendedUsers]);

	const ref = useRef<HTMLDivElement>(null);

	return (
		<div className="friends-content section" ref={ref}>
			<IgnoreAllFriendRequestsModal
				show={ignoreAllFriendRequestsModalOpen}
				setShow={setIgnoreAllFriendRequestsModalOpen}
				refresh={() => {
					refreshFriendRequestsCount();
					refreshNewFriendRequestsCount();
					reset();
				}}
			/>
			<FriendsPageTitle
				title={getMessage("friends.tabs.friendRequests.withNumber", {
					number: asLocaleString(friendRequestsCount),
					showPlus: friendRequestsCount === 500,
				})}
				tooltipContent={getMessage("friends.tabs.friendRequests.tooltip")}
				disabled={shouldBeDisabled}
				onRefresh={() => {
					reset();
					refreshFriendRequestsCount();
				}}
				sortOrder={sortOrder}
				setSortOrder={hasAnyItems || shouldBeDisabled ? setSortOrder : undefined}
			>
				{friendRequestsCount !== 0 && advancedFilteringEnabled && (
					<>
						<FriendRequestFilters
							filters={filters}
							setFilters={setFilters}
							disabled={shouldBeDisabled}
							container={ref}
						/>
						<Dropdown
							selectionItems={sortOptions}
							selectedItemValue={filters.sortBy}
							onSelect={(sortBy) => {
								setFilters({
									...filters,
									sortBy,
								});
							}}
						/>
					</>
				)}
				{friendRequestsCount !== 0 && (
					<Button
						type="control"
						size="xs"
						width="min"
						className="ignore-button see-all-link"
						onClick={() => {
							setIgnoreAllFriendRequestsModalOpen(true);
						}}
					>
						{getMessage("friends.friendRequests.ignoreAll.buttonText")}
					</Button>
				)}
			</FriendsPageTitle>
			{loading && (
				<div className="section-content-off">
					<Loading />
				</div>
			)}
			{!hasAnyItems && !loading && (
				<div className="section-content-off">
					<p>{getMessage("friends.friendRequests.noItems.you")}</p>
				</div>
			)}
			{hasAnyItems && (
				<AvatarCardList
					className={classNames({
						"roseal-disabled": shouldBeDisabled,
					})}
				>
					{items.map((item) => (
						<FriendCard
							pageUserId={userId}
							id={item.id}
							isMyProfile
							key={item.id}
							friendRequest={item.friendRequest}
							currentTab="friend-requests"
							removeCard={() => {
								refreshNewFriendRequestsCount();
								removeItem(item);
							}}
							sourceUniverse={
								item.friendRequest?.sourceUniverseId
									? universeData[item.friendRequest.sourceUniverseId]
									: undefined
							}
							mutualFriends={item.mutualFriendsList}
							requestsSortType={filters.sortBy}
							components={item.components}
						/>
					))}
				</AvatarCardList>
			)}
			{(maxPageNumber > 1 || pageNumber > 1) && (
				<Pagination
					current={pageNumber}
					hasNext={maxPageNumber > pageNumber}
					onChange={(current) => {
						setPageNumber(current);
					}}
					disabled={shouldBeDisabled}
				/>
			)}
			{recommendedUsers && recommendedUsers.length > 0 && (
				<div
					className={classNames("recommended-users-section", {
						hidden: loading,
					})}
				>
					<div className="container-header">
						<h3>{getMessage("friends.friendRequests.recommendedUsers.title")}</h3>
					</div>
					<AvatarCardList>
						{recommendedUsers.map((item) => (
							<FriendCard
								key={item.id}
								pageUserId={userId}
								id={item.id}
								isMyProfile
								friendRequest={item.friendRequest || undefined}
								currentTab="friend-requests"
								removeCard={() => {
									setRecommendedUsers(
										recommendedUsers.filter((user) => user.id !== item.id),
									);
								}}
								sourceUniverse={
									item.friendRequest?.sourceUniverseId
										? universeData[item.friendRequest.sourceUniverseId]
										: undefined
								}
								mutualFriends={item.mutualFriendsList || undefined}
								showSendFriendRequest={!item.friendRequest}
								hasPlayedWith={item.contextType === "Frequents"}
							/>
						))}
					</AvatarCardList>
				</div>
			)}
		</div>
	);
}
