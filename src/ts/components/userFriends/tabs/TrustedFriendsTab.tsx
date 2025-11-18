import classNames from "classnames";
import { useEffect, useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	multigetUniversesByIds,
	multigetUniversesPlayabilityStatuses,
} from "src/ts/helpers/requests/services/universes";
import {
	listUserFriends,
	multigetUsersAreTrustedFriends,
	type SkinnyUserFriend,
	type UserPresence,
} from "src/ts/helpers/requests/services/users";
import AvatarCardList from "../../core/avatarCard/List";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import useFeatureValue from "../../hooks/useFeatureValue";
import usePages from "../../hooks/usePages";
import FriendCard from "../FriendCard";
import type { SourceUniverseData } from "../Page";
import FriendsPageTitle from "../PageTitle";

export type TrustedFriendsTabProps = {
	userId: number;
	onlineFriends?: readonly UserPresence[] | null;
};

export default function TrustedFriendsTab({ userId, onlineFriends }: TrustedFriendsTabProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [getAccurateFriendDateEnabled] = useFeatureValue(
		"improvedUserFriendsPage.getAccurateFriendDate",
		false,
	);
	const [pageSize] = useFeatureValue("improvedUserFriendsPage.pageSize", 18);

	const {
		items,
		loading,
		pageNumber,
		maxPageNumber,
		hasAnyItems,
		setPage: setPageNumber,
		reset,
	} = usePages<SkinnyUserFriend, SkinnyUserFriend, string>({
		paging: {
			method: "pagination",
			itemsPerPage: pageSize || 18,
		},
		fetchPage: (cursor) => {
			return listUserFriends({
				userId,
				limit: 50,
				cursor,
			}).then(async (data) => {
				return {
					items: await multigetUsersAreTrustedFriends({
						targetUserId: userId,
						userIds: data.pageItems.map((item) => item.id),
					}),
					nextCursor: data.nextCursor ?? undefined,
					hasMore: !!data.nextCursor,
				};
			});
		},
		streamResults: true,
	});

	const [friendsSince, setFriendsSince] = useState<Record<number, Date>>({});

	const disabled = loading;

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
						data: newData[item.universeId].data,
						isPlayable: item.isPlayable,
					};
				}

				return newData;
			});
		});
	}, [onlineFriends]);

	return (
		<div className="friends-content section">
			<FriendsPageTitle
				title={getMessage("friends.tabs.trustedFriends")}
				tooltipContent={getMessage("friends.tabs.trustedFriends.tooltip")}
				disabled={disabled}
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
					{getMessage("friends.trustedFriends.noItems.you")}
				</div>
			)}
			{hasAnyItems && (
				<AvatarCardList
					className={classNames({
						"roseal-disabled": disabled,
					})}
				>
					{items?.map((friend) => {
						const onlineFriend = onlineFriends?.find(
							(friend2) => friend2.userId === friend.id,
						);

						return (
							<FriendCard
								pageUserId={userId}
								key={friend.id}
								id={friend.id}
								isFriends
								isMyProfile
								currentTab="trusted-friends"
								friendSince={
									getAccurateFriendDateEnabled
										? friendsSince?.[friend.id]
										: undefined
								}
								sourceUniverse={
									onlineFriend?.universeId
										? universeData[onlineFriend.universeId]
										: undefined
								}
								removeCard={() => {
									reset();
								}}
								friendPresence={onlineFriend}
								setFriendSince={(data) => {
									setFriendsSince((currentData) => {
										const newData = { ...currentData };
										newData[friend.id] = data;

										return newData;
									});
								}}
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
