import classNames from "classnames";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import {
	getAvatarItem,
	type MarketplaceItemType,
	multigetCollectibleItemsByIds,
} from "src/ts/helpers/requests/services/marketplace";
import { multigetUniversesByIds } from "src/ts/helpers/requests/services/universes";
import Icon from "../core/Icon";
import SlimExperienceCard from "../experience/SlimExperienceCard";
import usePromise from "../hooks/usePromise";

export type InExperienceOnlyUniversesFieldProps = {
	originalContent: string;
	itemType: MarketplaceItemType;
	itemId: number;
};

export default function InExperienceOnlyUniversesField({
	originalContent,
	itemType,
	itemId,
}: InExperienceOnlyUniversesFieldProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [experiences] = usePromise(
		() =>
			getAvatarItem({
				itemId: itemId,
				itemType: itemType,
			}).then((data) => {
				if (data?.collectibleItemId) {
					return multigetCollectibleItemsByIds({
						itemIds: [data.collectibleItemId],
					}).then((data) => {
						const universeIds = data[0].universeIds;
						if (universeIds?.length) {
							return multigetUniversesByIds({
								universeIds,
							});
						}
					});
				}
			}),
		[itemType, itemId],
	);

	return (
		<>
			<div
				className={classNames("item-first-line", {
					"has-experiences": experiences,
				})}
				id="roseal-sale-universes-text"
			>
				{experiences ? (
					<button type="button" className="roseal-btn" onClick={() => setIsOpen(!isOpen)}>
						{getMessage("avatarItem.experienceOnlySales", {
							arrowIcon: <Icon name={isOpen ? "up" : "down"} size="16x16" />,
						})}
					</button>
				) : (
					originalContent
				)}
			</div>
			{isOpen && experiences && (
				<ul
					id="roseal-sale-universes"
					className="game-carousel game-cards roseal-game-cards"
				>
					{experiences.map((experience) => (
						<SlimExperienceCard
							key={experience.id}
							universeId={experience.id}
							rootPlaceId={experience.rootPlaceId}
							name={experience.name}
						/>
					))}
				</ul>
			)}
		</>
	);
}
