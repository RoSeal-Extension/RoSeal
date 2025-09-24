import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText";
export default {
	id: "all",
	isAllPages: true,
	sites: ["store"],
	fn: () => {
		featureValueIs("viewOffsaleStoreItems", true, () => {
			watch('[data-testid="itemDetailsTestId"] h3 + span:empty', (empty) => {
				const idStr = location.pathname.match(/\/asset\/(\d+)/)?.[1];

				if (!idStr) {
					return;
				}
				const id = Number.parseInt(idStr, 10);
				getAssetById({
					assetId: id,
				}).then((details) => {
					empty.textContent = getItemTypeDisplayLabel(
						"Asset",
						"category",
						details.assetTypeId,
					);
				});
			});
		});
	},
} satisfies Page;
