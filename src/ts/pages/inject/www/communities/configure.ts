import { signal } from "@preact/signals";
import type { ComponentChildren } from "preact";
import { addMessageListener } from "src/ts/helpers/communication/dom";
import { featureValueIsInject } from "src/ts/helpers/features/helpersInject";
import { hijackCreateElement } from "src/ts/helpers/hijack/react";
import type { Page } from "src/ts/helpers/pages/handleMainPages";
import { GROUP_CONFIGURE_REGEX } from "src/ts/utils/regex";

export default {
	id: "community.configure",
	regex: [GROUP_CONFIGURE_REGEX],
	fn: () => {
		featureValueIsInject("communityTransactionsPageSize", true, () => {
			const pageSizeSignal = signal(10);

			hijackCreateElement(
				(_type, props) => {
					return props !== null && "transactionType" in props && "pageSize" in props;
				},
				(createElement, type, props, ...children) => {
					return createElement(() => {
						const [pageSize, setPageSize] = window.React.useState(pageSizeSignal.value);

						window.React.useEffect(
							() =>
								addMessageListener("transactions.setPageSize", (pageSize) => {
									setPageSize(pageSize);
									pageSizeSignal.value = pageSize;
								}),
							[],
						);

						// @ts-expect-error: nuh uh
						props.pageSize = pageSize;

						return createElement(
							type,
							props as Record<string, string>,
							...(children as ComponentChildren[]),
						);
					}, {});
				},
			);
		});
	},
} satisfies Page;
