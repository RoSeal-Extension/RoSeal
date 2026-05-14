import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { createShareLink } from "src/ts/helpers/requests/services/sharelinks";
import { getRoSealFriendInviteLink } from "src/ts/utils/links";
import Button from "../core/Button";
import Loading from "../core/Loading";
import Tooltip from "../core/Tooltip";

export type CreateFriendLinkButtonProps = {
	disabled?: boolean;
};

export default function CreateFriendLinkButton({ disabled }: CreateFriendLinkButtonProps) {
	const [loading, setLoading] = useState(false);
	const [fetchedLink, setFetchedLink] = useState(false);

	return (
		<Tooltip
			containerClassName="create-friend-link-btn"
			button={
				<Button
					type="secondary"
					disabled={disabled}
					onClick={() => {
						setLoading(true);
						setFetchedLink(false);

						navigator.clipboard.write([
							new ClipboardItem({
								"text/plain": createShareLink({
									linkType: "FriendInvite",
								}).then((data) => {
									setLoading(false);
									setFetchedLink(true);

									return new Blob([getRoSealFriendInviteLink(data.linkId)], {
										type: "text/plain",
									});
								}),
							}),
						]);
					}}
				>
					{getMessage("friends.linkButton.buttonText")}
				</Button>
			}
		>
			<div className="create-friend-link-tooltip">
				{loading ? (
					<Loading />
				) : (
					getMessage(`friends.linkButton.tooltip.${fetchedLink ? "success" : "default"}`)
				)}
			</div>
		</Tooltip>
	);
}
