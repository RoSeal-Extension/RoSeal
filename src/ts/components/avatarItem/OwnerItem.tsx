import { ROBLOX_USERS } from "src/ts/constants/robloxUsers";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { ListedAssetOwnerInstance } from "src/ts/helpers/requests/services/assets";
import { getCanTradeWithUser } from "src/ts/helpers/requests/services/trades";
import { getUserProfileLink, getUserTradeLink } from "src/ts/utils/links";
import Button from "../core/Button";
import Thumbnail from "../core/Thumbnail";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import useProfileData from "../hooks/useProfileData";
import usePromise from "../hooks/usePromise";
import AvatarItemResellerOwned from "./resellers/ItemOwned";

export type AssetOwnerItemProps = ListedAssetOwnerInstance & {
	totalSerialNumbers: number;
	isLimited: boolean;
	isUGC: boolean;
};

export default function AssetOwnerItem({
	owner,
	serialNumber,
	collectibleItemInstanceId,
	updated,
	totalSerialNumbers,
	isLimited,
	id,
	isUGC,
}: AssetOwnerItemProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [canTradeWithUser] = usePromise(() => {
		if (
			!authenticatedUser?.hasPremium ||
			!isLimited ||
			!owner ||
			authenticatedUser.userId === owner.id ||
			owner.id === ROBLOX_USERS.robloxSystem
		)
			return;

		return getCanTradeWithUser({
			userId: owner.id,
		});
	}, [authenticatedUser?.hasPremium, owner?.id]);
	const ownerProfileData = useProfileData(
		owner
			? {
					userId: owner.id,
				}
			: undefined,
	);

	const Tag = owner ? "a" : "span";

	return (
		<li className="reseller-item list-item">
			<Tag
				className="list-header reseller-item-avatar"
				href={owner ? getUserProfileLink(owner.id) : undefined}
			>
				<div className="avatar-headshot-md">
					<Thumbnail
						request={
							owner
								? {
										type: "AvatarHeadShot",
										targetId: owner.id,
										size: "150x150",
									}
								: undefined
						}
					/>
				</div>
			</Tag>
			<div className="resale-info">
				<div className="item-reseller-container">
					<Tag
						className="text-name username"
						href={owner ? getUserProfileLink(owner.id) : undefined}
					>
						{ownerProfileData?.names.username}
						{!owner && getMessage("avatarItem.owners.item.privateInventoryOwner")}
					</Tag>
				</div>
				{serialNumber !== undefined && serialNumber !== null && (
					<>
						<span className="separator">-</span>
						<span className="font-caption-body serial-number">
							{getMessage("avatarItem.owners.item.serialNumber", {
								serialNumber: asLocaleString(serialNumber),
								totalQuantity: asLocaleString(totalSerialNumbers),
							})}
						</span>
					</>
				)}
				<AvatarItemResellerOwned
					isLimited={isLimited}
					isUGC={isUGC}
					item={{
						addTime: updated,
						userAssetId: id,
					}}
				/>
			</div>
			{isLimited && authenticatedUser?.hasPremium && (
				<div className="reseller-buttons-container">
					<Button
						as="a"
						href={
							owner
								? getUserTradeLink(owner.id, collectibleItemInstanceId)
								: undefined
						}
						type="buy"
						className="reseller-purchase-button owner-offer-btn"
						disabled={!canTradeWithUser?.canTrade}
					>
						{getMessage("avatarItem.owners.item.buttons.offer")}
					</Button>
				</div>
			)}
		</li>
	);
}
