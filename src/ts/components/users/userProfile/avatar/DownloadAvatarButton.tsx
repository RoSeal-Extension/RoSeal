import usePromise from "../../../hooks/usePromise";
import useProfileData from "../../../hooks/useProfileData";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { invokeMessage } from "src/ts/helpers/communication/dom";
import { getUser3dThumbnailDownloadData } from "src/ts/utils/avatar.inject";

export type Download3DAvatarButtonProps = {
	userId: number;
};

export default function Download3DAvatarButton({ userId }: Download3DAvatarButtonProps) {
	const profileData = useProfileData({
		userId,
	});
	const [downloadUrl] = usePromise(() => {
		if (import.meta.env.TARGET_BASE === "firefox") {
			return invokeMessage("user.avatar.getDownloadUrl", userId);
		}

		return getUser3dThumbnailDownloadData(userId);
	}, [userId]);

	if (!downloadUrl) return null;

	return (
		<a
			href={downloadUrl}
			download={`${profileData?.names.username ?? userId} avatar.zip`}
			className="download-avatar-file-btn roseal-user-profile-btn foundation-web-button"
		>
			<span>{getMessage("user.avatar.download3DAvatar")}</span>
		</a>
	);
}
