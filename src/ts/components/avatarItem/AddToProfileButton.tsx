import { useEffect, useState } from "preact/hooks";
import { blankInjectGet } from "src/ts/helpers/domInvokes";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { RESTError } from "src/ts/helpers/requests/main";
import {
	addItemToCollection,
	type InventoryItemType,
	removeItemFromCollection,
	userOwnsItem,
} from "src/ts/helpers/requests/services/inventory";
import { listUserRobloxCollections } from "src/ts/helpers/requests/services/users";
import { AVATAR_ITEM_REGEX } from "src/ts/utils/regex";
import { getPathFromMaybeUrl } from "src/ts/utils/url";
import { success, warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";

export type AddToProfileButtonProps = {
	isHidden?: boolean;
	isPlace?: boolean;
	itemType: InventoryItemType;
	itemId: number;
	show?: boolean;
};

export default function AddToProfileButton({
	isHidden,
	isPlace,
	itemType,
	itemId,
	show,
}: AddToProfileButtonProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [inCollection, setInCollection] = useState(false);

	const [isOwned] = usePromise(() => {
		if (!authenticatedUser) {
			return false;
		}

		if (isPlace) {
			return true;
		}

		return userOwnsItem({
			userId: authenticatedUser.userId,
			itemType,
			itemId,
		});
	}, [itemId, itemType, authenticatedUser?.userId, isPlace]);

	useEffect(() => {
		if (!authenticatedUser) {
			return;
		}

		if (!isHidden && isPlace) {
			blankInjectGet<boolean>(["Roblox", "Showcases", "InShowcase"]).then(setInCollection);
		} else if ((itemType === "Asset" || itemType === "Bundle") && !isPlace) {
			listUserRobloxCollections({
				userId: authenticatedUser.userId,
			}).then((data) => {
				for (const item of data) {
					const path = getPathFromMaybeUrl(item.assetSeoUrl);
					const match =
						AVATAR_ITEM_REGEX.exec(path.realPath)?.[1] === "bundles"
							? "Bundle"
							: "Asset";
					if (match === itemType && item.id === itemId) {
						setInCollection(true);
						break;
					}
				}
			});
		} else {
			addItemToCollection({
				itemType,
				itemId,
			})
				.then(() => {
					return removeItemFromCollection({
						itemType,
						itemId,
					}).then(() => false);
				})
				.catch((error) => {
					return error instanceof RESTError && error.errors?.[0].code !== 4;
				})

				.then(setInCollection);
		}
	}, [isHidden, itemId, itemType, isPlace, authenticatedUser?.userId]);

	const prefix = `item.contextMenu.${inCollection ? "removeFrom" : "addTo"}Profile` as const;
	const doCollection = (retry?: boolean) => {
		(inCollection ? removeItemFromCollection : addItemToCollection)({
			itemType,
			itemId,
		})
			.then(() => {
				setInCollection(!inCollection);
				success(getMessage(`${prefix}.success`));
			})
			.catch(() => {
				if (!inCollection && !retry) {
					return removeItemFromCollection({
						itemType,
						itemId,
					})
						.then(() => doCollection(true))
						.catch(() => {
							warning(getMessage(`${prefix}.error`));
						});
				}
				warning(getMessage(`${prefix}.error`));
			});
	};

	if ((!show || !isOwned) && !inCollection) {
		return null;
	}

	return (
		<li id="toggle-profile-li">
			<button
				type="button"
				id="toggle-profile"
				data-place-id={isPlace ? itemId : undefined}
				className="rbx-context-menu-toggle-profile"
				onClick={() => {
					if (isPlace) {
						return;
					}

					doCollection();
				}}
			>
				{getMessage(prefix)}
			</button>
		</li>
	);
}
