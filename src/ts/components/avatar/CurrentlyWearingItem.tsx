import { getAvatarAssetLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";
import Icon from "../core/Icon";

export type CurrentlyWearingItemProps = {
	assetId: number;
	assetName?: string;
	removeItem: () => void;
};

export default function CurrentlyWearingItem({
	assetId,
	assetName,
	removeItem,
}: CurrentlyWearingItemProps) {
	return (
		<li
			className="list-item item-card"
			onClick={(e) => {
				e.stopImmediatePropagation();
				removeItem();
			}}
		>
			<div className="item-card-container remove-panel">
				<div className="item-card-link">
					<a
						href={getAvatarAssetLink(assetId, assetName)}
						className="item-card-thumb-container"
					>
						<div className="item-card-thumb">
							<Thumbnail
								request={{
									type: "Asset",
									targetId: assetId,
									size: "150x150",
								}}
							/>
						</div>
					</a>
				</div>
				<div className="item-card-caption">
					<div className="item-card-equipped">
						<div className="item-card-equipped-label" />
						<Icon name="check-selection" />
					</div>
				</div>
			</div>
		</li>
	);
}
