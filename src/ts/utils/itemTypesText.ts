import { getMessage, hasMessage } from "../helpers/i18n/getMessage";
import type { LiterallyAnyItemType } from "../helpers/requests/services/marketplace";
import { getAssetTypeData, getBundleTypeData } from "./itemTypes";

export function getItemTypeDisplayLabel(
	type: LiterallyAnyItemType,
	displayText: "category" | "shortCategory",
	typeId?: number | string,
) {
	if ((type === "Asset" || type === "Bundle") && typeId) {
		const typeIdNum =
			typeof typeId === "number"
				? typeId
				: type === "Bundle"
					? getBundleTypeData(typeId)?.bundleTypeId
					: getAssetTypeData(typeId)?.assetTypeId;

		if (typeIdNum) {
			const textId = `${type.toLowerCase()}Types.${displayText}.${typeIdNum}`;

			if (hasMessage(textId)) {
				return getMessage(textId);
			}
		}
	}

	const textId = `itemTypes.${type}`;
	return getMessage(hasMessage(textId) ? textId : "itemTypes.Unknown");
}
