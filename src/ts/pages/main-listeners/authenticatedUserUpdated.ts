import { signal } from "@preact/signals";
import {
	type AuthenticatedUser,
	getAuthenticatedUser,
	isAuthenticated,
} from "src/ts/utils/authenticatedUser";
import type { ContentBackgroundMessageListener } from "src/types/dataTypes.d.ts";

export const currentAuthenticatedUser = signal<MaybePromise<AuthenticatedUser | undefined>>(
	isAuthenticated().then((isAuthenticated) => {
		if (isAuthenticated) {
			return getAuthenticatedUser().then((authenticatedUser) => {
				currentAuthenticatedUser.value = authenticatedUser;
				return authenticatedUser;
			});
		}
	}),
);
export default {
	action: "authenticatedUserUpdated",
	fn: (data) => {
		if (
			currentAuthenticatedUser.value instanceof Promise ||
			currentAuthenticatedUser.value?.userId !== data?.id
		) {
			currentAuthenticatedUser.value = data && {
				userId: data.id,
				isUnder13: data.ageBracket === 1,
				hasVerifiedBadge: data.hasVerifiedBadge,
				created: new Date(data.created),
				hasPremium: data.isPremium,
				hasPlus: data.hasRobloxSubscription === true,
				username: data.name,
				displayName: data.displayName,
			};
		}
	},
} satisfies ContentBackgroundMessageListener<"authenticatedUserUpdated">;
