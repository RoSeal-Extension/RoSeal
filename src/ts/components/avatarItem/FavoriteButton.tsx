import {
	addUserAssetFavorite,
	getAssetFavoritesCount,
	getUserAssetFavorite,
	removeUserAssetFavorite,
} from "src/ts/helpers/requests/services/favorites";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import Tooltip from "../core/Tooltip";
import usePromise from "../hooks/usePromise";
import { abbreviateNumber, asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import Icon from "../core/Icon";
import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type FavoriteItemButtonProps = {
	assetId: number;
	canFavorite?: boolean;
};

export default function FavoriteItemButton({ assetId, canFavorite }: FavoriteItemButtonProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [userFavorite, , , , setUserFavorite] = usePromise(() => {
		if (!authenticatedUser || !canFavorite) {
			return;
		}

		return getUserAssetFavorite({
			userId: authenticatedUser.userId,
			assetId,
		});
	}, [authenticatedUser?.userId, canFavorite]);

	const [favoritesCount, , , , setFavoritesCount] = usePromise(() => {
		if (!authenticatedUser) {
			return;
		}

		return getAssetFavoritesCount({
			assetId,
		});
	}, [authenticatedUser?.userId]);

	return (
		<div
			className={classNames("favorites-button-container", {
				"roseal-disabled": !canFavorite,
			})}
		>
			{/* weird padding fix, do not remove*/}
			<div className="sg-system-feedback">
				<div className="alert-system-feedback" />
			</div>
			<div className="favorite-button-container">
				<Tooltip
					as="div"
					button={
						<button
							type="button"
							id="toggle-favorite"
							className="roseal-btn"
							onClick={
								canFavorite
									? () => {
											if (userFavorite) {
												removeUserAssetFavorite({
													userId: authenticatedUser!.userId,
													assetId,
												}).then(() => {
													setUserFavorite(null);
													if (typeof favoritesCount === "number") {
														setFavoritesCount(favoritesCount - 1);
													}
												});
											} else {
												addUserAssetFavorite({
													userId: authenticatedUser!.userId,
													assetId,
												}).then(() => {
													setUserFavorite({
														assetId,
														userId: authenticatedUser!.userId,
														created: new Date().toISOString(),
													});
													if (typeof favoritesCount === "number") {
														setFavoritesCount(favoritesCount + 1);
													}
												});
											}
										}
									: undefined
							}
						>
							<span
								title={asLocaleString(favoritesCount || 0)}
								className="text-favorite favoriteCount"
							>
								{abbreviateNumber(favoritesCount || 0)}
							</span>
							<Icon
								id="favorite-icon"
								name="favorite"
								className={classNames({
									favorited: !!userFavorite,
								})}
							/>
						</button>
					}
				>
					{getMessage(`item.${userFavorite ? "removeFrom" : "addTo"}Favorites`)}
				</Tooltip>
			</div>
		</div>
	);
}
