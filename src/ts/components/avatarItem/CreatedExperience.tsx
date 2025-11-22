import {
	getAvatarItem,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../hooks/usePromise";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes";
import { getExperienceLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type ItemCreatedExperienceProps = {
	itemType: MarketplaceItemType;
	itemId: number;
};

export default function ItemCreatedExperience({ itemType, itemId }: ItemCreatedExperienceProps) {
	const [experience] = usePromise(
		() =>
			getAvatarItem({
				itemType,
				itemId,
			}).then((data) => {
				if (data?.creatingUniverseId) {
					return multigetUniversesByIds({
						universeIds: [data.creatingUniverseId],
					}).then((data) => data[0]);
				}
			}),
		[itemId, itemType],
	);

	if (!experience) return null;

	return (
		<div className="item-created-experience-container">
			<Thumbnail
				request={{
					type: "GameIcon",
					targetId: experience.id,
					size: "256x256",
				}}
				containerClassName="created-experience-thumb"
				imgClassName="game-card-thumb"
			/>
			<span className="text-label">
				{getMessage("avatarItem.createdIn", {
					experienceName: (
						<a
							href={getExperienceLink(experience.rootPlaceId, experience.name)}
							className="text-name"
						>
							{experience.name}
						</a>
					),
				})}
			</span>
		</div>
	);
}
