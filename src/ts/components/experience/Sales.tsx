import { getAssetById } from "src/ts/helpers/requests/services/assets";
import usePromise from "../hooks/usePromise";
import ExperienceField from "../core/items/ExperienceField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";

export type ExperienceSalesProps = {
	rootPlaceId: number;
};

export default function ExperienceSales({ rootPlaceId }: ExperienceSalesProps) {
	const [salesCount] = usePromise(() => {
		return getAssetById({
			assetId: rootPlaceId,
		}).then((data) => data?.sales);
	}, [rootPlaceId]);

	return (
		<>
			{!!salesCount && (
				<ExperienceField title={getMessage("item.sales")} id="item-sales-field">
					<p className="text-lead font-caption-body">{asLocaleString(salesCount)}</p>
				</ExperienceField>
			)}
		</>
	);
}
