import MdOutlineBookmarkOutlined from "@material-symbols/svg-400/outlined/bookmark.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getUserFavoritesLink } from "src/ts/utils/links";
import Icon from "../core/Icon";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useFeatureValue from "../hooks/useFeatureValue";
import LazyLink from "../core/LazyLink";
import LeftNavItem from "./LeftNavItem";

export type NavigationFavoritesProps = {
	useNewNav?: boolean;
};

export default function NavigationFavorites({ useNewNav }: NavigationFavoritesProps) {
	const [featureData] = useFeatureValue("favoritesNav", [true, "accessories/face"]);
	const [authenticatedUser] = useAuthenticatedUser();

	if (useNewNav) {
		return (
			<LeftNavItem
				id="user-favorites-nav"
				href={
					authenticatedUser
						? getUserFavoritesLink(authenticatedUser.userId, featureData?.[1])
						: undefined
				}
				iconComponent={<MdOutlineBookmarkOutlined className="roseal-icon" />}
			>
				{getMessage("navigation.favorites")}
			</LeftNavItem>
		);
	}

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
