import { getMessage } from "src/ts/helpers/i18n/getMessage";
import type { ListedItemSocialConnection } from "src/ts/helpers/requests/services/marketplace";
import { getUserProfileLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";
import useProfileData from "../hooks/useProfileData";

export type ConnectionOwnedItemProps = {
	connection: ListedItemSocialConnection;
};
export default function ConnectionOwnedItem({ connection }: ConnectionOwnedItemProps) {
	const profileData = useProfileData({ userId: connection.id });

	return (
		<li className="connection-item-container">
			<a className="connection-item text-name" href={getUserProfileLink(connection.id)}>
				<div className="connection-thumbnail avatar avatar-headshot avatar-headshot-md">
					<Thumbnail
						request={{
							type: "AvatarHeadShot",
							targetId: connection.id,
							size: "420x420",
						}}
					/>
				</div>
				{profileData && (
					<div className="connection-names text-overflow">
						<div className="connection-name text-overflow">
							{profileData.names.combinedName}
						</div>
						<div className="connection-username text-overflow">
							{getMessage("avatarItem.connectionsOwned.modal.body.item.username", {
								username: profileData.names.username,
							})}
						</div>
					</div>
				)}
			</a>
		</li>
	);
}
