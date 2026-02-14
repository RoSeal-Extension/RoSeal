import classNames from "classnames";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Thumbnail from "../../core/Thumbnail";
import { createPortal } from "preact/compat";

export type UserPortraitViewProps = {
	userId: number;
	buttons: HTMLElement;
};

export default function UserPortraitView({ userId, buttons }: UserPortraitViewProps) {
	const [showPortrait, setShowPortrait] = useState(false);

	return (
		<div
			className={classNames("avatar-thumbnail-container user-portrait-view", {
				"show-portrait": showPortrait,
			})}
		>
			<Thumbnail
				containerClassName="thumbnail-span no-background-thumbnail portrait-thumbnail-container"
				request={{
					type: "AvatarBust",
					targetId: userId,
					size: "420x420",
				}}
			/>

			{createPortal(
				<button
					type="button"
					className="toggle-thumbnail-type-btn roseal-user-profile-btn foundation-web-button"
					onClick={() => {
						setShowPortrait(!showPortrait);
					}}
				>
					<span>
						{getMessage(
							`user.avatar.thumbnailType.${showPortrait ? "portrait" : "avatar"}`,
						)}
					</span>
				</button>,
				buttons,
			)}
		</div>
	);
}
