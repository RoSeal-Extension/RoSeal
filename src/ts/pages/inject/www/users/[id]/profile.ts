import { setInvokeListener } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getUser3dThumbnailDownloadData } from "src/ts/utils/avatar.inject";
import { USER_PROFILE_REGEX } from "src/ts/utils/regex";

export default {
	id: "user.profile",
	regex: [USER_PROFILE_REGEX],
	fn: () => {
		if (import.meta.env.TARGET_BASE === "firefox") {
			featureValueIsInject("userProfileDownload3DAvatar", true, () =>
				setInvokeListener("user.avatar.getDownloadUrl", getUser3dThumbnailDownloadData),
			);
		}
	},
} as Page;
