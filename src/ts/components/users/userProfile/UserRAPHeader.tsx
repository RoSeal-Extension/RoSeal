import usePromise from "../../hooks/usePromise";
import { abbreviateNumber, asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import SocialHeader from "./SocialHeader";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { useState } from "preact/hooks";
import SimpleModal from "../../core/modal/SimpleModal";
import useProfileData from "../../hooks/useProfileData";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import UserRAPItem from "./UserRAPItem";
import SocialHeaderV2 from "./SocialHeaderV2";
import type { ListedUserCollectibleAsset } from "src/ts/helpers/requests/services/inventory";

export type UserRAPHeaderProps = {
	userId: number;
	useV2?: boolean;
	allCollectiblesPromise: Promise<ListedUserCollectibleAsset[]>;
};

export default function UserRAPHeader({
	userId,
	useV2,
	allCollectiblesPromise,
}: UserRAPHeaderProps) {
	const profileData = useProfileData({
		userId,
	});
	const [showCollectiblesModal, setShowCollectiblesModal] = useState(false);
	const [alllCollectibles, allCollectiblesFetched] = usePromise(
		() => allCollectiblesPromise,
		[userId],
	);
	const [userRAP] = usePromise(() => {
		if (!alllCollectibles) {
			if (allCollectiblesFetched) return 0;
			return;
		}

		let rap = 0;
		for (const item of alllCollectibles) {
			rap += item.recentAveragePrice;
		}

		return rap;
	}, [alllCollectibles, allCollectiblesFetched]);

	const countDisplay =
		userRAP !== undefined && userRAP !== null ? abbreviateNumber(userRAP) : "...";
	const fullCount = userRAP !== undefined && userRAP !== null ? asLocaleString(userRAP) : "...";

	const Component = useV2 ? SocialHeaderV2 : SocialHeader;

	return (
		<>
			<Component
				title={getMessage("user.header.social.rap")}
				alt={getMessage("user.header.social.rap.alt", {
					count: fullCount,
				})}
				value={countDisplay}
				className="roseal-rap-value"
				onClick={
					alllCollectibles?.length ? () => setShowCollectiblesModal(true) : undefined
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
						<UserRAPItem key={item.userAssetId} item={item} />
					))}
				</ul>
			</SimpleModal>
		</>
	);
}
