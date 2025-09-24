import { getUSDCurrencyConversions } from "src/ts/helpers/requests/services/misc";
import usePromise from "../hooks/usePromise";
import {
	getDeveloperExchangeMetadata,
	getUserDevExableRobuxAmount,
} from "src/ts/helpers/requests/services/account";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import { getDevExLink } from "src/ts/utils/links";
import Divider from "../core/Divider";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type DevExableRobuxAmountProps = {
	currency: string;
};

export default function DevExableRobuxAmount({ currency }: DevExableRobuxAmountProps) {
	const [usdConversionRate] = usePromise(
		() => getUSDCurrencyConversions().then((data) => data.usd[currency.toLowerCase()]),
		[currency],
	);
	const [devExRobuxAmount] = usePromise(() =>
		getUserDevExableRobuxAmount().then((data) => data.eligibleRobux),
	);
	const [robuxConversionRate] = usePromise(() =>
		getDeveloperExchangeMetadata().then((data) => data.conversionPercent),
	);

	if (!usdConversionRate || !devExRobuxAmount || !robuxConversionRate) return null;

	const amount = devExRobuxAmount * robuxConversionRate * usdConversionRate;

	return (
		<>
			<li className="rbx-menu-item-container">
				<a href={getDevExLink()} className="rbx-menu-item devex-button" target="_blank">
					<div className="devexable-currency">
						{getMessage("navigation.robux.devExable.text", {
							bold: (contents: string) => <b>{contents}</b>,
							currency: asLocaleString(amount, {
								style: "currency",
								currency,
							}),
						})}
					</div>
				</a>
			</li>
			<Divider />
		</>
	);
}
