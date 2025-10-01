import { useEffect, useState } from "preact/hooks";
import { addMessageListener, sendMessage } from "src/ts/helpers/communication/dom";
import {
	setWearingAssets,
	type AvatarAssetDefinitionWithTypes,
} from "src/ts/helpers/requests/services/avatar";
import { warning } from "../core/systemFeedback/helpers/globalSystemFeedback";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import CurrentlyWearingItem from "./CurrentlyWearingItem";

export default function AvatarEditorCurrentlyWearing() {
	const [currentlyWearing, setCurrentlyWearing] = useState<AvatarAssetDefinitionWithTypes[]>([]);

	useEffect(
		() =>
			addMessageListener("avatar.avatarUpdated", (avatar) =>
				setCurrentlyWearing(avatar.assets),
			),
		[],
	);

	return (
		<ul id="currently-wearing-items" className="hlist item-cards-stackable roseal-scrollbar">
			{currentlyWearing.map((item) => (
				<CurrentlyWearingItem
					key={item.id}
					assetId={item.id}
					assetName={item.name}
					removeItem={() => {
						const oldAssets = [...currentlyWearing];
						const newAssets = [...currentlyWearing];
						for (let i = 0; i < newAssets.length; i++) {
							if (newAssets[i]?.id === item.id) {
								newAssets.splice(i, 1);
								i--;
							}
						}

						sendMessage("avatar.updateAssets", newAssets);
						setWearingAssets({
							assets: newAssets,
						}).catch(() => {
							// failed
							warning(getMessage("avatar.currentlyWearing.systemFeedback.error"));
							sendMessage("avatar.updateAssets", oldAssets);
							setCurrentlyWearing(oldAssets);
						});
					}}
				/>
			))}
		</ul>
	);
}
