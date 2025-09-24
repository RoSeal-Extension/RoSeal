import { sendMessage } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type {
	MarketplaceItemType,
	MultigetAvatarItemsResponse,
} from "src/ts/helpers/requests/services/marketplace";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { AVATAR_MARKETPLACE_REGEX } from "src/ts/utils/regex";

export default {
	id: "marketplace",
	regex: [AVATAR_MARKETPLACE_REGEX],
	hotSwappable: true,
	fn: () => {
		const checks: MaybeDeepPromise<(() => void | undefined | boolean) | undefined | void>[] =
			[];

		checks.push(
			featureValueIsInject("marketplaceShowQuantityRemaining", true, () => {
				return hijackResponse(async (req, res) => {
					if (!res?.ok) return;
					const url = new URL(req.url);

					if (
						url.hostname === getRobloxUrl("catalog") &&
						url.pathname === "/v1/catalog/items/details"
					) {
						const data = (await res
							.clone()
							.json()) as MultigetAvatarItemsResponse<MarketplaceItemType>;
						if (data.data) {
							sendMessage("marketplace.sendItems", data.data);
						}
					}
				});
			}),
		);

		return () => {
			// @ts-expect-error: fine tbh
			Promise.all(checks).then((checks) => {
				for (const check of checks) check?.();
			});
		};
	},
} satisfies Page;
