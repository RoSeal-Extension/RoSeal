import type { UserFriendWhoPlayed } from "src/ts/helpers/requests/services/users";
import useProfileData from "../hooks/useProfileData";
import Thumbnail from "../core/Thumbnail";
import { getUserProfileLink } from "src/ts/utils/links";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useMemo } from "preact/hooks";
import { getFormattedDuration } from "../utils/getFormattedDuration";
import Tooltip from "../core/Tooltip";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";

export type FriendWhoPlayedItemProps = {
	friend: UserFriendWhoPlayed;
};

export default function FriendWhoPlayedItem({ friend }: FriendWhoPlayedItemProps) {
	const lastPlayed = useMemo(() => {
		if (!friend.lastPlayedTimestamp) return null;

		return [
			getFormattedDuration(new Date(friend.lastPlayedTimestamp), new Date()),
			getAbsoluteTime(friend.lastPlayedTimestamp),
		];
	}, [friend.lastPlayedTimestamp]);

	const profileData = useProfileData({ userId: friend.friendUserId });

	return (
		<li className="friend-item-container">
			<a className="friend-item text-name" href={getUserProfileLink(friend.friendUserId)}>
				<div className="friend-thumbnail avatar avatar-headshot avatar-headshot-md">
					<Thumbnail
						request={{
							type: "AvatarHeadShot",
							targetId: friend.friendUserId,
							size: "420x420",
						}}
					/>
				</div>
				{profileData && (
					<div className="friend-names text-overflow">
						<div className="friend-name text-overflow">
							{profileData.names.combinedName}
						</div>
						<div className="friend-username text-overflow">
							{getMessage("experience.friendsPlayed.modal.body.item.username", {
								username: profileData.names.username,
							})}
						</div>
					</div>
				)}
				{lastPlayed && (
					<Tooltip
						as="div"
						button={
							<span className="text">
								{getMessage("experience.friendsPlayed.modal.body.item.lastPlayed", {
									time: lastPlayed[0],
								})}
							</span>
						}
						includeContainerClassName={false}
						containerClassName="friend-last-played-date"
					>
						{lastPlayed[1]}
					</Tooltip>
				)}
			</a>
		</li>
	);
}
