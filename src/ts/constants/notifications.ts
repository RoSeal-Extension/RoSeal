import type { RealtimeNotifications } from "../helpers/requests/services/notifications";

export const LISTEN_NOTIFICATION_TYPES = [
	"FriendshipNotifications",
	"PresenceBulkNotifications",
	"GameCloseNotifications",
] satisfies RealtimeNotifications[0][];
