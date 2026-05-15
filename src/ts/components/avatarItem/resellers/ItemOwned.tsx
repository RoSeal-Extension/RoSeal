import MdOutlineOpenInNewFilled from "@material-symbols/svg-400/outlined/open_in_new-fill.svg";
import { useState } from "preact/hooks";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getAbsoluteTime, getRegularTime } from "src/ts/helpers/i18n/intlFormats";
import { getRolimonsCIIIDLink, getRolimonsUAIDLink } from "src/ts/utils/links";
import ThirdPartyLinkModal from "../../core/ThirdPartyLinkModal";
import Tooltip from "../../core/Tooltip";
import useFlag from "../../hooks/useFlag";

export type AvatarItemResellerOwnedProps = {
	isLimited: boolean;
	isUGC: boolean;
	isBundle: boolean;
	item?: {
		addTime?: string;
		userAssetId?: number;
		collectibleItemInstanceId?: string;
	};
};

export default function AvatarItemResellerOwned({
	isLimited,
	isUGC,
	isBundle,
	item,
}: AvatarItemResellerOwnedProps) {
	const [showRolimonsLinkModal, setShowRolimonsLinkModal] = useState(false);
	const showRolimonsLinkEnabled = useFlag("thirdParties", "showRolimonsLink");
	const rolimonsLink = item?.userAssetId
		? getRolimonsUAIDLink(item.userAssetId)
		: item?.collectibleItemInstanceId && getRolimonsCIIIDLink(item?.collectibleItemInstanceId);
	const rolimonsLinkComponent = (contents: string) => (
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
	);

	const showRolimonsLink = showRolimonsLinkEnabled && !!rolimonsLink && isLimited && !isUGC;


	if (isBundle && !showRolimonsLink) return null;

	if (!item?.addTime && !rolimonsLink && !isBundle)
		return (
			<div className="owned-since-date">
				<span className="font-caption-body">
					{getMessage("avatarItem.resellers.item.privateInventory", {
						showRolimonsLink: false,
						rolimonsLink: rolimonsLinkComponent,
						separator: undefined,
					})}
				</span>
			</div>
		);

	const inner = (
		<span className="font-caption-body">
			{showRolimonsLinkEnabled && rolimonsLink && (
				<ThirdPartyLinkModal
					link={rolimonsLink}
					show={showRolimonsLinkModal}
					onClose={() => setShowRolimonsLinkModal(false)}
				/>
			)}
			{isBundle &&
				showRolimonsLink &&
				rolimonsLinkComponent(getMessage("avatarItem.resellers.item.viewOnRolimons"))}
			{!isBundle &&
				getMessage(
					item?.addTime
						? "avatarItem.resellers.item.ownedSince"
						: "avatarItem.resellers.item.privateInventory",
					{
						date: item?.addTime ? getRegularTime(item.addTime) : undefined,
						separator: <span className="separator">-</span>,
						showRolimonsLink: showRolimonsLink,
						rolimonsLink: rolimonsLinkComponent,
					},
				)}
		</span>
	);

	if (item?.addTime)
		return (
			<Tooltip
				as="div"
				includeContainerClassName={false}
				containerClassName="owned-since-date"
				button={inner}
			>
				{getAbsoluteTime(item.addTime)}
			</Tooltip>
		);

	return <div className="owned-since-date">{inner}</div>;
}
