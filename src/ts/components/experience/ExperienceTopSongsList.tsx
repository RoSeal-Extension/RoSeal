import { listExperienceTopSongs } from "src/ts/helpers/requests/services/universes";
import usePromise from "../hooks/usePromise";
import { getCreatorStoreAssetLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { clamp } from "src/ts/utils/misc";
import { useCallback, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import MdOutlineChevronRight from "@material-symbols/svg-600/outlined/chevron_right-fill.svg";
import MdOutlineChevronLeft from "@material-symbols/svg-600/outlined/chevron_left-fill.svg";

export type ExperienceTopSongsListProps = {
	universeId: number;
	universeName: string;
};

export default function ExperienceTopSongsList({
	universeId,
	universeName,
}: ExperienceTopSongsListProps) {
	const [scrollWidth, setScrollWidth] = useState(0);

	const [currentScrollLeft, setCurrentScrollLeft] = useState(0);
	const [maxScrollLeft, setMaxScrollLeft] = useState(0);

	const ref = useRef<HTMLDivElement>(null);

	const [topSongs] = usePromise(() =>
		listExperienceTopSongs({
			universeId,
			limit: 50,
		}).then((data) => data.songs),
	);

	const onWheel: JSX.WheelEventHandler<HTMLDivElement> = useCallback(
		(e) => {
			const scrollLeft = clamp(e.deltaX + e.deltaY + currentScrollLeft, 0, maxScrollLeft);

			if (scrollLeft === currentScrollLeft) {
				return;
			}

			e.preventDefault();
			e.currentTarget.scrollTo({
				left: scrollLeft,
			});

			setCurrentScrollLeft(scrollLeft);
		},
		[currentScrollLeft, maxScrollLeft],
	);

	const onChevronClick = useCallback(
		(previous: boolean) => {
			const scrollLeft = clamp(
				currentScrollLeft + (previous ? -scrollWidth : scrollWidth),
				0,
				maxScrollLeft,
			);

			ref.current?.scrollTo({
				left: scrollLeft,
				behavior: "smooth",
			});

			setCurrentScrollLeft(scrollLeft);
		},
		[maxScrollLeft, currentScrollLeft],
	);

	if (!topSongs?.length) return null;

	return (
		<div className="experience-top-songs-section">
			<h2>
				{getMessage("experience.topSongs.title", {
					experienceName: universeName,
				})}
			</h2>
			<div className="roseal-carousel">
				{currentScrollLeft > 0 && (
					<button
						type="button"
						className="roseal-btn roseal-scroller previous"
						onClick={() => onChevronClick(true)}
					>
						<MdOutlineChevronLeft className="roseal-icon" />
					</button>
				)}
				{maxScrollLeft > currentScrollLeft && (
					<button
						type="button"
						className="roseal-btn roseal-scroller next"
						onClick={() => onChevronClick(false)}
					>
						<MdOutlineChevronRight className="roseal-icon" />
					</button>
				)}
				<div
					className="game-carousel horizontal-scroller expand-home-content-disabled"
					ref={(el) => {
						ref.current = el;
						if (el) {
							const clientWidth = el.clientWidth;

							setScrollWidth(clientWidth);
							setMaxScrollLeft(el.scrollWidth - clientWidth);
						}
					}}
					onWheelCapture={onWheel}
				>
					{topSongs.map((song) => (
						<div
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
							</a>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
