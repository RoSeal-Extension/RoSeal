import type { PrivateServerInventoryItem } from "src/ts/helpers/requests/services/inventory";
import { getConfigurePrivateServerLink } from "src/ts/utils/links";
import Thumbnail from "../core/Thumbnail";
import RobuxView from "../core/RobuxView";
import classNames from "classnames";
import { getRegularTime } from "src/ts/helpers/i18n/intlFormats";
import Button from "../core/Button";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type PrivateServerSubscriptionCardProps = PrivateServerInventoryItem & {
	setActive: (active: boolean) => void;
};

export default function PrivateServerSubscriptionCard({
	name,
	privateServerId,
	universeId,
	universeName,
	priceInRobux,
	expirationDate,
	active,
	setActive,
}: PrivateServerSubscriptionCardProps) {
	const isFreeServer = priceInRobux === null;

	return (
		<a className="subcard-container" href={getConfigurePrivateServerLink(privateServerId)}>
			<div className="subcard-icon-container">
				<Thumbnail
					imgClassName="subcard-icon"
					containerClassName="thumbnail-card-container"
					request={{
						type: "GameIcon",
						targetId: universeId,
						size: "420x420",
					}}
				/>
			</div>
			<div className="subcard-info">
				<div className="subcard-info-primary">
					<span className="subscription-name font-body">{name}</span>
					<span className="subscription-provider text-description">{universeName}</span>
				</div>
				<div className="subcard-info-secondary">
					<span className="robux-amount">
						{priceInRobux !== null ? (
							getMessage(
								"robloxSettings.privateServerSubscriptions.item.subscriptionPrice",
								{
									price: <RobuxView priceInRobux={priceInRobux} isForSale />,
									monthText: (contents: string) => (
										<span className="subscription-period text-description">
											{contents}
										</span>
									),
								},
							)
						) : (
							<RobuxView priceInRobux={priceInRobux} isForSale />
						)}
					</span>
					{priceInRobux !== null && (
						<span
							className={classNames("subscription-date text-description", {
								"text-alert": !active,
							})}
						>
							{getMessage(
								`robloxSettings.privateServerSubscriptions.item.${active ? "renews" : "expires"}`,
								{
									date: getRegularTime(expirationDate),
								},
							)}
						</span>
					)}
				</div>
			</div>
			<div className="subcard-btns">
				<Button
					type={active ? "alert" : "control"}
					className="subcard-action-btn"
					onClick={(e) => {
						e.preventDefault();

						setActive(!active);
					}}
				>
					{getMessage(
						`robloxSettings.privateServerSubscriptions.item.${active ? (isFreeServer ? "deactivate" : "cancel") : isFreeServer ? "reactivate" : "renew"}`,
					)}
				</Button>
			</div>
		</a>
	);
}
