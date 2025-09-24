import { getMessage } from "src/ts/helpers/i18n/getMessage";
import Button from "../../core/Button";
import classNames from "classnames";
import { sendMessage } from "src/ts/helpers/communication/dom";
import type { RobloxSharedExperiencePass } from "src/ts/helpers/requests/services/roseal";
import SharedPassModal from "./SharedPassModal";
import { useState } from "preact/hooks";
import type { PassProductInfo } from "src/ts/helpers/requests/services/passes";

export type PassPurchaseButtonProps = {
	disabled?: boolean;
	displayIcon?: number;
	passName?: string;
	passProductId?: number;
	passExpectedPrice?: number | null;
	passExpectedSellerId?: number | null;
	passExpectedSellerName?: string | null;
	isOwned?: boolean;
	productDetails?: PassProductInfo;
	sharedDetails?: RobloxSharedExperiencePass;
};

export default function PassPurchaseButton({
	disabled: _disabled,
	displayIcon,
	passName,
	passProductId,
	passExpectedPrice,
	passExpectedSellerId,
	passExpectedSellerName,
	isOwned,
	productDetails,
	sharedDetails,
}: PassPurchaseButtonProps) {
	const [showSharedPassModal, setShowSharedPassModal] = useState(false);
	const disabled = _disabled || !passExpectedPrice;

	const robloxData = disabled
		? {}
		: {
				"data-item-id": displayIcon,
				"data-item-name": passName,
				"data-product-id": passProductId,
				"data-expected-price": passExpectedPrice,
				"data-asset-type": "Game Pass",
				"data-expected-seller-id": passExpectedSellerId,
				"data-seller-name": passExpectedSellerName,
				"data-expected-currency": 1,
			};

	const buyPass = (e?: MouseEvent) => {
		if (!passProductId) return;

		e?.stopPropagation();
		sendMessage("experience.store.promptPurchase", passProductId);
	};

	return (
		<Button
			className={classNames("rbx-gear-passes-purchase", {
				PurchaseButton: !disabled,
				"shared-details-button": sharedDetails,
			})}
			type="buy"
			width="full"
			disabled={disabled}
			onClick={sharedDetails ? () => setShowSharedPassModal(true) : buyPass}
			{...robloxData}
		>
			{sharedDetails && productDetails && (
				<SharedPassModal
					show={showSharedPassModal}
					isOwned={isOwned}
					sharedDetails={sharedDetails}
					productDetails={productDetails}
					setShow={setShowSharedPassModal}
					buyPass={buyPass}
				/>
			)}
			{getMessage(`experience.passes.item.${sharedDetails ? "details" : "buy"}`)}
		</Button>
	);
}
