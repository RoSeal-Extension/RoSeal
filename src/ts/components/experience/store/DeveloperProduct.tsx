import RobuxView from "../../core/RobuxView.tsx";
import classNames from "classnames";
import Thumbnail from "../../core/Thumbnail.tsx";
import { getDeveloperProductDetailsLink } from "src/ts/utils/links.ts";
import type { PendingDeveloperProductTransaction } from "src/ts/helpers/requests/services/developerProducts.ts";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";

export type DeveloperProductPropsDetails = {
	productId: number | null;
	created: string;
	updated: string;
	developerProductId: number;
	displayName: string;
	displayIcon?: number | null;
	priceInRobux: number | null;
	isForSale: boolean;
};

export type DeveloperProductProps = DeveloperProductPropsDetails & {
	pendingTransactions?: PendingDeveloperProductTransaction[];
};

export default function DeveloperProduct({
	developerProductId,
	displayName,
	displayIcon,
	priceInRobux,
	isForSale,
	pendingTransactions,
}: DeveloperProductProps) {
	return (
		<div className="store-card">
			<a
				href={getDeveloperProductDetailsLink(developerProductId, displayName)}
				className="gear-passes-asset store-card-link"
			>
				<Thumbnail
					containerClassName="store-card-image"
					request={
						!displayIcon
							? undefined
							: {
									type: "Asset",
									isImageAsset: true,
									targetId: displayIcon,
									size: "150x150",
								}
					}
				/>
			</a>
			<div className="store-card-caption">
				<div className="text-overflow store-card-name" title={displayName}>
					{displayName}
				</div>
				<div
					className={classNames("store-card-price", {
						offsale: !priceInRobux,
					})}
				>
					<RobuxView
						priceInRobux={priceInRobux}
						useGrouping={false}
						isForSale={isForSale}
					/>
				</div>
				{pendingTransactions?.length ? (
					<div className="store-card-pending-transactions small text">
						{getMessage("experience.developerProducts.item.pendingTransactions", {
							count: asLocaleString(pendingTransactions.length),
							countNum: pendingTransactions.length,
						})}
					</div>
				) : null}
			</div>
		</div>
	);
}
