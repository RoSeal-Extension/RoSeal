import classNames from "classnames";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { SortOrder } from "src/ts/helpers/requests/services/badges";
import {
	listUserFollowings,
	listUserFollowingsCount,
	type UserFriendFollowerDetail,
} from "src/ts/helpers/requests/services/users";
import AvatarCardList from "../../core/avatarCard/List";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import usePromise from "../../hooks/usePromise";
import FriendsPageTitle from "../PageTitle";
import FriendCard from "./../FriendCard";
import type { FriendsTabProps } from "./FriendsTab";

export default function FollowingsTab({ userId, isMyProfile }: FriendsTabProps) {
	const [followingsCount, , , refreshFollowingsCount] = usePromise(
		() =>
			listUserFollowingsCount({
				userId,
			}).then((data) => data.count),
		[],
	);
	const [pageSize] = useFeatureValue("improvedUserFriendsPage.pageSize", 18);
	const [sortOrder, setSortOrder] = useState<SortOrder>("Desc");

	const {
		items,
		loading,
		pageNumber,
		maxPageNumber,
		hasAnyItems,
		setPageNumber,
		reset,
		removeItem,
	} = usePages<UserFriendFollowerDetail, string>({
		paging: {
			method: "pagination",
			itemsPerPage: pageSize || 18,
		},
		getNextPage: (pageData) =>
			listUserFollowings({
				userId,
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
		},
	});

	return (
		<div className="friends-content section">
			<FriendsPageTitle
				title={getMessage("friends.tabs.following.withNumber", {
					number: asLocaleString(followingsCount || 0),
				})}
				tooltipContent={getMessage("friends.tabs.following.tooltip")}
				disabled={loading}
				onRefresh={() => {
					reset();
					refreshFollowingsCount();
				}}
				sortOrder={sortOrder}
				setSortOrder={hasAnyItems || loading ? setSortOrder : undefined}
			/>
			{!hasAnyItems && loading && (
				<div className="section-content-off">
					<Loading />
				</div>
			)}
			{!hasAnyItems && !loading && (
				<div className="section-content-off">
					{getMessage(`friends.followings.noItems.${isMyProfile ? "you" : "someone"}`)}
				</div>
			)}
			{hasAnyItems && (
				<AvatarCardList
					className={classNames({
						"roseal-disabled": loading,
					})}
				>
					{items.map((item) => (
						<FriendCard
							pageUserId={userId}
							id={item.id}
							isMyProfile={isMyProfile}
							key={item.id}
							currentTab="following"
							removeCard={() => {
								removeItem(item);
							}}
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
					disabled={loading}
				/>
			)}
		</div>
	);
}
