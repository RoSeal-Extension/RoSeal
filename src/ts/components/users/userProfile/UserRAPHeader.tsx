import { listAllUserCollectibleItems } from "src/ts/utils/assets";
import usePromise from "../../hooks/usePromise";
import { abbreviateNumber, asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import SocialHeader from "./SocialHeader";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useState } from "preact/hooks";
import SimpleModal from "../../core/modal/SimpleModal";
import useProfileData from "../../hooks/useProfileData";
import { getAvatarAssetLink } from "src/ts/utils/links";
import RobuxView from "../../core/RobuxView";
import Thumbnail from "../../core/Thumbnail";
import Icon from "../../core/Icon";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type UserRAPHeaderProps = {
	userId: number;
};

export default function UserRAPHeader({ userId }: UserRAPHeaderProps) {
	const profileData = useProfileData({
		userId,
	});
	const [showCollectiblesModal, setShowCollectiblesModal] = useState(false);
	const [alllCollectibles] = usePromise(() => listAllUserCollectibleItems(userId), [userId]);
	const [userRAP] = usePromise(() => {
		if (!alllCollectibles) return;

		let rap = 0;
		for (const item of alllCollectibles) {
			rap += item.recentAveragePrice;
		}

		return rap;
	}, [alllCollectibles]);

	if (userRAP === null || userRAP === undefined) return null;

	const countDisplay = abbreviateNumber(userRAP);
	if (!countDisplay) return null;

	return (
		<>
			<SocialHeader
				title={getMessage("user.header.social.rap")}
				alt={getMessage("user.header.social.rap.alt", {
					count: asLocaleString(userRAP),
				})}
				value={countDisplay}
				className="roseal-rap-value"
				onClick={
					alllCollectibles?.length === 0
						? undefined
						: () => setShowCollectiblesModal(true)
				}
			/>
			<SimpleModal
				show={showCollectiblesModal}
				size="lg"
				title={getMessage("user.header.social.rap.modal.title", {
					displayName: profileData?.names.combinedName ?? "",
					count: asLocaleString(alllCollectibles?.length ?? 0),
					countNum: alllCollectibles?.length ?? 0,
					sealEmoji: SEAL_EMOJI_COMPONENT,
				})}
				className="roseal-user-collectibles-list-modal"
				onClose={() => setShowCollectiblesModal(false)}
			>
				<ul className="hlist item-cards roseal-scrollbar">
					{alllCollectibles?.map((item) => (
						<li className="list-item item-card">
							<div className="item-card-container">
								<a href={getAvatarAssetLink(item.assetId, item.name)}>
									<div className="item-card-link">
										<div className="item-card-thumb-container">
											<Thumbnail
												request={{
													type: "Asset",
													targetId: item.assetId,
													size: "420x420",
												}}
											/>
											<div className="limited-icon-container">
												<Icon name="shop-limited" />
												{item.serialNumber !== undefined &&
													item.serialNumber !== null && (
														<span className="font-caption-header text-subheader limited-number">
															{getMessage(
																"user.header.social.rap.modal.body.item.serialNumber",
																{
																	serialNumber: asLocaleString(
																		item.serialNumber,
																	),
																},
															)}
														</span>
													)}
											</div>
										</div>
									</div>
									<div className="item-card-caption">
										<div className="item-card-name-link">
											<div className="item-card-name" title={item.name}>
												{item.name}
											</div>
											<RobuxView
												priceInRobux={item.recentAveragePrice}
												containerClassName="text-overflow item-card-price"
											/>
										</div>
									</div>
								</a>
							</div>
						</li>
					))}
				</ul>
			</SimpleModal>
		</>
	);
}
