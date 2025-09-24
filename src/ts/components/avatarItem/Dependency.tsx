import Thumbnail from "../core/Thumbnail.tsx";
import VerifiedBadge from "../icons/VerifiedBadge.tsx";
import { getMessage } from "../../helpers/i18n/getMessage.ts";
import type { GeneralAssetDetails } from "../../helpers/requests/services/assets.ts";
import { getCreatorProfileLink, getCreatorStoreAssetLink } from "../../utils/links.ts";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText.ts";
import { getAssetTypeData } from "src/ts/utils/itemTypes.ts";

export type AssetDependencyProps = {
	dependency: GeneralAssetDetails;
};

export default function AssetDependency({ dependency }: AssetDependencyProps) {
	const assetTypeData = getAssetTypeData(dependency.assetTypeId);

	return (
		<div className="dependency-item-card list-item item-card grid-item-container">
			<div className="item-card-container">
				<a
					href={getCreatorStoreAssetLink(dependency.assetId, dependency.name)}
					className="item-card-link"
				>
					<div className="item-card-link">
						<div className="item-card-thumb-container">
							{assetTypeData?.canHaveThumbnail !== false ? (
								<Thumbnail
									request={{
										type: "Asset",
										targetId: dependency.assetId,
										size: "420x420",
									}}
								/>
							) : (
								<Thumbnail
									data={{
										state: "Error",
									}}
								/>
							)}
						</div>
					</div>
					<div className="item-card-caption">
						<div className="item-card-name-link">
							<div className="item-card-name" title={dependency.name}>
								{dependency.name}
							</div>
						</div>
						<div className="item-card-secondary-info text-secondary">
							<div className="text-overflow item-card-creator">
								<span className="item-card-creator-text">
									{getMessage("avatarItem.dependencies.itemBy", {
										creator: (
											<a
												className="creator-name text-link"
												href={getCreatorProfileLink(
													dependency.creator.creatorTargetId,
													dependency.creator.creatorType!,
													dependency.creator.name!,
												)}
											>
												{dependency.creator.name}{" "}
												{dependency.creator.hasVerifiedBadge && (
													<VerifiedBadge height={14} width={14} />
												)}
											</a>
										),
									})}
								</span>
							</div>
							<div className="text-overflow item-card-type">
								<span className="item-card-type-text">
									{getItemTypeDisplayLabel(
										"Asset",
										"category",
										dependency.assetTypeId,
									)}
								</span>
							</div>
						</div>
					</div>
				</a>
			</div>
		</div>
	);
}
