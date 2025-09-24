import { addMessageListener, sendMessage, setInvokeListener } from "../helpers/communication/dom";
import { hijackRequest } from "../helpers/hijack/fetch";
import { hijackFunction } from "../helpers/hijack/utils";
import type { SortOrder } from "../helpers/requests/services/badges";
import type {
	UserInventoryCategory,
	UserInventoryCategoryItem,
} from "../helpers/requests/services/inventory";

export type InventoryCategoryData = {
	category?: UserInventoryCategory | null;
	subcategory?: UserInventoryCategoryItem | null;
	hasSortDirection: boolean;
	sortDirection?: SortOrder;
	canView: boolean;
};

export type AssetsExplorerItemsScope = angular.IScope & {
	$ctrl: {
		showMessageToFindNewItems: () => boolean;
		currentData: {
			itemSection: string;
		};
	};
};
export type AssetsExplorerScope = angular.IScope & {
	$ctrl: {
		canViewInventory: string;
		assets: unknown[];
		currentData: {
			categoryName: string;
			templateVisible: boolean;
			category: UserInventoryCategory;
			subcategory?: UserInventoryCategoryItem | null;
			itemSection?: string;
		};
		cursorPager: {
			getPagingParameters: () => Record<string, unknown>;
			canLoadFirstPage: () => boolean;
			canLoadNextPage: () => boolean;
			canLoadPreviousPage: () => boolean;
			isBusy: () => boolean;
			canReloadCurrentPage: () => boolean;
			hasNextPage: () => boolean;
			getCurrentPageNumber: () => number;

			loadFirstPage: () => Promise<unknown[]>;
			loadNextPage: () => Promise<unknown[]>;
			loadPreviousPage: () => Promise<unknown[]>;
			getCurrentPage: () => Promise<unknown[]>;
			reloadCurrentPage: () => Promise<unknown[]>;
			setPagingParametersAndLoadFirstPage: (
				value: Record<string, unknown>,
			) => Promise<unknown[]>;
		};
		$onChanges: () => void;
	};
};

export function handleInventorySorting(scope: AssetsExplorerScope, isFavoritesPage?: boolean) {
	let shouldSetAsc = false;
	hijackFunction(
		scope.$ctrl.cursorPager,
		(target, thisArg, args) => {
			if ("bypassHijack" in args[0]) return target.apply(thisArg, args);

			shouldSetAsc = false;

			const sortDirection = args[0].sortOrder as SortOrder | undefined;

			const categoryName = scope.$ctrl.currentData.categoryName;
			const isUnsupportedTab = !!args[0].placeTab || categoryName === "game-passes";

			sendMessage("user.inventory.categoryChanged", {
				category: scope.$ctrl.currentData.category,
				subcategory: scope.$ctrl.currentData.subcategory,
				hasSortDirection:
					sortDirection !== undefined && !isUnsupportedTab && !isFavoritesPage,
				sortDirection: sortDirection || "Desc",
				canView: scope.$ctrl.canViewInventory === "True" || isFavoritesPage,
			});

			return target.apply(thisArg, args);
		},
		"setPagingParametersAndLoadFirstPage",
	);

	const refreshInventory = () => {
		scope.$ctrl.assets = [];
		scope.$ctrl.currentData.templateVisible = false;

		const oldParams = scope.$ctrl.cursorPager.getPagingParameters();
		scope.$ctrl.cursorPager
			.setPagingParametersAndLoadFirstPage({
				...oldParams,
				bypassHijack: true,
				sortOrder: shouldSetAsc ? "Asc" : "Desc",
			})
			.then((data) => {
				scope.$ctrl.assets = data;
				scope.$ctrl.currentData.templateVisible = true;
				scope.$apply();
			});
	};
	addMessageListener("user.inventory.refreshInventory", refreshInventory);

	if (!isFavoritesPage) {
		addMessageListener("user.inventory.setSortDirection", (sortDirection) => {
			shouldSetAsc = sortDirection === "Asc";

			refreshInventory();
		});

		hijackRequest((req) => {
			if (!shouldSetAsc) return;

			const url = new URL(req.url);
			if (url.searchParams.get("sortOrder") !== "Desc") {
				return;
			}

			url.searchParams.set("sortOrder", "Asc");
			return new Request(url.toString(), req);
		});
	}

	setInvokeListener("user.inventory.getCategoryData", () => {
		const pagingParameters = scope.$ctrl.cursorPager.getPagingParameters();
		const sortDirection = pagingParameters.sortOrder as SortOrder | undefined;
		const categoryName = scope.$ctrl.currentData.categoryName;
		const isUnsupportedTab = !!pagingParameters.placeTab || categoryName === "game-passes";

		return {
			category: scope.$ctrl.currentData.category,
			subcategory: scope.$ctrl.currentData.subcategory,
			hasSortDirection: sortDirection !== undefined && !isUnsupportedTab && !isFavoritesPage,
			sortDirection: sortDirection || "Desc",
			canView: scope.$ctrl.canViewInventory === "True" || isFavoritesPage,
		};
	});
}
