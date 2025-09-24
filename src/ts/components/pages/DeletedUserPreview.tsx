import MdOutlineVisibility from "@material-symbols/svg-400/outlined/visibility-fill.svg";
import classNames from "classnames";
import { useMemo, useState } from "preact/hooks";
import { modifyTitle } from "src/ts/helpers/elements";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getCloudUserThumbnail } from "src/ts/helpers/requests/services/thumbnails";
import { getUserById } from "src/ts/helpers/requests/services/users";
import { getHomePageUrl, getRolimonsUserProfileLink, getUserProfileLink } from "src/ts/utils/links";
import { getResizeThumbnailUrl, parseResizeThumbnailUrl } from "src/ts/utils/thumbnails";
import type { AdvancedAvatarViewType } from "../avatar/AdvancedCustomizationButton";
import Button from "../core/Button";
import Page404 from "../core/errors/404";
import Loading from "../core/Loading";
import ThirdPartyLinkModal from "../core/ThirdPartyLinkModal";
import Thumbnail from "../core/Thumbnail";
import useFlag from "../hooks/useFlag";
import usePromise from "../hooks/usePromise";

export type DeletedUserProfilePreviewProps = {
	userId: number;
};

export default function DeletedUserProfilePreview({ userId }: DeletedUserProfilePreviewProps) {
	const [data, , error] = usePromise(
		() =>
			getUserById({
				userId,
			}).then((data) => {
				if (!data.isBanned) {
					window.location.href = getUserProfileLink(userId);
					return;
				}

				const url = getUserProfileLink(userId, undefined, true);
				if (window.location.pathname !== url) {
					window.history.replaceState(null, "", url);
				}

				modifyTitle(data.displayName);
				return data;
			}),
		[userId],
	);
	const [baseThumbnailUrl] = usePromise(async () => {
		let attempts = 5;
		while (attempts > 0) {
			attempts--;
			const data = await getCloudUserThumbnail({
				userId,
			});
			if (data.done && data.response?.imageUri) {
				const parsedThumbnail = parseResizeThumbnailUrl(data.response.imageUri);
				if (parsedThumbnail) {
					parsedThumbnail.modifier = "noFilter";

					return getResizeThumbnailUrl(parsedThumbnail);
				}
			}
		}
	}, [userId]);

	const [showRolimonsLinkModal, setShowRolimonsLinkModal] = useState(false);
	const [useHoverEffect, setUseHoverEffect] = useState(false);
	const [viewThumbnailType, setViewThumbnailType] =
		useState<AdvancedAvatarViewType>("AvatarHeadShot");

	const viewThumbnaiLUrl = useMemo(() => {
		if (!baseThumbnailUrl) return;

		if (viewThumbnailType === "AvatarHeadShot") return baseThumbnailUrl;

		return baseThumbnailUrl.replaceAll(/AvatarHeadShot/gi, viewThumbnailType);
	}, [viewThumbnailType, baseThumbnailUrl]);

	const showRolimonsLink = useFlag("hiddenAvatarAssets", "showRolimonsLink");

	if (error) return <Page404 />;
	if (!data) {
		return <Loading />;
	}

	return (
		<div className="deleted-user-container">
			<ThirdPartyLinkModal
				link={getRolimonsUserProfileLink(userId)}
				show={showRolimonsLinkModal}
				onClose={() => setShowRolimonsLinkModal(false)}
			/>
			<div className="deleted-user-info">
				<div className="deleted-user-preview">
					<Thumbnail
						containerProps={{
							onMouseLeave: () => setUseHoverEffect(false),
						}}
						containerClassName={classNames("deleted-preview-image", {
							"hover-effect": useHoverEffect,
						})}
						data={
							viewThumbnailType
								? {
										state: "Completed",
										imageUrl: viewThumbnaiLUrl,
									}
								: null
						}
					>
						<Button
							type="control"
							size="lg"
							className="toggle-thumbnail-type-btn"
							onClick={() => {
								if (viewThumbnailType === "Avatar") {
									setViewThumbnailType("AvatarBust");
								} else if (viewThumbnailType === "AvatarHeadShot") {
									setViewThumbnailType("Avatar");
								} else if (viewThumbnailType === "AvatarBust") {
									setViewThumbnailType("AvatarHeadShot");
								}
							}}
						>
							{getMessage(`deletedUser.thumbnailViews.${viewThumbnailType}`)}
						</Button>
						<button
							type="button"
							onClick={() => setUseHoverEffect(true)}
							className="hide-preview-image-btn roseal-btn"
						>
							<MdOutlineVisibility className="roseal-icon" />
						</button>
					</Thumbnail>
					<div className="preview-names">
						<h1 className="display-name">{data.displayName}</h1>
						<h2 className="user-name">
							{getMessage("deletedUser.usernameView", {
								username: data.name,
							})}
						</h2>
					</div>
				</div>
				<h2 className="deleted-title">{getMessage("deletedUser.title")}</h2>
				<span className="text deleted-preview-text">
					{getMessage("deletedUser.body", {
						showRolimonsLink,
						rolimonsLink: (contents: string) => (
							<a
								href={getRolimonsUserProfileLink(userId)}
								className="text-link"
								onClick={(e) => {
									e.preventDefault();
									setShowRolimonsLinkModal(true);
								}}
							>
								{contents}
							</a>
						),
					})}
				</span>
				<div className="action-btns">
					<Button
						as="a"
						className="back-btn"
						type="primary"
						onClick={() => history.back()}
					>
						{getMessage("deletedUser.buttons.back")}
					</Button>
					<Button as="a" className="home-btn" type="control" href={getHomePageUrl()}>
						{getMessage("deletedUser.buttons.home")}
					</Button>
				</div>
			</div>
		</div>
	);
}
