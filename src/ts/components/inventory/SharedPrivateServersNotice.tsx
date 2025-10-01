import { useEffect, useState } from "preact/hooks";
import { SEAL_EMOJI_COMPONENT } from "src/ts/constants/preact";
import { addMessageListener } from "src/ts/helpers/communication/dom";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export default function SharedPrivateServersNotice() {
	const [showViewPrivateServers, setShowViewPrivateServers] = useState(false);
	useEffect(() => {
		addMessageListener("user.inventory.canViewInventory", (data) => {
			setShowViewPrivateServers(data.isPrivateServersTab);
		});
	}, []);

	if (!showViewPrivateServers) {
		return null;
	}

	return (
		<div className="inventory-category-notice section section-content">
			<div className="notice-title">
				<h4>
					{getMessage("userInventory.sharedPrivateServersNotice.title", {
						sealEmoji: SEAL_EMOJI_COMPONENT,
					})}
				</h4>
			</div>
			<div className="notice-content">
				<p>{getMessage("userInventory.sharedPrivateServersNotice.description")}</p>
			</div>
		</div>
	);
}
