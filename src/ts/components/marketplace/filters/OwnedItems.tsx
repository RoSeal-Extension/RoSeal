import type { Signal } from "@preact/signals";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Filter from "../../core/filters/Filter";

export type OwnedItemsFilterProps = {
	state: Signal<boolean>;
	updateState: (state: boolean) => void;
};

export default function MarketplaceOwnedItemsFilterNew({
	state,
	updateState,
}: OwnedItemsFilterProps) {
	return (
		<Filter
			className="marketplace-owned-items-filter-new"
			filter={{
				id: "ownedItems",
				type: "dropdown",
				title: getMessage("marketplace.ownedItemsFilter.title"),
				previewTitle: getMessage("marketplace.ownedItemsFilter.title"),
				options: [
					{
						label: getMessage("marketplace.ownedItemsFilter.hide"),
						value: true,
					},
					{
						label: getMessage("marketplace.ownedItemsFilter.show"),
						value: false,
					},
				],
				value: state.value,
				defaultValue: false,
			}}
			applyFilterValue={(_, value) => {
				updateState(value as boolean);
			}}
		/>
	);
}
