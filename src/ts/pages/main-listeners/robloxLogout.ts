import type { ContentBackgroundMessageListener } from "src/types/dataTypes.d.ts";
import { logout } from "src/ts/helpers/requests/services/account";
import type { RESTError } from "src/ts/helpers/requests/main";

export default {
	action: "logoutRobloxAccount",
	fn: () => {
		return logout()
			.then(() => true)
			.catch((error: RESTError) => {
				return !!error.httpCode && error.httpCode !== 403;
			});
	},
} satisfies ContentBackgroundMessageListener;
