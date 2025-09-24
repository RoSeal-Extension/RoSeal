import { getExperienceLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";

export type SlimExperienceCardProps = {
	universeId: number;
	name: string;
	rootPlaceId: number;
};

export default function SlimExperienceCard({
	universeId,
	name,
	rootPlaceId,
}: SlimExperienceCardProps) {
	return (
		<li className="list-item game-card game-tile roseal-game-card">
			<div className="grid-item-container game-card-container roseal-game-card-container">
				<a
					id={universeId.toString()}
					className="game-card-link"
					href={getExperienceLink(rootPlaceId, name)}
				>
					<Thumbnail
						containerClassName="game-card-thumb-container"
						request={{
							type: "GameIcon",
							targetId: universeId,
							size: "150x150",
						}}
					/>
					<div className="game-card-name game-name-title">{name}</div>
				</a>
			</div>
		</li>
	);
}
