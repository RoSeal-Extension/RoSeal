import Thumbnail from "src/ts/components/core/Thumbnail";
import { getAvatarBundleLink } from "src/ts/utils/links";

export type AssetWearingBundleProps = {
	id: number;
	name: string;
};

export default function AssetWearingBundle({ id, name }: AssetWearingBundleProps) {
	return (
		<a className="accoutrement-bundle-container" href={getAvatarBundleLink(id, name)}>
			<Thumbnail
				imgClassName="accoutrment-bundle-image"
				containerClassName="accoutrement-bundle-image-container"
				request={{
					type: "BundleThumbnail",
					targetId: id,
					size: "150x150",
				}}
				altText={name}
			/>
		</a>
	);
}
