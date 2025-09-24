import { success, warning } from "../components/core/systemFeedback/helpers/globalSystemFeedback";
import { getMessage } from "../helpers/i18n/getMessage";
import { RESTError } from "../helpers/requests/main";
import {
	blockUser,
	listBlockedUsers,
	listUserFriends,
	type SkinnyUserFriend,
	unblockUser,
} from "../helpers/requests/services/users";

export function removeFollower(userId: number) {
	let secondUserId: number | undefined;

	return blockUser({
		userId,
	})
		.catch((error) => {
			if (error instanceof RESTError && error.httpCode === 400) {
				return listBlockedUsers({
					count: 1,
				}).then((data) => {
					secondUserId = data.data?.blockedUserIds[0];

					if (!secondUserId) {
						throw error;
					}

					return unblockUser({
						userId: secondUserId,
					}).then(() =>
						blockUser({
							userId,
						}),
					);
				});
			}

			throw error;
		})
		.then(() =>
			unblockUser({
				userId,
			}),
		)
		.then(() => {
			success(getMessage("user.removeFollower.success"));

			if (secondUserId) {
				return blockUser({
					userId: secondUserId,
				}).then(() => true);
			}
			return true;
		})
		.catch((error) => {
			warning(
				getMessage(
					error instanceof RESTError
						? error.httpCode === 429
							? "user.removeFollower.error.ratelimit"
							: "user.removeFollower.error.tooManyBlocked"
						: "user.removeFollower.error.generic",
				),
			);
			return false;
		});
}

export async function listAllFriends(targetUserId: number) {
	const friends: SkinnyUserFriend[] = [];
	let cursor: string | undefined;
	while (true) {
		const res = await listUserFriends({
			userId: targetUserId,
			limit: 50,
			cursor,
		});

		friends.push(...res.pageItems);
		if (!res.nextCursor) {
			break;
		}
		cursor = res.nextCursor;
	}

	return friends;
}
