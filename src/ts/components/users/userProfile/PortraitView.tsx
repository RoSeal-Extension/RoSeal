import classNames from "classnames";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import Thumbnail from "../../core/Thumbnail";

export type UserPortraitViewProps = {
	userId: number;
};

export default function UserPortraitView({ userId }: UserPortraitViewProps) {
	const [showPortrait, setShowPortrait] = useState(false);

	return (
		<div className={classNames("user-portrait-view", { "show-portrait": showPortrait })}>
			<Thumbnail
				containerClassName="thumbnail-span portrait-thumbnail-container"
				request={{
					type: "AvatarBust",
					targetId: userId,
					size: "420x420",
				}}
			/>
			<Button
				type="control"
				size="lg"
				className="toggle-thumbnail-type-btn"
				onClick={() => {
					setShowPortrait(!showPortrait);
				}}
			>
				{getMessage(`user.avatar.thumbnailType.${showPortrait ? "portrait" : "avatar"}`)}
			</Button>
		</div>
	);
}
