import MdOutlineCircle from "@material-symbols/svg-400/outlined/circle-fill.svg";
import classNames from "classnames";
import { differenceInDays } from "date-fns";
import { useEffect, useMemo, useState } from "preact/hooks";
import {
	BC_ROBUX_STIPEND_AMOUNTS,
	PLUS_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
	PREMIUM_MEMBERSHIP_STATUS_SESSION_CACHE_STORAGE_KEY,
	PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
	ROBLOX_MEMBERSHIP_STATUS_SESSION_CACHE_STORAGE_KEY,
} from "src/ts/constants/misc";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { asLocaleString, getShortRelativeTime } from "src/ts/helpers/i18n/intlFormats";
import {
	getUserSubscriptionsDetails,
	listUserSubscriptions,
} from "src/ts/helpers/requests/services/account";
import { getLocalStorage, getTimedStorage, setLocalStorage } from "src/ts/helpers/storage";
import {
	getPlusMembershipLink,
	getPremiumMembershipLink,
	getRobloxSettingsLink,
} from "src/ts/utils/links";
import Icon from "../core/Icon";
import RobuxView from "../core/RobuxView";
import Tooltip from "../core/Tooltip";
import useAuthenticatedUser from "../hooks/useAuthenticatedUser";
import usePromise from "../hooks/usePromise";

export default function PremiumStatusButton() {
	const [authenticatedUser] = useAuthenticatedUser();
	const [lastOpenedPlus, setLastOpenedPlus] = useState<Date>();
	const [lastOpenedPremium, setLastOpenedPremium] = useState<Date>();
	const [alertCircleDismissed, setAlertCircleDismissed] = useState(false);
	const [premiumSubscription, premiumSubscriptionLoaded] = usePromise(() => {
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
	const [plusSubscription, plusSubscriptionLoaded] = usePromise(() => {
		if (!authenticatedUser) return;

		return getTimedStorage(
			ROBLOX_MEMBERSHIP_STATUS_SESSION_CACHE_STORAGE_KEY,
			"session",
			60_000,
			() =>
				listUserSubscriptions({
					productType: "Blackbird",
					resultsPerPage: 1,
				}).then((data) => data.subscriptions[0]),
			authenticatedUser.userId,
		);
	}, [authenticatedUser?.userId]);

	useEffect(() => {
		if (!authenticatedUser) return;

		const plusData = getLocalStorage<Record<string, number>>(
			PLUS_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
		);
		const premiumData = getLocalStorage<Record<string, number>>(
			PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
		);

		const plusOpened = plusData?.[authenticatedUser.userId];
		const premiumOpened = premiumData?.[authenticatedUser.userId];

		if (
			plusOpened === undefined &&
			premiumOpened === undefined &&
			!(premiumSubscription || plusSubscription)
		) {
			setLastOpenedPlus(undefined);
			setLastOpenedPremium(undefined);
			return;
		}

		setLastOpenedPlus(plusOpened ? new Date(plusOpened) : undefined);
		setLastOpenedPremium(premiumOpened ? new Date(premiumOpened) : undefined);
	}, [authenticatedUser?.userId, premiumSubscription, plusSubscription]);

	const hasLegacyBC =
		!!premiumSubscription &&
		BC_ROBUX_STIPEND_AMOUNTS.includes(
			premiumSubscription.subscriptionProductModel.robuxStipendAmount,
		);

	// Plus takes priority over Premium (for icon display)
	const isPlus = !!plusSubscription;
	const isPremium = !!premiumSubscription && !isPlus;

	const premiumExpiresSoon = useMemo(() => {
		if (!premiumSubscription?.subscriptionProductModel.expiration) return false;

		return (
			differenceInDays(
				new Date(premiumSubscription.subscriptionProductModel.expiration),
				new Date(),
			) <= 3
		);
	}, [premiumSubscription?.subscriptionProductModel.expiration]);
	const plusExpiresSoon = useMemo(() => {
		if (!plusSubscription?.expirationTimestampMs || plusSubscription?.nextRenewalTimestampMs)
			return false;

		return differenceInDays(new Date(plusSubscription.expirationTimestampMs), new Date()) <= 3;
	}, [plusSubscription?.expirationTimestampMs]);

	const showAlertCircle =
		(isPlus &&
			((!plusSubscription && lastOpenedPlus) ||
				(plusExpiresSoon &&
					plusSubscription &&
					(!lastOpenedPlus ||
						differenceInDays(
							new Date(plusSubscription.expirationTimestampMs!),
							lastOpenedPlus,
						) <= 3)))) ||
		(isPremium &&
			((!premiumSubscription && lastOpenedPremium) ||
				(premiumExpiresSoon &&
					premiumSubscription &&
					(!lastOpenedPremium ||
						differenceInDays(
							new Date(premiumSubscription.subscriptionProductModel.expiration || 0),
							lastOpenedPremium,
						) <= 3))));

	return (
		premiumSubscriptionLoaded &&
		plusSubscriptionLoaded &&
		(premiumSubscription || plusSubscription || lastOpenedPlus || lastOpenedPremium) && (
			<Tooltip
				placement="bottom"
				as="span"
				containerId="subscription-status-info"
				containerClassName="navbar-icon-item"
				includeContainerClassName={false}
				trigger="click"
				className="subscription-status-info-tooltip"
				button={
					<button
						type="button"
						className="btn-generic-navigation"
						onClick={() => {
							const plusData =
								getLocalStorage<Record<string, number | undefined>>(
									PLUS_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
								) ?? {};
							const premiumData =
								getLocalStorage<Record<string, number | undefined>>(
									PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
								) ?? {};

							if (showAlertCircle) {
								setAlertCircleDismissed(true);
							}

							if (isPlus) {
								plusData[authenticatedUser!.userId] = plusSubscription
									? Date.now()
									: undefined;
								setLocalStorage(
									PLUS_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
									plusData,
								);
							}

							if (isPremium) {
								premiumData[authenticatedUser!.userId] = premiumSubscription
									? Date.now()
									: undefined;
								setLocalStorage(
									PREMIUM_STATUS_BUTTON_ACKNOWLEDGED_LOCALSTORAGE_KEY,
									premiumData,
								);
							}
						}}
					>
						<span id="nav-subscription-status-icon" className="rbx-menu-item">
							{isPlus ? (
								<span className="icon-regular-roblox-plus icon roseal-icon" />
							) : (
								<Icon name="premium" size="medium" />
							)}
						</span>
						{showAlertCircle && !alertCircleDismissed && (
							<span id="nav-subscription-status-icon-dot" className="rbx-menu-item">
								<MdOutlineCircle className="roseal-icon" />
							</span>
						)}
					</button>
				}
			>
				{plusSubscription && (
					<div className="subscription-info-container">
						<div className="container-header">
							<span>
								{getMessage(
									`navigation.premiumStatus.plus.title.${!plusSubscription ? "expired" : "active"}`,
								)}
							</span>
						</div>
						<div className="subscription-info">
							<div className="font-bold text-emphasis">
								<span className="plan-name">
									{getMessage("navigation.premiumStatus.plus.planName")}
								</span>
							</div>
							<div
								className={classNames({
									"text-error": plusExpiresSoon,
								})}
							>
								{getMessage(
									`navigation.premiumStatus.plus.${plusSubscription.nextRenewalTimestampMs ? "renews" : "expires"}`,
									{
										time: getShortRelativeTime(
											plusSubscription.nextRenewalTimestampMs ||
												plusSubscription.expirationTimestampMs ||
												0,
										),
									},
								)}
							</div>
						</div>
					</div>
				)}
				{premiumSubscription && (
					<div className="subscription-info-container">
						<div className="container-header">
							<span>
								{getMessage(
									`navigation.premiumStatus.title.${!premiumSubscription ? "expired" : "active"}`,
								)}
							</span>
						</div>
						<div className="subscription-info">
							<div className="font-bold text-emphasis">
								<span className="plan-name">
									{hasLegacyBC
										? getMessage("navigation.premiumStatus.planName.daily", {
												robuxStipend: (
													<RobuxView
														priceInRobux={
															premiumSubscription
																.subscriptionProductModel
																.robuxStipendAmount
														}
													/>
												),
											})
										: getMessage("navigation.premiumStatus.planName.monthly", {
												robuxStipend: asLocaleString(
													premiumSubscription.subscriptionProductModel
														.robuxStipendAmount,
												),
											})}
								</span>
							</div>
							<div
								className={classNames({
									"text-error": premiumExpiresSoon,
								})}
							>
								{premiumSubscription.subscriptionProductModel.isLifetime
									? getMessage("navigation.premiumStatus.lifetime")
									: getMessage(
											`navigation.premiumStatus.${premiumSubscription.subscriptionProductModel.renewal ? "renews" : "expires"}`,
											{
												time: getShortRelativeTime(
													premiumSubscription.subscriptionProductModel
														.expiration ||
														premiumSubscription.subscriptionProductModel
															.renewal!,
												),
											},
										)}
							</div>
						</div>
					</div>
				)}
				<ul className="help-links">
					{isPlus && (
						<li className="help-link">
							<a className="text-link" href={getPlusMembershipLink()}>
								{getMessage("navigation.premiumStatus.links.plus")}
							</a>
						</li>
					)}
					{premiumSubscription && (
						<li className="help-link">
							<a className="text-link" href={getPremiumMembershipLink()}>
								{getMessage("navigation.premiumStatus.links.premium")}
							</a>
						</li>
					)}
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
