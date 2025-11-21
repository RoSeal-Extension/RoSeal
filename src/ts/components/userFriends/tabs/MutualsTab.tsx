import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getMutualFriends, type MutualFriendData } from "src/ts/utils/friends";
import AvatarCardList from "../../core/avatarCard/List";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import FriendsPageTitle from "../PageTitle";
import FriendCard from "./../FriendCard";

export type MutualsTabProps = {
	userId: number;
};

export default function MutualsTab({ userId }: MutualsTabProps) {
	const [pageSize] = useFeatureValue("improvedUserFriendsPage.pageSize", 18);

	const {
		allItems,
		items,
		loading,
		pageNumber,
		maxPageNumber,
		hasAnyItems,
		setPage: setPageNumber,
		reset,
	} = usePages<MutualFriendData, MutualFriendData, string>({
		paging: {
			method: "pagination",
			itemsPerPage: pageSize || 18,
		},
		fetchPage: () =>
			getMutualFriends(userId, true).then((data) => ({
				items: data,
				nextCursor: undefined,
				hasMore: false,
			})),
	});

	return (
		<div className="friends-content section">
			<FriendsPageTitle
				title={getMessage("friends.tabs.mutuals.withNumber", {
					number: asLocaleString(allItems.length || 0),
				})}
				tooltipContent={getMessage("friends.tabs.mutuals.tooltip")}
				disabled={loading}
				onRefresh={() => {
					reset();
				}}
			/>
			{!hasAnyItems && loading && (
				<div className="section-content-off">
					<Loading />
				</div>
			)}
			{!hasAnyItems && !loading && (
				<div className="section-content-off">
					{getMessage("friends.mutuals.noItems.someone")}
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
							isMyProfile={false}
							key={item.id}
							currentTab="mutuals"
							removeCard={reset}
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
