import { getCreatorStoreAssetLink } from "src/ts/utils/links";
import usePromise from "../../hooks/usePromise";
import { getExperienceEventById } from "src/ts/helpers/requests/services/universes";
import Tooltip from "../../core/Tooltip";
import Icon from "../../core/Icon";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type EventViewThumbnailAssetProps = {
	eventId: string;
};

export default function EventViewThumbnailAsset({ eventId }: EventViewThumbnailAssetProps) {
	const [assetId] = usePromise(
		() =>
			getExperienceEventById({
				eventId,
			}).then((data) => data.thumbnails?.[0].mediaId),
		[eventId],
	);

	if (!assetId) return null;

	return (
		<Tooltip
			containerClassName="btn-control-container btn-view-thumbnail-asset-container"
			placement="top"
			button={
				<a
					className="btn-control btn-view-thumbnail-asset"
					href={getCreatorStoreAssetLink(assetId)}
					target="_blank"
					rel="noreferrer"
				>
					<Icon name="menu-document" />
				</a>
			}
		>
			{getMessage("experience.media.viewAsset")}
		</Tooltip>
	);
}
