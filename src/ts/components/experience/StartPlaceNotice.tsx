import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { sendJoinMultiplayerGame } from "src/ts/utils/gameLauncher";
import { getExperienceLink } from "src/ts/utils/links";
import Button from "../core/Button";
import Icon from "../core/Icon";
import Thumbnail from "../core/Thumbnail";

export type StartPlaceNoticeProps = {
	rootPlaceId: number;
	universeId: number;
	universeName: string;
};

export default function StartPlaceNotice({
	rootPlaceId,
	universeId,
	universeName,
}: StartPlaceNoticeProps) {
	return (
		<div className="start-place-notice">
			<a
				className="start-place-thumbnail"
				href={getExperienceLink(rootPlaceId, universeName)}
			>
				<Thumbnail
					request={{
						type: "GameIcon",
						targetId: universeId,
						size: "150x150",
					}}
				/>
			</a>
			<div className="notice-text text">
				{getMessage("experience.startPlaceNotice", {
					name: (
						<a
							className="text-name"
							href={getExperienceLink(rootPlaceId, universeName)}
						>
							{universeName}
						</a>
					),
				})}
			</div>
			<Button
				type="growth"
				className="play-start-place-btn"
				onClick={() => {
					sendJoinMultiplayerGame({
						placeId: rootPlaceId,
					});
				}}
			>
				<Icon name="common-play" />
			</Button>
		</div>
	);
}
