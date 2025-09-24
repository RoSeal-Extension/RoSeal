import { getAvatarItem } from "src/ts/helpers/requests/services/marketplace";
import usePromise from "../hooks/usePromise";
import ItemField from "../core/items/ItemField";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type BundleRecolorableFieldProps = {
	bundleId: number;
};

export default function BundleRecolorableField({ bundleId }: BundleRecolorableFieldProps) {
	const [recolorable] = usePromise(() => {
		return getAvatarItem({
			itemType: "Bundle",
			itemId: bundleId,
		}).then((data) => data?.isRecolorable);
	}, [bundleId]);

	return (
		<ItemField title={getMessage("avatarItem.recolorable")} id="item-recolorable-field">
			<span id="recolorable-content" className="font-body text">
				{getMessage(`avatarItem.recolorable.${recolorable ? "yes" : "no"}`)}
			</span>
		</ItemField>
	);
}
