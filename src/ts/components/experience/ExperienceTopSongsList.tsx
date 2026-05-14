import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { listExperienceTopSongs } from "src/ts/helpers/requests/services/universes";
import { getCreatorStoreAssetLink } from "src/ts/utils/links";
import ItemCarousel from "../core/ItemCarousel";
import Thumbnail from "../core/Thumbnail";
import usePromise from "../hooks/usePromise";

export type ExperienceTopSongsListProps = {
	universeId: number;
	universeName: string;
};

export default function ExperienceTopSongsList({
	universeId,
	universeName,
}: ExperienceTopSongsListProps) {
	const [topSongs] = usePromise(() =>
		listExperienceTopSongs({
			universeId,
			limit: 50,
		}).then((data) => data.songs),
	);

	if (!topSongs?.length) return null;

	return (
		<div className="experience-top-songs-section">
			<h2>
				{getMessage("experience.topSongs.title", {
					experienceName: universeName,
				})}
			</h2>
			<ItemCarousel innerClassName="game-carousel horizontal-scroller dynamic-layout-sizing-disabled">
				{topSongs.map((song) => (
					<div
						key={song.assetId}
						className="grid-item-container game-card-container"
						data-testid="game-tile"
					>
						<a
							className="game-card-link"
							href={getCreatorStoreAssetLink(song.assetId, song.title)}
							target="_blank"
							rel="noreferrer"
						>
							<Thumbnail
								containerClassName="game-card-thumb-container"
								request={{
									type: "Asset",
									targetId: song.albumArtAssetId,
									size: "420x420",
									isImageAsset: true,
								}}
							/>
							<div className="game-card-name game-name-title" title={song.title}>
								{song.title}
							</div>
							<span className="artist-name" title={song.artist}>
								{song.artist}
							</span>
						</a>
					</div>
				))}
			</ItemCarousel>
		</div>
	);
}
