import type { JSX } from "preact";
import type { RobuxUpsellPackage } from "src/ts/helpers/requests/services/account";
import SimpleModal from "../core/modal/SimpleModal";
import { getBuyRobuxLink, getBuyRobuxPackageLink, getRobloxTermsLink } from "src/ts/utils/links";
import RobuxView from "../core/RobuxView";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";

export type InsufficentRobuxModalProps = {
	robuxPackage?: RobuxUpsellPackage;
	priceInRobux?: number | null;
	userRobuxAmount?: number;
	itemName: string;
	thumbnail: JSX.Element;
	show: boolean;
	setShow: (open: boolean) => void;
};

export default function InsufficentRobuxModal({
	robuxPackage,
	priceInRobux,
	userRobuxAmount,
	itemName,
	thumbnail,
	show,
	setShow,
}: InsufficentRobuxModalProps) {
	const remaining = (priceInRobux ?? 0) - (userRobuxAmount ?? 0);
	return (
		<SimpleModal
			title={getMessage("insufficientFundsModal.title", {
				sealEmoji: SEAL_EMOJI_COMPONENT,
			})}
			buttons={[
				{
					type: "action",
					text: robuxPackage
						? getMessage("insufficientFundsModal.buttons.action.buyRobux")
						: getMessage("insufficientFundsModal.buttons.action.goToRobuxStore"),
					onClick: () => {
						setShow(false);
						location.href = robuxPackage
							? getBuyRobuxPackageLink(robuxPackage.robloxProductId)
							: getBuyRobuxLink();
					},
				},
				{
					type: "neutral",
					text: getMessage("insufficientFundsModal.buttons.neutral"),
					onClick: () => setShow(false),
				},
			]}
			show={show}
		>
			<div className="modal-top-body">
				<div className="modal-message">
					<div className="item-card-container item-preview">
						{thumbnail && <div className="item-card-thumb">{thumbnail}</div>}
						<div className="item-info text-name">
							<div className="text-overflow item-card-name">{itemName}</div>
							<RobuxView
								priceInRobux={priceInRobux}
								containerClassName="item-card-price"
							/>
						</div>
					</div>
				</div>
				<div className="modal-message-block text-center border-top">
					{getMessage("insufficientFundsModal.body", {
						remainingRobux: <RobuxView gray priceInRobux={remaining} />,
						hasRobuxPackage: robuxPackage !== undefined,
						robuxPackage: (
							<>
								{robuxPackage?.robuxAmountBeforeBonus !== undefined && (
									<RobuxView
										priceInRobux={robuxPackage.robuxAmountBeforeBonus}
										gray
										crossedOut
									/>
								)}
								<RobuxView priceInRobux={robuxPackage?.robuxAmount} />
							</>
						),
						lineBreak: <br />,
					})}
				</div>
				{robuxPackage && (
					<div className="modal-message-block text-center border-top modal-legal-footer">
						{getMessage("insufficientFundsModal.footer", {
							termsOfUseLink: (contents: string) => (
								<a
									className="text-link-secondary terms-of-use-link"
									target="_blank"
									rel="noreferrer"
									href={getRobloxTermsLink()}
								>
									{contents}
								</a>
							),
						})}
					</div>
				)}
			</div>
		</SimpleModal>
	);
}
