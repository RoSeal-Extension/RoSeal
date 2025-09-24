import classNames from "classnames";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	getUserFriendsStatus,
	multigetFollowingStatuses,
} from "src/ts/helpers/requests/services/users";
import { removeFollower } from "src/ts/utils/users";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import usePromise from "../../hooks/usePromise";

export type RemoveFollowerButtonProps = {
	userId: number;
};

export default function RemoveFollowerButton({ userId }: RemoveFollowerButtonProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [inProgress, setInProgress] = useState(false);
	const [isFollowed, , , , setIsFollowed] = usePromise(
		() =>
			authenticatedUser &&
			getUserFriendsStatus({
				userIds: [userId],
				targetUserId: authenticatedUser.userId,
				overrideCache: true,
			}).then(
				(data) =>
					data[0]?.status !== "Friends" &&
					multigetFollowingStatuses({
						userIds: [userId],
						overrideCache: true,
					}).then((data) => data[0]?.isFollowed),
			),
		[authenticatedUser?.userId, userId],
	);

	const className = classNames("roseal-menu-item", {
		"roseal-disabled": inProgress,
	});

	return (
		<>
			{isFollowed && (
				<li id="remove-follower-li" role="presentation" className={className}>
					<button
						id="remove-follower-btn"
						type="button"
						className={className}
						onClick={() => {
							setInProgress(true);
							removeFollower(userId).then((success) => {
								setInProgress(false);
								if (success) {
									setIsFollowed(false);
								}
							});
						}}
					>
						{getMessage("user.removeFollower")}
					</button>
				</li>
			)}
		</>
	);
}
