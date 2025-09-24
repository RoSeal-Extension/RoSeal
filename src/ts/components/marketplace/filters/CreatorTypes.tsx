import type { Signal } from "@preact/signals";
import { type AgentIncludingAll, MARKETPLACE_CREATOR_TYPES } from "src/ts/constants/marketplace";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Icon from "../../core/Icon";

export type MarketplaceCreatorTypeFilterProps = {
	state: Signal<AgentIncludingAll>;
	updateState: (state: AgentIncludingAll, fromUpdate?: boolean, noRefresh?: boolean) => void;
};

export default function MarketplaceCreatorTypeFilterNew({
	state,
	updateState,
}: MarketplaceCreatorTypeFilterProps) {
	return (
		<div className="marketplace-creator-type-filter-new">
			<ul className="creator-type-filter-list">
				{MARKETPLACE_CREATOR_TYPES.map((type) => {
					return (
						<li
							className="filter-item"
							key={type.key}
							onClick={(e) => {
								e.stopImmediatePropagation();
								updateState(type.type);
							}}
						>
							<span className="filter-option-name">
								{getMessage(`marketplace.creatorType.${type.key}`)}
							</span>
							<Icon
								name={
									state.value === type.type
										? "radio-check-circle-filled"
										: "radio-check-circle"
								}
							/>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
