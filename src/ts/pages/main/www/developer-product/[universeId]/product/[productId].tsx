import ItemSales from "src/ts/components/avatarItem/Sales";
import ItemProductInfo from "src/ts/components/item/ProductInfo";
import ItemUpdatedCreated from "src/ts/components/item/UpdatedCreated";
import ViewIconAssetButton from "src/ts/components/item/ViewIconAssetButton";
import { modifyItemContextMenu } from "src/ts/helpers/contextMenus";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import { modifyItemStats } from "src/ts/helpers/modifyItemStats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getDeveloperProductByProductId } from "src/ts/helpers/requests/services/developerProducts";
import { DEVELOPER_PRODUCT_DETAILS_REGEX } from "src/ts/utils/regex";

export default {
	id: "developerProduct.details",
	regex: [DEVELOPER_PRODUCT_DETAILS_REGEX],

	fn: async ({ regexMatches }) => {
		const universeId = Number.parseInt(regexMatches![0][1], 10);
		const productId = Number.parseInt(regexMatches![0][2], 10);

		featureValueIs("viewItemSales", true, () =>
			modifyItemStats(
				"DeveloperProduct",
				() => (
					<ItemSales
						itemId={productId}
						universeId={universeId}
						itemType="DeveloperProduct"
						isAvatarItem={false}
					/>
				),
				1,
			),
		);

		featureValueIs("viewItemProductInfo", true, () =>
			modifyItemStats(
				"DeveloperProduct",
				() => <ItemProductInfo itemType="DeveloperProduct" itemId={productId} />,
				3,
			),
		);

		featureValueIs("developerProductCreatedUpdated", true, () =>
			modifyItemStats(
				"DeveloperProduct",
				() => (
					<ItemUpdatedCreated
						itemType="DeveloperProduct"
						itemId={productId}
						target="experiences"
					/>
				),
				2,
			),
		);

		featureValueIs("viewItemMedia", true, async () => {
			const data = await getDeveloperProductByProductId({
				productId,
			});

			if (!data.displayIconImageAssetId) return;

			modifyItemContextMenu(() => (
				<ViewIconAssetButton
					itemType="DeveloperProduct"
					itemId={data.targetId}
					iconAssetId={data.displayIconImageAssetId}
				/>
			));
		});
	},
} satisfies Page;
