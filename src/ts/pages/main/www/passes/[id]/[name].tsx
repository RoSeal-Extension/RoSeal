import ItemProductInfo from "src/ts/components/item/ProductInfo";
import ItemSales from "src/ts/components/avatarItem/Sales";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { handleItemTimes } from "src/ts/specials/times";
import { renderMentions } from "src/ts/utils/description";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import { PASS_DETAILS_REGEX } from "src/ts/utils/regex";

export default {
	id: "pass",
	regex: [PASS_DETAILS_REGEX],
	fn: ({ regexMatches }) => {
		const passId = Number.parseInt(regexMatches![0]?.[1], 10);

		featureValueIs("viewItemSales", true, () =>
			modifyItemStats(
				"Item",
				() => <ItemSales itemId={passId} itemType={"GamePass"} isAvatarItem={false} />,
				1,
			),
		);

		featureValueIs("formatItemMentions", true, () =>
			watch(".description-content", (el) => renderMentions(el)),
		);

		handleItemTimes({
			itemType: "GamePass",
			itemId: passId,
			target: "associatedItems",
		});

		featureValueIs("viewItemProductInfo", true, () =>
			modifyItemStats(
				"Item",
				() => (
					<ItemProductInfo itemId={passId} itemType={"GamePass"} isAvatarItem={false} />
				),
				2,
			),
		);

		featureValueIs("viewItemMedia", true, () =>
			modifyItemContextMenu(<ViewIconAssetButton itemType="GamePass" itemId={passId} />),
		);
	},
} satisfies Page;
