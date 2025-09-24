import classNames from "classnames";
import { useMemo } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import {
	getUserAssetFavorite,
	getUserBundleFavorite,
} from "src/ts/helpers/requests/services/favorites";
import type { MarketplaceItemType } from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../hooks/usePromise";
import Loading from "../core/Loading";

export type ItemFavoritedDateProps = {
	itemType: MarketplaceItemType;
	itemId: number;
	showOnHover: boolean;
	userId: number;
};

export default function ItemFavoritedDate({
	showOnHover,
	itemType,
	itemId,
	userId,
}: ItemFavoritedDateProps) {
	const [time] = usePromise(() => {
		if (itemType === "Asset") {
			return getUserAssetFavorite({
				assetId: itemId,
				userId,
			}).then((data) => data?.created);
		}

		return getUserBundleFavorite({
			bundleId: itemId,
			userId,
		}).then((data) => data?.created);
	}, [itemId, itemType, userId]);
	const displayMessage = useMemo(() => {
		if (!time) return;
		if (!showOnHover) {
			return getAbsoluteTime(time);
		}

		return getMessage("userFavorites.list.item.favorited", {
			time: getAbsoluteTime(time),
		});
	}, [showOnHover, time]);

	return (
		<span
			className={classNames("xsmall text item-favorited-date", {
				"show-on-hover": showOnHover,
			})}
		>
			{displayMessage || <Loading />}
		</span>
	);
}
