/*
    .light-theme #left-navigation-transactions:hover .icon-robux-28x28,
    .dark-theme #left-navigation-transactions .icon-robux-28x28 {
        filter: brightness(0.7);
    }

    .light-theme #left-navigation-transactions .icon-robux-28x28,
    .dark-theme #left-navigation-transactions:hover .icon-robux-28x28 {
        filter: brightness(2);
    }
*/

import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserFavoritesLink } from "src/ts/utils/links";
import Icon from "../core/Icon";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import LazyLink from "../core/LazyLink";

export default function NavigationFavorites() {
	const [featureData] = useFeatureValue("favoritesNav", [true, "accessories/face"]);
	const [authenticatedUser] = useAuthenticatedUser();

	return (
		<li>
			<LazyLink
				className="dynamic-overflow-container text-nav"
				href={
					authenticatedUser
						? getUserFavoritesLink(authenticatedUser.userId, featureData?.[1])
						: undefined
				}
				id="nav-favorites"
				target="_self"
			>
				<div>
					<Icon name="favorite" />
				</div>
				<span className="font-header-2 dynamic-ellipsis-item">
					{getMessage("navigation.favorites")}
				</span>
			</LazyLink>
		</li>
	);
}
