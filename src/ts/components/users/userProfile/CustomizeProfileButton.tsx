import {
	PROFILE_BACKGROUND_ASSETS,
	type ProfileBackgroundAsset,
} from "src/ts/constants/robloxAssets";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import Button from "../../core/Button";
import type { Signal } from "@preact/signals";
import Popover from "../../core/Popover";
import MdOutlineBlock from "@material-symbols/svg-400/outlined/block-fill.svg";
import classNames from "classnames";
import { useCallback } from "preact/hooks";
import { updateProfileCustomization } from "src/ts/helpers/requests/services/users";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type CustomizeProfileButtonProps = {
	selectedBackground: Signal<ProfileBackgroundAsset | undefined>;
	container: HTMLElement;
};

export default function CustomizeProfileButton({
	selectedBackground,
	container,
}: CustomizeProfileButtonProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const setSelectedBackground = useCallback(
		(background?: ProfileBackgroundAsset) => {
			if (!authenticatedUser?.userId) return;

			selectedBackground.value = background;
			updateProfileCustomization({
				profileCustomization: {
					customizedComponents: {
						profileBackground: {
							assetId: background?.modelAssetId ?? -1,
						},
					},
					profileEntity: {
						type: "User",
						id: authenticatedUser.userId.toString(),
					},
				},
			});
		},
		[authenticatedUser?.userId],
	);

	return (
		<Popover
			trigger="click"
			button={
				<button type="button" className="roseal-user-profile-btn">
					<span>{getMessage("user.customize.buttonText")}</span>
				</button>
			}
			className="customize-profile-container"
			container={container}
		>
			<ul className="color-options">
				<li
					className={classNames("color-option-container", {
						"is-selected": !selectedBackground.value,
					})}
				>
					<button
						type="button"
						className="roseal-btn color-option"
						onClick={() => setSelectedBackground()}
					>
						<MdOutlineBlock className="roseal-icon" />
					</button>
				</li>
				{PROFILE_BACKGROUND_ASSETS.map((background) => (
					<li
						key={background.hex}
						className={classNames("color-option-container", {
							"is-selected": selectedBackground.value === background,
						})}
					>
						<button
							type="button"
							className="roseal-btn color-option"
							style={{
								"--color": background.hex,
							}}
							onClick={() => setSelectedBackground(background)}
						/>
					</li>
				))}
			</ul>
		</Popover>
	);
}
