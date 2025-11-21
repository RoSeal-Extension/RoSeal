import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { listUniversePlaces, type UniversePlace } from "src/ts/helpers/requests/services/universes";
import Loading from "../../core/Loading";
import Pagination from "../../core/Pagination";
import useOnlineFriends from "../../hooks/useOnlineFriends";
import usePages from "../../hooks/usePages";
import PlacesTabItem from "./PlaceItem";

export type PlacesTabProps = {
	universeId: number;
	currentPlaceId: number;
};

export default function PlacesTabContent({ universeId, currentPlaceId }: PlacesTabProps) {
	const [onlineFriends] = useOnlineFriends();

	const {
		items,
		loading,
		pageNumber,
		maxPageNumber,
		error,
		setPage: setPageNumber,
	} = usePages<UniversePlace, UniversePlace, string>({
		fetchPage: (cursor) =>
			listUniversePlaces({
				universeId,
				cursor,
				limit: 50,
				extendedSettings: true,
			}).then((data) => ({
				items: data.data,
				nextCursor: data.nextPageCursor ?? undefined,
				hasMore: !!data.nextPageCursor,
			})),
		paging: {
			method: "pagination",
			itemsPerPage: 50,
		},
		dependencies: {
			resetDeps: [universeId],
		},
	});

	return (
		<div className="other-places-container">
			<ul
				className={classNames("game-carousel game-cards roseal-game-cards", {
					"roseal-disabled": loading,
				})}
			>
				{items.map((item) => (
					<PlacesTabItem
						key={item.id}
						id={item.id}
						name={item.name}
						latestSavedVersionNumber={item.currentSavedVersion}
						isRootPlace={item.isRootPlace}
						isViewingPlace={item.id === currentPlaceId}
						friendsPlaying={onlineFriends?.filter(
							(friend) => friend.placeId === item.id,
						)}
					/>
				))}
			</ul>
			{loading && <Loading />}
			{error && (
				<p className="section-content-off">{getMessage("experience.places.error")}</p>
			)}

			{(maxPageNumber > 1 || pageNumber > 1) && (
				<Pagination
					current={pageNumber}
					hasNext={maxPageNumber > pageNumber}
					onChange={(current) => {
						setPageNumber(current);
					}}
					disabled={loading}
				/>
			)}
		</div>
	);
}
