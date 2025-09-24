import MdOutlineTune from "@material-symbols/svg-400/outlined/tune.svg";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { AvatarRestrictions } from "src/ts/helpers/requests/services/avatar";
import { getAssetTypeData } from "src/ts/utils/itemTypes";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText";
import { getAvatarAssetLink } from "src/ts/utils/links";
import Icon from "../../core/Icon";
import Thumbnail from "../../core/Thumbnail";
import type { AdvancedWornAsset } from "../AdvancedCustomizationButton";

export type WornAssetView = {
	asset: AdvancedWornAsset;
	avatarRules: AvatarRestrictions | null | undefined;
	itemsAtLimit: Set<number>;
	setAssetData: (asset: AdvancedWornAsset) => void;
	removeAssetFromAvatar: (assetId: number) => void;
};

export default function WornAssetView({
	asset,
	avatarRules,
	itemsAtLimit,
	setAssetData,
	removeAssetFromAvatar,
}: WornAssetView) {
	const typeData = getAssetTypeData(asset.assetType.id);
	const canBeRefined = avatarRules?.accessoryRefinementTypes?.includes(asset.assetType.id);

	return (
		<li className="asset-details-container" key={asset.id}>
			<div className="asset-thumbnail">
				<Thumbnail
					request={{
						type: "Asset",
						targetId: asset.id,
						size: "420x420",
					}}
				/>
			</div>
			<div className="asset-details text-overflow">
				<a
					className="asset-name text-overflow text-link"
					href={getAvatarAssetLink(asset.id, asset.name)}
				>
					{asset.name}
				</a>
				<div className="asset-type-name text-overflow text small">
					{getItemTypeDisplayLabel("Asset", "category", asset.assetType.id)}
				</div>
				{itemsAtLimit.has(asset.id) && (
					<div className="text-error at-limit-text">
						{getMessage("avatar.advanced.assets.item.removeToAddMore")}
					</div>
				)}
			</div>
			<div className="asset-actions">
				{(canBeRefined || typeData?.isLayered) && (
					<>
						{asset.meta?.order !== undefined ? (
							<div className="asset-layered-order text small">
								{getMessage("avatar.advanced.assets.item.layeredOrder", {
									order: asLocaleString(asset.meta.order),
								})}
							</div>
						) : undefined}
						<button
							type="button"
							className="roseal-btn edit-item-btn"
							onClick={() => {
								setAssetData(structuredClone(asset));
							}}
						>
							<MdOutlineTune className="roseal-icon" />
						</button>
					</>
				)}
				<button
					type="button"
					className="roseal-btn remove-item-btn"
					onClick={() => removeAssetFromAvatar(asset.id)}
				>
					<Icon name="close" />
				</button>
			</div>
		</li>
	);
}
