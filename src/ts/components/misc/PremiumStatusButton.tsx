import MdOutlineCircle from "@material-symbols/svg-400/outlined/circle-fill.svg";

import { getUserSubscriptionsDetails } from "src/ts/helpers/requests/services/account";
import Icon from "../core/Icon";
import Tooltip from "../core/Tooltip";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";
import { useEffect, useMemo, useState } from "preact/hooks";
import { getLocalStorage, getTimedStorage, setLocalStorage } from "src/ts/helpers/storage";
import {
	PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
	PREMIUM_MEMBERSHIP_STATUS_SESSION_CACHE_STORAGE_KEY,
	BC_ROBUX_STIPEND_AMOUNTS,
} from "src/ts/constants/misc";
import { asLocaleString, getShortRelativeTime } from "src/ts/helpers/i18n/intlFormats";
import RobuxView from "../core/RobuxView";
import { getPremiumMembershipLink, getRobloxSettingsLink } from "src/ts/utils/links";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import classNames from "classnames";
import { differenceInDays } from "date-fns";

export default function PremiumStatusButton() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [lastOpened, setLastOpened] = useState<Date>();
	const [alertCircleDismissed, setAlertCircleDismissed] = useState(false);
	const [subscription, subscriptionLoaded] = usePromise(() => {
		if (!authenticatedUser) return;

		return getTimedStorage(
			PREMIUM_MEMBERSHIP_STATUS_SESSION_CACHE_STORAGE_KEY,
			"session",
			60_000,
			() =>
				getUserSubscriptionsDetails({
					userId: authenticatedUser.userId,
				}),
			authenticatedUser.userId,
		);
	}, [authenticatedUser?.userId]);

	useEffect(() => {
		if (!authenticatedUser) return;

		const data = getLocalStorage<Record<string, number>>(
			PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
		);

		const lastOpened = data?.[authenticatedUser.userId];
		if (!lastOpened && !subscription) {
			return setLastOpened(undefined);
		}

		setLastOpened(lastOpened ? new Date(lastOpened) : new Date());
	}, [authenticatedUser?.userId, subscription]);

	const isLegacyBC =
		!!subscription &&
		BC_ROBUX_STIPEND_AMOUNTS.includes(subscription.subscriptionProductModel.robuxStipendAmount);

	const expiresSoon = useMemo(() => {
		if (!subscription?.subscriptionProductModel.expiration) return false;

		return (
			differenceInDays(
				new Date(subscription.subscriptionProductModel.expiration),
				new Date(),
			) <= 3
		);
	}, [subscription?.subscriptionProductModel.expiration]);
	const showAlertCircle =
		(!subscription && lastOpened) ||
		(expiresSoon &&
			subscription &&
			(!lastOpened ||
				differenceInDays(
					new Date(subscription.subscriptionProductModel.expiration),
					lastOpened,
				) <= 3));

	return (
		subscriptionLoaded &&
		(subscription || lastOpened) && (
			<Tooltip
				placement="bottom"
				as="span"
				containerId="premium-status-info"
				containerClassName="navbar-icon-item"
				includeContainerClassName={false}
				trigger="click"
				className="premium-status-info-tooltip"
				button={
					<button
						type="button"
						className="btn-generic-navigation"
						onClick={() => {
							const data =
								getLocalStorage(
									PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
								) ?? {};

							if (showAlertCircle) {
								setAlertCircleDismissed(true);
							}
							if (!subscription) {
								setLocalStorage(
									PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
									{
										...data,
										[authenticatedUser!.userId]: undefined,
									},
								);
							} else {
								setLocalStorage(
									PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
									{
										...data,
										[authenticatedUser!.userId]: Date.now(),
									},
								);
							}
						}}
					>
						<span id="nav-premium-status-icon" className="rbx-menu-item">
							<Icon name="premium" size="medium" />
						</span>
						{showAlertCircle && !alertCircleDismissed && (
							<span id="nav-premium-status-icon-dot" className="rbx-menu-item">
								<MdOutlineCircle className="roseal-icon" />
							</span>
						)}
					</button>
				}
			>
				<div className="container-header">
					<span>
						{getMessage(
							`navigation.premiumStatus.title.${!subscription ? "expired" : "active"}`,
						)}
					</span>
				</div>
				{subscription && (
					<div className="premium-info">
						<div className="font-bold text-emphasis">
							<span>
								{isLegacyBC
									? getMessage("navigation.premiumStatus.planName.daily", {
											robuxStipend: (
												<RobuxView
													priceInRobux={
														subscription.subscriptionProductModel
															.robuxStipendAmount
													}
												/>
											),
										})
									: getMessage("navigation.premiumStatus.planName.monthly", {
											robuxStipend: asLocaleString(
												subscription.subscriptionProductModel
													.robuxStipendAmount,
											),
										})}
							</span>
						</div>
						<div
							className={classNames({
								"text-error": expiresSoon,
							})}
						>
							{subscription.subscriptionProductModel.isLifetime
								? getMessage("navigation.premiumStatus.lifetime")
								: getMessage(
										`navigation.premiumStatus.${subscription.subscriptionProductModel.renewal ? "renews" : "expires"}`,
										{
											time: getShortRelativeTime(
												subscription.subscriptionProductModel.expiration ||
													subscription.subscriptionProductModel.renewal!,
											),
										},
									)}
						</div>
					</div>
				)}
				<ul className="help-links">
					<li className="help-link">
						<a className="text-link" href={getPremiumMembershipLink()}>
							{getMessage("navigation.premiumStatus.links.premium")}
						</a>
					</li>
					<li className="help-link">
						<a className="text-link" href={getRobloxSettingsLink("subscriptions")}>
							{getMessage("navigation.premiumStatus.links.subscriptions")}
						</a>
					</li>
				</ul>
			</Tooltip>
		)
	);
}
