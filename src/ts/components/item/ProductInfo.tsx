import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { getAssetById } from "src/ts/helpers/requests/services/assets.ts";
import { getDeveloperProductByProductId } from "src/ts/helpers/requests/services/developerProducts.ts";
import type { AnyItemType } from "src/ts/helpers/requests/services/marketplace.ts";
import {
	getAvatarItem,
	getItemCollectibleId,
	multigetCollectibleItemsByIds,
} from "src/ts/helpers/requests/services/marketplace.ts";
import { getPassProductById } from "src/ts/helpers/requests/services/passes.ts";
import ItemField from "../core/items/ItemField.tsx";
import usePromise from "../hooks/usePromise.ts";

export type ItemProductInfoProps = {
	itemId?: number;
	itemType?: AnyItemType;
	isAvatarItem?: boolean;
};

export type WithProductInfo = {
	collectibleItemId?: string | null;
	collectibleProductId?: string | null;
	productId?: string | number;
};

export default function ItemProductInfo({ itemId, itemType, isAvatarItem }: ItemProductInfoProps) {
	const [data] = usePromise(() => {
		if (!itemId || !itemType) return;

		if (isAvatarItem && (itemType === "Bundle" || itemType === "Asset")) {
			return getAvatarItem({
				itemId,
				itemType,
			}).then((data): MaybePromise<WithProductInfo> | undefined => {
				if (data?.collectibleItemId) {
					return multigetCollectibleItemsByIds({
						itemIds: [data.collectibleItemId],
					}).then((data) => data[0]);
				}

				return data;
			});
		}

		if (itemType === "Asset") {
			return getAssetById({
				assetId: itemId,
			}).catch(() =>
				getItemCollectibleId({ itemType: "Asset", itemId }).then(
					(data) =>
						({
							collectibleItemId: data.collectibleItemId ?? undefined,
						}) as WithProductInfo,
				),
			);
		}

		if (itemType === "GamePass") {
			return getPassProductById({
				passId: itemId,
			}) as Promise<WithProductInfo>;
		}

		if (itemType === "DeveloperProduct") {
			return getDeveloperProductByProductId({
				productId: itemId,
			}) as Promise<WithProductInfo>;
		}
	});

	return (
		<>
			{!!data?.productId && (
				<ItemField
					useNewClasses={isAvatarItem}
					title={getMessage("item.productId")}
					id="product-id-field"
				>
					<div className="field-content">
						<span className="text font-body">{data.productId}</span>
					</div>
				</ItemField>
			)}
			{data?.collectibleItemId && (
				<ItemField
					useNewClasses={isAvatarItem}
					title={getMessage("item.collectibleItemId")}
					id="collectible-item-id-field"
				>
					<div className="field-content">
						<span className="text font-body">{data.collectibleItemId}</span>
					</div>
				</ItemField>
			)}
			{data?.collectibleProductId && (
				<ItemField
					useNewClasses={isAvatarItem}
					title={getMessage("item.collectibleProductId")}
					id="collectible-product-id-field"
				>
					<div className="field-content">
						<span className="text font-body">{data.collectibleProductId}</span>
					</div>
				</ItemField>
			)}
		</>
	);
}
