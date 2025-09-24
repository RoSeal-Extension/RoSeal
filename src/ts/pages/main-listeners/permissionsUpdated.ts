import { currentPermissions } from "src/ts/helpers/permissions";
import type { ContentBackgroundMessageListener } from "src/types/dataTypes.d.ts";

export default {
	action: "permissionsUpdated",
	fn: (data) => {
		currentPermissions.value = data;
	},
} satisfies ContentBackgroundMessageListener<"permissionsUpdated">;
