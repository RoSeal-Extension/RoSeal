import { signal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { onNotificationType, onRobloxPresenceUpdateDetails } from "src/ts/helpers/notifications";
import {
	presenceProcessor,
	updatePresenceFromOnlineFriends,
} from "src/ts/helpers/processors/presenceProcessor";
import {
	getUserFriendStatus,
	listUserOnlineFriends,
	type UserPresence,
} from "src/ts/helpers/requests/services/users";
import { currentAuthenticatedUser } from "src/ts/pages/main-listeners/authenticatedUserUpdated";

const onlineFriends = signal<UserPresence[] | undefined>();
const onlineFriendsFetched = signal(false);
let onlineFriendsInitialized = false;

function initOnlineFriends() {
	if (onlineFriendsInitialized) return;

	onlineFriendsInitialized = true;

	const getAuthedUser = () => {
		const authedUser = currentAuthenticatedUser?.value;
		if (!authedUser || authedUser instanceof Promise) return;

		return authedUser;
	};

	const updateFriend = (userId: number) => {
		const authedUser = getAuthedUser();

		if (!onlineFriends.value || !authedUser || authedUser?.userId === userId) {
			return;
		}

		presenceProcessor
			.request({
				userId,
			})
			.then((presenceData) => {
				const newOnlineFriends = [...(onlineFriends.value as UserPresence[])];
				const currentDataIndex = newOnlineFriends?.findIndex(
					(data2) => data2.userId === userId,
				);

				if (presenceData.userPresenceType === 0) {
					if (currentDataIndex !== -1) {
						newOnlineFriends.splice(currentDataIndex, 1);
					}
				} else {
					if (currentDataIndex !== -1) {
						newOnlineFriends[currentDataIndex] = presenceData;
					} else {
						newOnlineFriends.push(presenceData);
					}
				}

				onlineFriends.value = newOnlineFriends;
			});
	};

	const removeFriend = (userId: number) => {
		const authedUser = getAuthedUser();

		if (!onlineFriends.value || !authedUser || authedUser?.userId === userId) {
			return;
		}

		const currentDataIndex = onlineFriends.value?.findIndex((data2) => data2.userId === userId);
		if (currentDataIndex !== -1) {
			onlineFriends.value.splice(currentDataIndex, 1);
			onlineFriends.value = [...onlineFriends.value];
		}
	};

	onRobloxPresenceUpdateDetails((data) => {
		for (const item of data) {
			getUserFriendStatus({
				userId: item.userId,
			}).then((data) => {
				if (data.status !== "Friends") {
					removeFriend(item.userId);
				} else {
					updateFriend(item.userId);
				}
			});
		}
	});

	onNotificationType("FriendshipNotifications", (data) => {
		const authedUser = getAuthedUser();

		let targetUserId: number;
		if (data.EventArgs.UserId1 === authedUser?.userId) {
			targetUserId = data.EventArgs.UserId2;
		} else {
			targetUserId = data.EventArgs.UserId1;
		}

		if (data.Type === "FriendshipDestroyed") {
			removeFriend(targetUserId);
		} else if (data.Type === "FriendshipCreated") {
			updateFriend(targetUserId);
		}
	});

	currentAuthenticatedUser.subscribe((value) => {
		if (!value || value instanceof Promise) {
			onlineFriends.value = undefined;
			onlineFriendsFetched.value = false;
			return;
		}

		listUserOnlineFriends({
			userId: value.userId,
		})
			.then((data) => {
				onlineFriendsFetched.value = true;
				onlineFriends.value = updatePresenceFromOnlineFriends(data.data);
			})
			.catch(() => {
				onlineFriendsFetched.value = true;
			});
	});
}

export default function useOnlineFriends() {
	useEffect(initOnlineFriends, []);
	return [onlineFriends.value, onlineFriendsFetched.value] as const;
}
