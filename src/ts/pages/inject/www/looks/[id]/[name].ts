import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import type { GetLookByIdResponse } from "src/ts/helpers/requests/services/marketplace";
import { getRobloxUrl } from "src/ts/utils/baseUrls" with { type: "macro" };
import { getAssetTypeData } from "src/ts/utils/itemTypes";
import { LOOK_REGEX } from "src/ts/utils/regex";

export default {
	id: "looks.details",
	regex: [LOOK_REGEX],
	fn: () => {
		featureValueIsInject("fixLooksTryOn", true, () => {
			const V2_LOOKS_DETAILS_REGEX = /^\/look-api\/v2\/looks\/\d+$/;
			hijackResponse(async (req, res) => {
				if (!res?.ok) return;

				const url = new URL(req.url);
				if (url.hostname === getRobloxUrl("apis")) {
					if (V2_LOOKS_DETAILS_REGEX.test(url.pathname)) {
						const data = (await res.clone().json()) as GetLookByIdResponse;
						if (!data.look) return;
						for (const item of data.look.items) {
							if (item.itemType === "Bundle") {
								if (item.assetsInBundle)
									for (const item2 of item.assetsInBundle) {
										if (item2.meta) {
											if (
												(!item2.meta.version || item2.meta.version === 1) &&
												!item2.meta.order &&
												!item2.meta.position &&
												!item2.meta.rotation &&
												!item2.meta.order
											) {
												delete item2.meta;
											}
										}
									}
							} else {
								if (
									item.meta &&
									item.assetType &&
									!getAssetTypeData(item.assetType)?.meta
								) {
									item.meta = null;
								}
							}
						}

						return new Response(JSON.stringify(data), res);
					}
				}
			});
		});
	},
} satisfies Page;
