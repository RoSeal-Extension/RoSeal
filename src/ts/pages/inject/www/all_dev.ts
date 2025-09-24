import { watchOnce } from "src/ts/helpers/elements";
import { hijackResponse } from "src/ts/helpers/hijack/fetch";
import type { Page } from "src/ts/helpers/pages/handleMainPages";

export default {
	id: "dev/all",
	isAllPages: true,
	fn: () => {
		// Debug robux stuff

		const robuxToFakeOrSomething = 999999999999999;

		watchOnce("#ItemPurchaseAjaxData").then((el) => {
			el.setAttribute("data-user-balance-robux", robuxToFakeOrSomething.toString());
		});

		hijackResponse(async (req, res) => {
			if (req.url.includes("/transaction-types")) {
				return new Response(
					JSON.stringify({
						HasPurchase: true,
						HasSale: true,
						HasAffiliatePayout: true,
						HasAffiliateSale: true,
						HasGroupPayout: true,
						HasCurrencyPurchase: true,
						HasTradeRobux: true,
						HasPremiumStipend: true,
						HasEngagementPayout: true,
						HasGroupEngagementPayout: true,
						HasAdSpend: true,
						HasDevEx: true,
						HasPendingRobux: true,
						HasIndividualToGroup: true,
						HasCSAdjustment: true,
						HasAdsRevsharePayout: true,
						HasGroupAdsRevsharePayout: true,
						HasSubscriptionsRevsharePayout: true,
						HasGroupSubscriptionsRevsharePayout: true,
						HasPublishingAdvanceRebates: true,
						HasLicensingPayment: true,
					}),
					res,
				);
			}

			if (req.url.includes("DevEx")) {
				return new Response(
					JSON.stringify({
						previousPageCursor: null,
						nextPageCursor: null,
						data: [
							{
								id: 0,
								idHash: "AAAAAA",
								transactionType: "Cash Out",
								created: "2029-12-01T00:00:00.0000Z",
								isPending: false,
								agent: { id: 1, type: "User", name: "Roblox" },
								details: { status: "Completed" },
								currency: { amount: -999999999, type: "Robux" },
								purchaseToken: null,
							},
						],
					}),
					res,
				);
			}
		});

		hijackResponse(async (req, res) => {
			if (req.url.includes("/currency")) {
				return new Response(JSON.stringify({ robux: robuxToFakeOrSomething }), res);
			}

			if (req.url.includes("/my/settings/json")) {
				return new Response(
					JSON.stringify({
						...(await res?.clone().json()),
						RobuxRemainingForUsernameChange: 0,
					}),
					res,
				);
			}
		});

		/*
		watchOnce(".configure-webapps-container .minimize-control").then((el) => {
			el.click();
		});

		
		hijackFunction(
			document,
			(target, thisArg, args) => {
				const [id] = args;
				if (id === "web-app-configuration-enabled") {
					return "True" as unknown as HTMLElement;
				}

				return target.apply(thisArg, args);
			},
			"getElementById",
		);*/
	},
} satisfies Page;
