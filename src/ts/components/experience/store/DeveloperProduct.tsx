import classNames from "classnames";
import { getMessage } from "src/ts/helpers/i18n/getMessage.ts";
import { asLocaleString } from "src/ts/helpers/i18n/intlFormats.ts";
import type { PendingDeveloperProductTransaction } from "src/ts/helpers/requests/services/developerProducts.ts";
import { getDeveloperProductDetailsLink } from "src/ts/utils/links.ts";
import RobuxView from "../../core/RobuxView.tsx";
import Thumbnail from "../../core/Thumbnail.tsx";

export type DeveloperProductPropsDetails = {
	productId: number | null;
	created: string;
	updated: string;
	developerProductId: number;
	displayName: string;
	displayIcon?: number | null;
	priceInRobux: number | null;
	isForSale: boolean;
	universeId: number;
};

export type DeveloperProductProps = DeveloperProductPropsDetails & {
	pendingTransactions?: PendingDeveloperProductTransaction[];
};

export default function DeveloperProduct({
	displayName,
	displayIcon,
	priceInRobux,
	isForSale,
	pendingTransactions,
	universeId,
	productId,
}: DeveloperProductProps) {
	return (
		<div className="store-card">
			<a
				href={getDeveloperProductDetailsLink(universeId, productId!)}
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
