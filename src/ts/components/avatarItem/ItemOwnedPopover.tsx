import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString, getAbsoluteTime } from "src/ts/helpers/i18n/intlFormats";
import { listUserItemInstances } from "src/ts/helpers/requests/services/inventory";
import type { MarketplaceItemType } from "src/ts/helpers/requests/services/marketplace";
import Icon from "../core/Icon";
import Loading from "../core/Loading";
import Popover from "../core/Popover";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import { listAllUserInventoryItemInstances } from "src/ts/utils/assets";
import type { VNode } from "preact";

export type AvatarItemOwnedPopoverProps = {
	itemType: MarketplaceItemType;
	itemId: number;
	button?: VNode;
};

export default function AvatarItemOwnedPopover({
	itemType,
	itemId,
	button,
}: AvatarItemOwnedPopoverProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [instanceCount] = usePromise(async () => {
		if (!authenticatedUser?.userId) {
			return;
		}

		return (
			await listUserItemInstances({
				userId: authenticatedUser.userId,
				itemType,
				itemId,
			})
		).data.length;
	}, [authenticatedUser?.userId, itemType, itemId]);
	const [instances] = usePromise(async () => {
		if (!authenticatedUser?.userId || !instanceCount) {
			return;
		}

		return listAllUserInventoryItemInstances(
			authenticatedUser.userId,
			authenticatedUser.userId,
			authenticatedUser.isUnder13,
			itemType,
			itemId,
		);
	}, [authenticatedUser?.userId, itemId, instanceCount]);

	return (
		<Popover
			button={button ?? <Icon name="down" size="16x16" className="menu-open-btn" />}
			trigger="click"
			placement="bottom"
			className="avatar-item-owned-popover roseal-scrollbar"
		>
			{instances ? (
				<ul className="instance-list">
					{instances.map((instance, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: no other way tbh
						<li className="instance-item" key={index}>
							<div className="instance-number text small">
								{instance.assetDetails?.collectibleDetails?.serialNumber
									? getMessage("avatarItem.itemOwned.list.item.serialNumber", {
											serialNumber: asLocaleString(
												instance.assetDetails.collectibleDetails
													.serialNumber,
											),
										})
									: getMessage("avatarItem.itemOwned.list.item.numberTotal", {
											number: asLocaleString(index + 1),
											total: asLocaleString(instanceCount ?? 0),
										})}
							</div>
							{instance.addTime && (
								<div className="instance-obtained-date xsmall text">
									{getMessage("avatarItem.itemOwned.list.item.ownedSince", {
										created: getAbsoluteTime(instance.addTime),
									})}
								</div>
							)}
						</li>
					))}
				</ul>
			) : (
				<Loading />
			)}
		</Popover>
	);
}
