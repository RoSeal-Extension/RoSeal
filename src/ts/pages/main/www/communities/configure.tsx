import { signal } from "@preact/signals";
import FreeItemsVisibilityButton from "src/ts/components/transactions/FreeItemsButton";
import PageSizeButton from "src/ts/components/transactions/PageSizeButton";
import PrivateServersVisibilityButton from "src/ts/components/transactions/PrivateServersButton";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs } from "src/ts/helpers/features/helpers";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { GROUP_CONFIGURE_REGEX } from "src/ts/utils/regex";
import { renderAfter } from "src/ts/utils/render";

export default {
	id: "community.configure",
	regex: [GROUP_CONFIGURE_REGEX],
	css: ["css/transactions.css"],
	fn: () => {
		featureValueIs("transactionsHidePrivateServersToggle", true, () => {
			const showPrivateServers = signal(true);
			watch('transactions[transaction-type="Sale"] .group-sales-header-container', (el) => {
				renderAfter(
					<PrivateServersVisibilityButton showPrivateServers={showPrivateServers} />,
					el,
				);
			});
		});
		featureValueIs("communityTransactionsPageSize", true, () => {
			const pageSize = signal(10);
			watch('transactions[transaction-type="Sale"] .group-sales-header-container', (el) => {
				renderAfter(<PageSizeButton pageSize={pageSize} />, el);
			});
		});
		featureValueIs("transactionsHideFreeItemsToggle", true, () => {
			const showFreeItems = signal(true);
			watch('transactions[transaction-type="Sale"] .group-sales-header-container', (el) => {
				renderAfter(<FreeItemsVisibilityButton showFreeItems={showFreeItems} />, el);
			});
		});
	},
} satisfies Page;
