import { getMessage } from "src/ts/helpers/i18n/getMessage";
import useProfileData from "../../hooks/useProfileData";
import Button from "../../core/Button";

export type BlockedScreenProps = {
	userId: number;
	onViewClick: () => void;
};

export default function BlockedScreen({ userId, onViewClick }: BlockedScreenProps) {
	const profileData = useProfileData({
		userId,
	});

	return (
		<div className="item-blocked-screen user-blocked-screen">
			<div className="item-blocked user-blocked">
				<h2 className="block-title">
					{getMessage("user.viewBlocked.title", {
						username: profileData?.names.username ?? "",
					})}
				</h2>
				<span className="text block-view-text">
					{getMessage("user.viewBlocked.message", {
						username: profileData?.names.username ?? "",
					})}
				</span>
				<div className="action-btns">
					<Button className="view-btn" onClick={onViewClick}>
						{getMessage("user.viewBlocked.view")}
					</Button>
				</div>
			</div>
		</div>
	);
}
