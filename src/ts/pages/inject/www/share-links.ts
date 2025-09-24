import { invokeMessage } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { ResolveShareLinkResponse } from "src/ts/helpers/requests/services/sharelinks";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { SHARE_LINK_REGEX } from "src/ts/utils/regex";

export default {
	id: "shareLinks",
	regex: [SHARE_LINK_REGEX],
	fn: () => {
		featureValueIsInject("handleFriendLinks", true, () => {
			hijackResponse(async (req, res) => {
				let resolve: () => void;
				if (
					!res?.ok ||
					req.url !== `https://${getRobloxUrl("apis", "/sharelinks/v1/resolve-link")}`
				) {
					return;
				}

				const data = (await res.clone().json()) as ResolveShareLinkResponse<"FriendInvite">;
				if (!data.friendInviteData) {
					return;
				}

				invokeMessage("shareLink.onFriendShareLink", data.friendInviteData).then(() => {
					resolve();
				});
				return new Promise((resolveFn) => {
					resolve = resolveFn;
				});
			});
		});
	},
} satisfies Page;
