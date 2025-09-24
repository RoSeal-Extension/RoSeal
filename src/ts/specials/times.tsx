import ItemUpdatedCreated, {
	type ItemUpdatedCreatedProps,
} from "../components/item/UpdatedCreated";
import { watchBeforeLoad } from "../helpers/elements";
import type { TimeTarget } from "../helpers/features/featuresData";
import { multigetFeaturesValues } from "../helpers/features/helpers";
import { modifyItemStats } from "../helpers/modifyItemStats";

export function checkItemTimes(type: TimeTarget) {
	const timeName = `times.${type}.time` as const;
	const tooltipName = `times.${type}.tooltip` as const;

	return multigetFeaturesValues([timeName, tooltipName]).then(async (featureData) => {
		const time = featureData[timeName];
		const tooltip = featureData[tooltipName];

		return !!time?.[0] || !!tooltip?.[0];
	});
}

export function handleItemTimes(data: ItemUpdatedCreatedProps) {
	return checkItemTimes(data.target).then((shouldHandle) => {
		if (!shouldHandle) {
			return;
		}

		if (data.target === "associatedItems") {
			return watchBeforeLoad("#item-details .item-field-container:has(.date-time-i18n)").then(
				(el) => {
					el?.remove();

					return modifyItemStats("Item", <ItemUpdatedCreated {...data} />);
				},
			);
		}
	});
}
