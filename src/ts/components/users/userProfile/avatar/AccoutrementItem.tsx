import { useMemo } from "preact/hooks";
import Thumbnail from "src/ts/components/core/Thumbnail";
import { getItemRestrictionsClassName } from "src/ts/components/marketplace/utils/items";
import type {
	LookItemDetails,
	MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import { getAvatarAssetLink, getAvatarBundleLink } from "src/ts/utils/links";

export type UserProfileAccoutrementItemProps = {
	assetId: number;
	assetName?: string;
	details?: LookItemDetails<MarketplaceItemType>;
	showBundle?: boolean;
};

export default function UserProfileAccoutrementItem({
	assetId,
	assetName,
	details,
	showBundle,
}: UserProfileAccoutrementItemProps) {
	const label = useMemo(
		() => details && getItemRestrictionsClassName(details?.itemRestrictions),
		[details],
	);

	return (
		<li className="accoutrement-item">
			<a href={getAvatarAssetLink(assetId, assetName)}>
				<Thumbnail
					imgClassName="accoutrment-image"
					containerClassName="accoutrement-image-container"
					request={{
						type: "Asset",
						targetId: assetId,
						size: "150x150",
					}}
				>
					{details?.itemType === "Bundle" && showBundle && (
						<a
							className="accoutrement-bundle-container"
							href={getAvatarBundleLink(details.id, details.name)}
						>
							<Thumbnail
								imgClassName="accoutrment-bundle-image"
								containerClassName="accoutrement-bundle-image-container"
								request={{
									type: "BundleThumbnail",
									targetId: details.id,
									size: "150x150",
								}}
							/>
						</a>
					)}
				</Thumbnail>
				{label && (
					<div className="asset-restriction-icon">
						<span className={`icon-label ${label}`} />
					</div>
				)}
			</a>
		</li>
	);
}
