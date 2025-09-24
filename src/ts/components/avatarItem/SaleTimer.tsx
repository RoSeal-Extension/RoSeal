import Icon from "../core/Icon.tsx";
import useCountdown from "../hooks/useCountdown.ts";
import { getMessage } from "../../helpers/i18n/getMessage.ts";
import { getAbsoluteTime } from "../../helpers/i18n/intlFormats.ts";
import {
	multigetAvatarItems,
	multigetCollectibleItemsByIds,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace.ts";
import usePromise from "../hooks/usePromise.ts";

export type SaleTimeProps = {
	itemId: number;
	itemType: MarketplaceItemType;
	refresh: () => void;
};

export default function SaleTimer({ itemType, itemId, refresh }: SaleTimeProps) {
	const [deadline] = usePromise(
		() =>
			multigetAvatarItems({
				items: [
					{
						id: itemId,
						itemType,
					},
				],
			})
				.then((data) => {
					const item = data[0];
					const time = item?.offSaleDeadline;

					if (time) {
						return new Date(time);
					}

					if (item.collectibleItemId) {
						return multigetCollectibleItemsByIds({
							itemIds: [item.collectibleItemId],
						}).then((data) => {
							const collectibleItem = data[0];
							if (collectibleItem.offSaleDeadline) {
								return new Date(collectibleItem.offSaleDeadline);
							}
						});
					}
				})
				.then((timer) => {
					if (timer && timer.getTime() > Date.now()) {
						return timer;
					}
				}),
		[itemId, itemType],
	);
	const [countdown, countdownFinished] = useCountdown(deadline, () => {
		setTimeout(refresh, 1_000);
	});

	return (
		<>
			{deadline && !countdownFinished && (
				<div
					id="roseal-sale-timer"
					className="text-error"
					title={getAbsoluteTime(deadline)}
				>
					<Icon name="red-timer" size="16x16" />
					<span className="sale-timer-text">
						{getMessage("avatarItem.saleTimer", {
							countdown,
						})}
					</span>
				</div>
			)}
		</>
	);
}
