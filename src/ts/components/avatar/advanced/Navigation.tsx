import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import Thumbnail from "../../core/Thumbnail";
import Thumbnail3d from "../../core/Thumbnail3d";
import type { AdvancedCurrentPage } from "../AdvancedCustomizationButton";

export type ThumbnailNavigationProps = {
	userId: number;
	currentPage: AdvancedCurrentPage;
	setCurrentPage: (
		setState: AdvancedCurrentPage | ((currentPage: AdvancedCurrentPage) => AdvancedCurrentPage),
	) => void;
};

export default function ThumbnailNavigation({
	userId,
	currentPage,
	setCurrentPage,
}: ThumbnailNavigationProps) {
	const hideBust = currentPage.type === "thumbnails";

	return (
		<div className="thumbnail-navigation-container border-bottom">
			<div
				className={classNames("thumbnail-preview-container avatar-back", {
					"thumbnail-2d-preview-container": currentPage.viewDimensionType === "2D",
					"thumbnail-3d-preview-container":
						currentPage.viewType === "Avatar" && currentPage.viewDimensionType === "3D",
					"cut-out": currentPage.viewType === "AvatarHeadShot",
				})}
			>
				{currentPage.viewType === "Avatar" && currentPage.viewDimensionType === "3D" ? (
					<Thumbnail3d
						containerClassName="thumbnail-preview thumbnail-3d-preview"
						data={{
							type: "Avatar",
							userId,
							refreshId: currentPage.refreshId,
						}}
					/>
				) : (
					<Thumbnail
						request={{
							type: currentPage.viewType,
							size: "420x420",
							targetId: userId,
							refreshId: currentPage.refreshId,
						}}
						containerClassName="thumbnail-preview"
					/>
				)}
				{currentPage.viewType === "Avatar" && (
					<Button
						type="primary"
						size="lg"
						width="default"
						className="enable-three-dee"
						onClick={() => {
							setCurrentPage({
								...currentPage,
								viewDimensionType:
									currentPage.viewDimensionType === "2D" ? "3D" : "2D",
							});
						}}
					>
						{getMessage(
							`avatar.advanced.thumbnailPreview.${currentPage.viewDimensionType}`,
						)}
					</Button>
				)}
			</div>
			<div className="thumbnail-navigation">
				<div
					className={classNames("avatar avatar-headshot-xs avatar-selection", {
						selected: currentPage.viewType === "Avatar",
					})}
					onClick={() => {
						setCurrentPage({
							...currentPage,
							viewType: "Avatar",
						});
					}}
				>
					<Thumbnail
						request={{
							type: "Avatar",
							size: "420x420",
							targetId: userId,
							refreshId: currentPage.refreshId,
						}}
						containerClassName="avatar-card-image"
					/>
				</div>
				<div
					className={classNames("avatar avatar-headshot-xs avatar-headshot-selection", {
						selected: currentPage.viewType === "AvatarHeadShot",
					})}
					onClick={() => {
						setCurrentPage({
							...currentPage,
							viewType: "AvatarHeadShot",
						});
					}}
				>
					<Thumbnail
						request={{
							type: "AvatarHeadShot",
							size: "420x420",
							targetId: userId,
							refreshId: currentPage.refreshId,
						}}
						containerClassName="avatar-card-image"
					/>
				</div>
				{!hideBust && (
					<div
						className={classNames("avatar avatar-headshot-xs avatar-bust-selection", {
							selected: currentPage.viewType === "AvatarBust",
						})}
						onClick={() => {
							setCurrentPage({
								...currentPage,
								viewType: "AvatarBust",
							});
						}}
					>
						<Thumbnail
							request={{
								type: "AvatarBust",
								size: "420x420",
								targetId: userId,
								refreshId: currentPage.refreshId,
							}}
							containerClassName="avatar-card-image"
						/>
					</div>
				)}
			</div>
		</div>
	);
}
