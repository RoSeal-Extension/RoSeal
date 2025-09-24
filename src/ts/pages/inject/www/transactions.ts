import type { Attributes, ComponentChildren, ComponentType } from "preact";
import { watch } from "src/ts/helpers/elements.ts";
import {
	featureValueIsInject,
	getFeatureValueInject,
} from "src/ts/helpers/features/helpersInject.ts";
import { getFlagInject } from "src/ts/helpers/flags/flagsInject.ts";
import { hijackCreateElement, hijackState } from "src/ts/helpers/hijack/react.ts";
import type { Page } from "src/ts/helpers/pages/handleMainPages.ts";
import type { Transaction, UserTransaction } from "src/ts/helpers/requests/services/account.ts";
import { getDeveloperProductDetailsLink } from "src/ts/utils/links.ts";
import { GROUP_CONFIGURE_REGEX, TRANSACTIONS_REGEX } from "src/ts/utils/regex.ts";
import { addMessageListener } from "../../../helpers/communication/dom.ts";

const DEV_PRODUCT_REGEX = /DEVPRODUCT_(\d+)_(\d+)_(.+)/;

export default {
	id: "transactions",
	regex: [TRANSACTIONS_REGEX, GROUP_CONFIGURE_REGEX],
	fn: () => {
		watch<HTMLElement>(
			"#transactions-page-container tr .text-overflow, #group-transactions-container tr .text-overflow, .transactions-container .item-card-name",
			(element) => {
				if (element.textContent?.includes("HIDE_TRANSACTION")) {
					element.closest<HTMLElement>("tr, li")?.style.setProperty("display", "none");
				}
			},
		);

		let enableFreeItems = false;
		let enablePrivateServers = false;
		let enableViewDeveloperProducts = false;

		const filterItems = (transactions: Transaction<"Purchase" | "Sale">[]) => {
			const items = transactions.filter((item) => {
				if (
					enableViewDeveloperProducts &&
					(item.transactionType === "Purchase" || item.transactionType === "Sale")
				) {
					if (
						item.details?.type === "DeveloperProduct" &&
						!item.details.name?.startsWith("DEVPRODUCT_")
					) {
						item.details.name = `DEVPRODUCT_${item.details.id}_${item.details.place!.universeId}_${item.details.name}`;
					}
				}
				if (enableFreeItems && item.currency.amount === 0) return false;
				if (enablePrivateServers && item.details?.type === "PrivateServer") return false;

				return true;
			});

			if (items.length === 0 && transactions.length !== 0) {
				items.push({
					transactionType: "Sale",
					currency: { amount: 0, type: "Robux" },
					details: {
						name: "HIDE_TRANSACTION",
					},
				} as unknown as Transaction<"Purchase">);
			}

			return items;
		};

		let oldState: Transaction<"Purchase">[] | undefined;
		let setState: ((value: unknown) => void) | undefined;

		hijackState({
			matches: (value) => Array.isArray(value) && value[0]?.transactionType,
			setState: ({ value, publicSetState }) => {
				setState = publicSetState;
				oldState = value.current as Transaction<"Purchase">[];

				return filterItems(value.current as Transaction<"Purchase">[]);
			},
			onlyFromSiteUpdate: true,
		});

		addMessageListener("transactions.setHideFreeItems", (enabled) => {
			enableFreeItems = enabled;

			if (oldState) setState?.(filterItems(oldState));
		});

		addMessageListener("transactions.setHidePrivateServers", (enabled) => {
			enablePrivateServers = enabled;

			if (oldState) setState?.(filterItems(oldState));
		});

		getFeatureValueInject("transactionsDevExRate").then((data) => {
			if (!data?.[0]) return;

			hijackCreateElement(
				(_, props) =>
					props !== null &&
					"transaction" in props &&
					typeof props.transaction === "object" &&
					props.transaction !== null &&
					"transactionType" in props.transaction &&
					props.transaction.transactionType === "Cash Out" &&
					"amount" in props,
				(createElement, type, props, ...children) => {
					const propsType = props as {
						transaction: UserTransaction;
					};
					return createElement(
						"span",
						{
							className: "roseal-devex-transaction-amount",
							"data-devex-amount": propsType.transaction.currency.amount,
							"data-created-date": propsType.transaction.created,
						},
						// @ts-expect-error: blah blah blah
						createElement(type, props, children),
					);
				},
			);
		});

		featureValueIsInject("viewExperienceDeveloperProducts", true, () => {
			getFlagInject("developerProducts", "overrideTransactionsLink").then((value) => {
				if (value) {
					enableViewDeveloperProducts = true;

					hijackCreateElement(
						(_, __, child) =>
							typeof child === "string" && DEV_PRODUCT_REGEX.test(child),
						(createElement, type, props, child, ...other) => {
							const [, id, name] = (child as string).match(DEV_PRODUCT_REGEX)!;
							const content = (child as string).replace(DEV_PRODUCT_REGEX, "$3");

							const url = getDeveloperProductDetailsLink(
								Number.parseInt(id, 10),
								name,
							);
							if (props && "url" in props) {
								props.url = url;
							} else {
								return createElement(
									"a" as unknown as ComponentType,
									{
										className: "text-link text-overflow",
										href: url,
									} as Attributes,
									content,
									...(other as ComponentChildren[]),
								);
							}

							return createElement(
								type as ComponentType,
								props,
								content,
								...(other as ComponentChildren[]),
							);
						},
					);
					if (oldState) setState?.(filterItems(oldState));
				}
			});
		});
	},
} satisfies Page;
