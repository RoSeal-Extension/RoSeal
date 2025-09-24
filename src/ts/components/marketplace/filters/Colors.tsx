import type { Signal } from "@preact/signals";
import {
	DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE,
	type MarketplaceColorFiltersState,
} from "src/ts/constants/marketplace";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Filter from "../../core/filters/Filter";

export type MarketplaceColorFiltersProps = {
	state: Signal<MarketplaceColorFiltersState>;
};

export default function MarketplaceColorFiltersNew({ state }: MarketplaceColorFiltersProps) {
	return (
		<Filter
			className="marketplace-color-filters-new"
			filter={{
				id: "colorFilters",
				type: "colorsWithCheckboxes",
				title: getMessage("marketplace.colorFilters.clientTitle"),
				titleTooltip: getMessage("marketplace.colorFilters.clientTooltip"),
				previewTitle: getMessage("marketplace.colorFilters.clientTitle"),
				value: [
					{
						color: state.value.primaryBaseColor,
						enabled: state.value.primaryBaseColorEnabled,
					},
					{
						color: state.value.secondaryBaseColor,
						enabled: state.value.secondaryBaseColorEnabled,
					},
					{
						color: state.value.anyBaseColor,
						enabled: state.value.anyBaseColorEnabled,
					},
				],
				defaultValue: [
					{
						color: DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE.primaryBaseColor,
						enabled: DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE.primaryBaseColorEnabled,
					},
					{
						color: DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE.secondaryBaseColor,
						enabled: DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE.secondaryBaseColorEnabled,
					},
					{
						color: DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE.anyBaseColor,
						enabled: DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE.anyBaseColorEnabled,
					},
				],
				options: [
					{
						label: getMessage("marketplace.colorFilters.primary"),
					},
					{
						label: getMessage("marketplace.colorFilters.secondary"),
					},
					{
						label: getMessage("marketplace.colorFilters.any"),
					},
				],
			}}
			applyFilterValue={(_, value) => {
				state.value = {
					primaryBaseColor: value[0].color,
					primaryBaseColorEnabled: value[0].enabled,
					secondaryBaseColor: value[1].color,
					secondaryBaseColorEnabled: value[1].enabled,
					anyBaseColor: value[2].color,
					anyBaseColorEnabled: value[2].enabled,
				};
			}}
		/>
	);
}
