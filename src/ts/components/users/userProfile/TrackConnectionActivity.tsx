import { useCallback, useMemo } from "preact/hooks";
import useStorage from "../../hooks/useStorage";
import {
	FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_DEFAULT_VALUE,
	FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY,
	type FriendsPresenceNotificationsDataStorageValue,
} from "src/ts/constants/friends";

export type TrackConnectionActivityButtonProps = {
	userId: number;
};

export default function TrackConnectionActivityButton({
	userId,
}: TrackConnectionActivityButtonProps) {
	const [storage, setStorage] = useStorage<FriendsPresenceNotificationsDataStorageValue>(
		FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_KEY,
		FRIENDS_PRESENCE_NOTIFICATIONS_DATA_STORAGE_DEFAULT_VALUE,
	);

	const isToggled = useMemo(() => storage.userIds.includes(userId), [storage.userIds, userId]);
	const toggleTracking = useCallback(() => {
		if (isToggled) {
			const index = storage.userIds.indexOf(userId);
			if (index !== -1) {
				storage.userIds.splice(index, 1);
			}
		} else {
			storage.userIds.push(userId);
		}

		setStorage({
			...storage,
		});
	}, [userId, isToggled, storage]);

	return (
		<li id="track-connection-activity-li" className="roseal-menu-item">
			<button type="button" className="copy-share-link-btn" onClick={toggleTracking}>
				{isToggled ? "Untrack Activity" : "Track Activity"}
			</button>
		</li>
	);
}
