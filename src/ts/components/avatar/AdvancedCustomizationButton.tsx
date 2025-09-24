import { useEffect, useState } from "preact/hooks";
import { sendMessage } from "src/ts/helpers/communication/dom";
import type { Agent } from "src/ts/helpers/requests/services/assets";
import {
	type AvatarAssetDefinitionWithTypes,
	getAuthenticatedUserAvatar,
	getAvatarRules,
} from "src/ts/helpers/requests/services/avatar";
import { onWindowRefocus } from "src/ts/utils/dom";
import Button from "../core/Button";
import Icon from "../core/Icon";
import SimpleModal from "../core/modal/SimpleModal";
import TabsContainer from "../core/tab/Container";
import TabNavs from "../core/tab/Navs";
import SimpleTabNav from "../core/tab/SimpleNav";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import AssetConfiguration from "./advanced/AssetConfiguration";
import ThumbnailsCustomization from "./advanced/ThumbnailsCustomization";
import { AssetsList } from "./advanced/AssetsList";
import ThumbnailNavigation from "./advanced/Navigation";
import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type AdvancedWornAsset = AvatarAssetDefinitionWithTypes & {
	creator: {
		id: number;
		type: Agent;
	};
	name: string;
};

export type AdvancedAvatarViewType = "Avatar" | "AvatarHeadShot" | "AvatarBust";

export type AdvancedAvatarViewDimensionType = "2D" | "3D";
export type AdvancedCurrentPage =
	| {
			type: "thumbnails" | "assets";
			refreshId: number;
			viewType: AdvancedAvatarViewType;
			viewDimensionType: AdvancedAvatarViewDimensionType;
	  }
	| {
			type: "asset";
			refreshId: number;
			viewType: AdvancedAvatarViewType;
			viewDimensionType: AdvancedAvatarViewDimensionType;
			data: AdvancedWornAsset;
	  };

export type AdvancedCustomizationModalProps = {
	show: boolean;
	setShow: (show: boolean) => void;
};
export function AdvancedCustomizationModal({ show, setShow }: AdvancedCustomizationModalProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [currentPage, setCurrentPage] = useState<AdvancedCurrentPage>({
		type: "assets",
		refreshId: 0,
		viewType: "Avatar",
		viewDimensionType: "2D",
	});
	const [avatar, , avatarError, refetchAvatar, setAvatar] = usePromise(
		getAuthenticatedUserAvatar,
		[show],
		false,
	);
	const [avatarRules] = usePromise(getAvatarRules);

	useEffect(() => {
		if (show) {
			setCurrentPage({
				type: "assets",
				refreshId: currentPage.refreshId + 1,
				viewType: currentPage.viewType,
				viewDimensionType: "2D",
			});
		} else {
			sendMessage("avatar.refreshThumbnail", undefined);
		}
	}, [show]);

	useEffect(() => {
		if (currentPage.type === "asset" && currentPage.data && avatar?.assets) {
			const asset = avatar.assets.find((asset) => asset.id === currentPage.data.id);
			if (!asset) {
				setCurrentPage({
					...currentPage,
					type: "assets",
				});
			}
		}
	}, [avatar?.assets]);

	useEffect(
		() =>
			onWindowRefocus(10_000, () => {
				refetchAvatar();
				setCurrentPage((currentPage) => ({
					...currentPage,
					refreshId: currentPage.refreshId + 1,
				}));
			}),
		[],
	);

	const incrementRefreshId = () => {
		setCurrentPage((currentPage) => ({
			...currentPage,
			refreshId: currentPage.refreshId + 1,
		}));
	};

	return (
		<SimpleModal
			className="advanced-customization-modal"
			title={
				<>
					{currentPage.type === "asset" && (
						<Icon
							name="left"
							className="back-arrow"
							onClick={() => {
								setCurrentPage({
									...currentPage,
									type: "assets",
								});
							}}
						/>
					)}
					<span className="page-name">
						{getMessage(
							`avatar.advanced.title.${currentPage.type === "asset" ? "asset" : "other"}`,
							{
								sealEmoji: SEAL_EMOJI_COMPONENT,
							},
						)}
					</span>
				</>
			}
			show={show}
			onClose={() => setShow(false)}
		>
			{currentPage.type !== "asset" && (
				<TabsContainer className="nav-links-container">
					<TabNavs className="nav-links">
						<SimpleTabNav
							id="assets"
							title={getMessage("avatar.advanced.tabs.assets")}
							active={currentPage.type === "assets"}
							link={false}
							onClick={() => {
								setCurrentPage({
									...currentPage,
									type: "assets",
								});
							}}
						/>
						<SimpleTabNav
							id="thumbnails"
							title={getMessage("avatar.advanced.tabs.thumbnails")}
							active={currentPage.type === "thumbnails"}
							link={false}
							onClick={() => {
								setCurrentPage({
									...currentPage,
									type: "thumbnails",
									viewType:
										currentPage.viewType === "AvatarBust"
											? "Avatar"
											: currentPage.viewType,
								});
							}}
						/>
					</TabNavs>
				</TabsContainer>
			)}
			{authenticatedUser && (
				<ThumbnailNavigation
					userId={authenticatedUser.userId}
					currentPage={currentPage}
					setCurrentPage={setCurrentPage}
				/>
			)}
			<div
				className={classNames("page-container", {
					"max-size": currentPage.type !== "asset",
				})}
			>
				{currentPage.type === "thumbnails" && (
					<ThumbnailsCustomization
						incrementRefreshId={incrementRefreshId}
						viewType={
							currentPage.viewType as Exclude<AdvancedAvatarViewType, "AvatarBust">
						}
					/>
				)}
				{currentPage.type === "asset" && avatar && (
					<AssetConfiguration
						asset={currentPage.data}
						updatePageData={(data) => {
							setCurrentPage({
								...currentPage,
								data,
							});
						}}
						incrementRefreshId={incrementRefreshId}
						avatar={avatar}
						setAvatar={setAvatar}
						avatarRules={avatarRules}
					/>
				)}
				{currentPage.type === "assets" && (
					<AssetsList
						incrementRefreshId={incrementRefreshId}
						setAssetData={(data) => {
							setCurrentPage({
								...currentPage,
								type: "asset",
								data,
							});
						}}
						avatar={avatar}
						avatarHasError={!!avatarError}
						setAvatar={setAvatar}
						avatarRules={avatarRules}
					/>
				)}
			</div>
		</SimpleModal>
	);
}

export default function AdvancedAvatarCustomizationButton() {
	const [showModal, setShowModal] = useState(false);
	/*
	const setShowModal = (show: boolean) => {
		_setShowModal(show);

		const url = new URL(location.href);

		const hasParam = url.searchParams.has("advancedCustomization");
		if (show) {
			if (hasParam) return;
			url.searchParams.set("advancedCustomization", "true");
		} else {
			url.searchParams.delete("advancedCustomization");
		}

		history.replaceState(null, "", url.toString());
	};

	useEffect(() => {
		const search = new URLSearchParams(location.search);
		if (search.get("advancedCustomization") === "true") {
			setShowModal(true);
		}
	}, []);*/

	return (
		<>
			<AdvancedCustomizationModal show={showModal} setShow={setShowModal} />
			<Button
				id="advanced-customization-btn"
				onClick={() => setShowModal(true)}
				type="secondary"
			>
				{getMessage("avatar.advanced.button", {
					sealEmoji: SEAL_EMOJI_COMPONENT,
				})}
			</Button>
		</>
	);
}
