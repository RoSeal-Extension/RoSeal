import MdOutlineMapSearchFilled from "@material-symbols/svg-400/outlined/map_search-fill.svg";
import type { Signal } from "@preact/signals";
import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import Tooltip from "../../core/Tooltip";

export type JoinPreferredRegionButton = {
	active: Signal<boolean>;
};

export default function JoinPreferredRegionButton({ active }: JoinPreferredRegionButton) {
	return (
		<Tooltip
			className="join-preferred-region-container"
			placement="auto"
			button={
				<Button
					className={classNames("preferred-region-btn custom-join-btn selected", {
						searching: active.value,
					})}
					type="growth"
					onClick={() => {
						active.value = true;
					}}
				>
					<MdOutlineMapSearchFilled className="roseal-icon" />
				</Button>
			}
		>
			{getMessage("experience.joinPreferredRegion.buttonTooltip")}
		</Tooltip>
	);
}
