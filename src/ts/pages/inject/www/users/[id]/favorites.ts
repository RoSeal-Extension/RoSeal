import { addMessageListener } from "src/ts/helpers/communication/dom";
import { watchOnce } from "src/ts/helpers/elements";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { handleInventoryFavoritesCategories } from "src/ts/specials/handleInventoryFavoritesCategories";
import {
	type AssetsExplorerScope,
	handleInventorySorting,
} from "src/ts/specials/handleInventorySorting";
import { USER_FAVORITES_REGEX } from "src/ts/utils/regex";

/*
type AssetsExplorerType = angular.IScope & {
    $ctrl: {
        staticData: {
            canViewInventory: boolean;
        };
        currentData: {
            categoryName: string;
        };
    };
};*/

export default {
	id: "user.favorites",
	regex: [USER_FAVORITES_REGEX],
	runInIframe: true,
	fn: () => {
		featureValueIsInject("inventorySortFilters", true, () =>
			watchOnce("#favorites-container .page-content").then((pageContent) => {
				const scope = window.angular?.element(pageContent)?.scope<AssetsExplorerScope>();
				if (!scope) return;

				handleInventorySorting(scope, true);
			}),
		);

		addMessageListener("user.inventory.setupCategories", (data) => {
			handleInventoryFavoritesCategories(data);
		});
	},
} as Page;
