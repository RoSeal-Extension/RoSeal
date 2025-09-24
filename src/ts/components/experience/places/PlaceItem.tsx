import type { UserPresence } from "src/ts/helpers/requests/services/users";
import { getExperienceLink, getUserProfileLink } from "src/ts/utils/links";
import Thumbnail from "../../core/Thumbnail";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";

export type PlacesTabItemProps = {
	id: number;
	name: string;
	latestSavedVersionNumber: number | null;
	isRootPlace?: boolean;
	isViewingPlace?: boolean;
	friendsPlaying?: UserPresence[];
};

export default function PlacesTabItem({
	id,
	name,
	latestSavedVersionNumber,
	isRootPlace,
	isViewingPlace,
	friendsPlaying,
}: PlacesTabItemProps) {
	return (
		<li className="list-item game-card game-tile roseal-game-card">
			<div className="grid-item-container game-card-container roseal-game-card-container">
				<a className="game-card-link" id={id.toString()} href={getExperienceLink(id, name)}>
					<Thumbnail
						containerClassName="game-card-thumb-container"
						request={{
							type: "PlaceIcon",
							targetId: id,
							size: "256x256",
						}}
					/>
					<div className="game-card-name game-name-title">{name}</div>
					<div className="game-card-info">
						{!!friendsPlaying?.length && (
							<div className="friends-playing-list">
								{friendsPlaying.slice(0, 3).map((friend) => (
									<a
										key={friend.userId}
										href={getUserProfileLink(friend.userId)}
										className="friend-playing avatar-card avatar-card-online"
									>
										<Thumbnail
											containerClassName="avatar avatar-headshot avatar-headshot-xs"
											imgClassName="avatar-card-image"
											request={{
												targetId: friend.userId,
												type: "AvatarHeadShot",
												size: "48x48",
											}}
										/>
									</a>
								))}
								{friendsPlaying.length > 3 && (
									<span className="friend-playing avatar-card avatar-card-online">
										<span className="thumbnail-2d-container roseal-thumbnail-2d-container avatar avatar-headshot avatar-headshot-xs players-hidden-placeholder">
											{getMessage("plusNumber", {
												number: friendsPlaying.length - 3,
											})}
										</span>
									</span>
								)}
							</div>
						)}
						{isRootPlace && (
							<div className="start-place-text text small">
								{getMessage("experience.places.item.startPlace")}
							</div>
						)}
						{isViewingPlace && !isRootPlace && (
							<div className="current-place-text text small">
								{getMessage("experience.places.item.currentPlace")}
							</div>
						)}
						{latestSavedVersionNumber !== null && (
							<div className="current-version-number-text text small">
								{getMessage("experience.places.item.versionNumber", {
									versionNumber: asLocaleString(latestSavedVersionNumber),
								})}
							</div>
						)}
					</div>
				</a>
			</div>
		</li>
	);
}
