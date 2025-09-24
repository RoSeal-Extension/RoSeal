import { getAvatarAssetLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";
import type { ListedUserInventoryAsset } from "src/ts/helpers/requests/services/inventory";
import { getItemTypeDisplayLabel } from "src/ts/utils/itemTypesText";

export type SearchedAssetResultProps = {
	item: ListedUserInventoryAsset;
};

export default function SearchedAssetResult({ item }: SearchedAssetResultProps) {
	return (
		<a
			className="search-result-format"
			href={getAvatarAssetLink(item.assetId, item.name)}
			onClick={(e) => {
				e.preventDefault();
			}}
		>
			<div className="search-result-icon">
				<Thumbnail
					request={{
						type: "Asset",
						targetId: item.assetId,
						size: "75x75",
					}}
				/>
			</div>
			<div className="search-result-detail text-overflow">
				<div className="search-result-name text-overflow text-emphasis">{item.name}</div>
				<div className="search-result-type text-overflow text small">
					{getItemTypeDisplayLabel("Asset", "category", item.assetType)}
				</div>
			</div>
		</a>
	);
}
