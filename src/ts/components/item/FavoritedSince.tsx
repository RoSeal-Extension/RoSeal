import type { MarketplaceItemType } from "src/ts/helpers/requests/services/marketplace";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import type { Signal } from "@preact/signals";
import {
	getUserAssetFavorite,
	type GetUserAssetFavoriteResponse,
	getUserBundleFavorite,
} from "src/ts/helpers/requests/services/favorites";
import Tooltip from "../core/Tooltip";
import { getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import MdOutlineInfo from "@material-symbols/svg-400/outlined/info.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ItemFavoritedSinceProps = {
	itemType: MarketplaceItemType;
	itemId: number;
	signal?: Signal<boolean>;
	data?: GetUserAssetFavoriteResponse;
};

export default function ItemFavoritedSince({
	itemType,
	itemId,
	signal,
	data: _data,
}: ItemFavoritedSinceProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [data] = usePromise(() => {
		if (_data) return _data;
		if (signal?.value === false || !authenticatedUser) {
			return null;
		}

		if (itemType === "Asset") {
			return getUserAssetFavorite({
				userId: authenticatedUser.userId,
				assetId: itemId,
			});
		}

		return getUserBundleFavorite({
			userId: authenticatedUser.userId,
			bundleId: itemId,
		});
	}, [_data, authenticatedUser, signal?.value, itemType, itemId]);

	if (!data) {
		return null;
	}

	return (
		<Tooltip
			containerClassName="item-favorited-since"
			button={<MdOutlineInfo className="roseal-icon" />}
		>
			{getMessage("item.favoritedSince", {
				date: getAbsoluteTime(data.created),
			})}
		</Tooltip>
	);
}
