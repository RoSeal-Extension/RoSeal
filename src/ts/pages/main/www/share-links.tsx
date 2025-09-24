import FriendLinkModal from "src/ts/components/userFriends/FriendLinkModal";
import { setInvokeListener } from "src/ts/helpers/communication/dom";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { SHARE_LINK_REGEX } from "src/ts/utils/regex";
import { renderAppendBody } from "src/ts/utils/render";

export default {
	id: "shareLinks",
	regex: [SHARE_LINK_REGEX],
	css: ["css/shareLinks.css"],
	fn: () => {
		featureValueIs("handleFriendLinks", true, () => {
			setInvokeListener("shareLink.onFriendShareLink", async (data) => {
				let resolve: (data: undefined) => void;
				renderAppendBody(<FriendLinkModal {...data} resolve={() => resolve(undefined)} />);

				return new Promise<undefined>((resolveFn) => {
					resolve = resolveFn;
				});
			});
		});
	},
} satisfies Page;
