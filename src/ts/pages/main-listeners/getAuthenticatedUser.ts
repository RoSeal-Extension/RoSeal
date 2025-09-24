import type { ContentBackgroundMessageListener } from "src/types/dataTypes.d.ts";
import { getCurrentAuthenticatedUser } from "src/ts/helpers/requests/services/account";
import { getUserById } from "src/ts/helpers/requests/services/users";
import type { RESTError } from "src/ts/helpers/requests/main";

export default {
	action: "getAuthenticatedUser",
	fn: () => {
		return getCurrentAuthenticatedUser()
			.catch((res: RESTError) => {
				throw res.httpCode === 401 || res.httpCode === 403
					? "NotAuthenticated"
					: "UnknownError";
			})
			.then((data) =>
				getUserById({
					userId: data.id,
				}).then((data2) => ({
					...data,
					hasVerifiedBadge: data2.hasVerifiedBadge,
					created: data2.created,
				})),
			);
	},
} satisfies ContentBackgroundMessageListener<"getAuthenticatedUser">;
