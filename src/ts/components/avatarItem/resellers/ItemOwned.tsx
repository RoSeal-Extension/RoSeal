import useFlag from "../../hooks/useFlag";
import ThirdPartyLinkModal from "../../core/ThirdPartyLinkModal";
import { getAbsoluteTime, getRegularTime } from "src/ts/helpers/i18n/intlFormats";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getRolimonsUAIDLink } from "src/ts/utils/links";
import Tooltip from "../../core/Tooltip";
import { useState } from "preact/hooks";
import MdOutlineOpenInNewFilled from "@material-symbols/svg-400/outlined/open_in_new-fill.svg";

export type AvatarItemResellerOwnedProps = {
	isLimited: boolean;
	isUGC: boolean;
	item?: {
		addTime?: string;
		userAssetId?: number;
	};
};

export default function AvatarItemResellerOwned({
	isLimited,
	isUGC,
	item,
}: AvatarItemResellerOwnedProps) {
	const [showRolimonsLinkModal, setShowRolimonsLinkModal] = useState(false);
	const showRolimonsLink = useFlag("hiddenAvatarAssets", "showRolimonsLink");

	const rolimonsLink = item?.userAssetId && getRolimonsUAIDLink(item.userAssetId);

	if (!item?.addTime)
		return (
			<div className="owned-since-date">
				<span className="font-caption-body">
					{getMessage("avatarItem.resellers.item.privateInventory")}
				</span>
			</div>
		);

	return (
		<Tooltip
			as="div"
			includeContainerClassName={false}
			containerClassName="owned-since-date"
			button={
				<span className="font-caption-body">
					{showRolimonsLink && rolimonsLink && (
						<ThirdPartyLinkModal
							link={rolimonsLink}
							show={showRolimonsLinkModal}
							onClose={() => setShowRolimonsLinkModal(false)}
						/>
					)}
					{getMessage("avatarItem.resellers.item.ownedSince", {
						date: getRegularTime(item.addTime),
						separator: <span className="separator">-</span>,
						showRolimonsLink:
							showRolimonsLink &&
							item.userAssetId !== undefined &&
							isLimited &&
							!isUGC,
						rolimonsLink: (contents: string) => (
							<a
								className="text-link rolimons-asset-link"
								href={rolimonsLink as string}
								target="_blank"
								rel="noreferrer"
								onClick={(el) => {
									el.preventDefault();
									setShowRolimonsLinkModal(true);
								}}
							>
								{contents}
								<MdOutlineOpenInNewFilled className="roseal-icon" />
							</a>
						),
					})}
				</span>
			}
		>
			{getAbsoluteTime(item.addTime)}
		</Tooltip>
	);
}
