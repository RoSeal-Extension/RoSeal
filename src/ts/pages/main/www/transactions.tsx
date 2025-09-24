import { signal } from "@preact/signals";
import PrivateServersVisibilityButton from "src/ts/components/transactions/PrivateServersButton";
import UserRobuxHistoryChart from "src/ts/components/transactions/UserRobuxHistoryChart";
import { DEVEX_RATES } from "src/ts/constants/devexRates";
import {
	PERSIST_TRANSACTIONS_SELECTION_LOCALSTORAGE_KEY,
	TRANSACTION_NAVIGATION_ITEMS,
} from "src/ts/constants/misc";
import { getLangNamespace } from "src/ts/helpers/domInvokes";
import { watch } from "src/ts/helpers/elements";
import { featureValueIs, getFeatureValue } from "src/ts/helpers/features/helpers";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { getUSDCurrencyConversions } from "src/ts/helpers/requests/services/misc";
import { getLocalStorage, setLocalStorage } from "src/ts/helpers/storage";
import currentUrl from "src/ts/utils/currentUrl";
import { TRANSACTIONS_REGEX } from "src/ts/utils/regex";
import { renderAppend } from "src/ts/utils/render";

type NavHashArr = [string, string?, string?, string?];

export default {
	id: "transactions",
	regex: [TRANSACTIONS_REGEX],
	css: ["css/transactions.css"],
	fn: () => {
		const splitHash = currentUrl.value.url.hash.split("#!/")[1]?.split("/");
		const currentNavHash = signal<NavHashArr>((splitHash as NavHashArr) || ["Summary"]);
		let shouldPersist: boolean | undefined;

		const updateHashStorage = (value: NavHashArr) => {
			currentNavHash.value = value;

			const hashArr = [...value];
			for (let i = hashArr.length; i > 0; i--) {
				if (!hashArr[i - 1]) {
					hashArr.pop();
				} else {
					break;
				}
			}

			location.hash = `#!/${hashArr.join("/")}`;
			if (shouldPersist)
				setLocalStorage(PERSIST_TRANSACTIONS_SELECTION_LOCALSTORAGE_KEY, value);
		};

		featureValueIs("robuxHistoryChart", true, () =>
			watch("#transactions-web-app div.summary", (summary) => {
				renderAppend(<UserRobuxHistoryChart />, summary);
			}),
		);

		getFeatureValue("transactionsDevExRate").then((data) => {
			if (!data?.[0]) return;

			const currency = data[1];
			getUSDCurrencyConversions().then((conversions) => {
				const rate = conversions.usd[currency.toLowerCase()];
				if (!currency) return;

				watch(".roseal-devex-transaction-amount", (data) => {
					const devexAmount = Math.abs(
						Number.parseInt(data.dataset.devexAmount || "0", 10),
					);
					const createdDate = new Date(data.dataset.createdDate || "").getTime();

					let devexRate: number | undefined;

					for (const item of DEVEX_RATES) {
						if (item.time <= createdDate) {
							devexRate = item.rate;
							break;
						}
					}

					if (!devexRate) return;

					const inLocalCurrency = asLocaleString(devexAmount * devexRate * rate, {
						style: "currency",
						currency,
					});

					renderAppend(
						<span className="devex-currency-amount">({inLocalCurrency})</span>,
						data,
					);
				});
			});
		});

		featureValueIs("transactionsHidePrivateServersToggle", true, () => {
			const showPrivateServers = signal(true);

			watch(".user-transactions-container .dropdown-container", (el) => {
				renderAppend(
					<PrivateServersVisibilityButton
						showPrivateServers={showPrivateServers}
						navState={currentNavHash}
						updateNav={(value) => {
							const newValue = currentNavHash.value.slice(0, 2) as NavHashArr;
							newValue[3] = value;

							updateHashStorage(newValue);
						}}
					/>,
					el,
				);
			});
		});

		featureValueIs("myTransactionsHashNav", true, async () => {
			const translations = await getLangNamespace("Feature.Transactions");

			shouldPersist = await getFeatureValue(
				"myTransactionsHashNav.persistTransactionsSelection",
			);

			if (shouldPersist && !splitHash?.length) {
				const value = getLocalStorage<NavHashArr>(
					PERSIST_TRANSACTIONS_SELECTION_LOCALSTORAGE_KEY,
				);
				if (value?.length) {
					updateHashStorage(value);
				}
			}

			for (const [selectionIndex, selection] of TRANSACTION_NAVIGATION_ITEMS.entries()) {
				watch(selection, (el) => {
					let key: string | undefined;
					for (const key2 in translations) {
						if (translations[key2] === el.textContent) {
							key = key2.split(".").at(-1)?.replace("TransactionType", "");
						}
					}

					if (!key) {
						key = el.textContent?.match(/\d+/)?.[0];

						if (!key) {
							return;
						}
					}

					if (key === currentNavHash.value[selectionIndex]) {
						el.click();
					}

					el.addEventListener("click", () => {
						const newValue = (
							selectionIndex === 0 ? [key] : currentNavHash.value
						) as NavHashArr;

						if (selectionIndex !== 0) {
							newValue[selectionIndex] = key;
						}
						updateHashStorage(newValue);
					});
				});
			}
		});
	},
} satisfies Page;
