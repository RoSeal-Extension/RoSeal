import MarketplaceItemPricingPage from "src/ts/components/pages/ItemPricing";
import { modifyTitle, watchOnce } from "src/ts/helpers/elements";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { MARKETPLACE_ITEM_PRICING_REGEX } from "src/ts/utils/regex";
import { renderAppend } from "src/ts/utils/render";

export default {
	id: "marketplaceItemPricing",
	regex: [MARKETPLACE_ITEM_PRICING_REGEX],
	featureIds: ["viewAvatarItemPriceFloor"],
	isCustomPage: true,
	css: ["css/marketplaceItemPricing.css"],
	fn: () => {
		modifyTitle("Marketplace Item Pricing");
		watchOnce(".content").then((content) =>
			renderAppend(<MarketplaceItemPricingPage />, content),
		);
	},
} satisfies Page;
