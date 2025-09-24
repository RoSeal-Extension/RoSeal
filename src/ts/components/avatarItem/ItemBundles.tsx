import { getItemBundles } from "src/ts/helpers/requests/services/marketplace";
import Thumbnail from "../core/Thumbnail";
import { getAvatarBundleLink, getAvatarMarketplaceLink } from "src/ts/utils/links";
import RobuxView from "../core/RobuxView";
import classNames from "classnames";
import Button from "../core/Button";
import usePromise from "../hooks/usePromise";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import { getMessage } from "src/ts/helpers/i18n/getMessage";
import { getBundleTypeData } from "src/ts/utils/itemTypes";

export type ItemBundlesProps = {
	assetId: number;
};

export default function ItemBundles({ assetId }: ItemBundlesProps) {
	const [bundles] = usePromise(() => {
		return getAssetById({
			assetId,
		}).then((data) => {
			if (
				data?.productType &&
				(!(data.creator.creatorTargetId === 1 && data.creator.creatorType === "User") ||
					data.isForSale ||
					data.isPublicDomain)
			) {
				return;
			}

			return getItemBundles({
				assetId,
				limit: 10,
			}).then((data) => data.data);
		});
	}, [assetId]);

	if (!bundles?.length) {
		return null;
	}

	const hasMultipleBundles = bundles.length > 1;
	const bundle = bundles[0];

	return (
		<div
			id="item-bundles"
			className={classNames({
				"stack-o-bundles": hasMultipleBundles,
			})}
		>
			{hasMultipleBundles ? (
				<>
					<div className="bundle-stack">
						{bundles.map((bundle) => (
							<a
								key={bundle.id}
								className="bundle-stack-item item-card-link"
								href={getAvatarBundleLink(bundle.id, bundle.name)}
							>
								<Thumbnail
									key={bundle.id}
									containerClassName="bundle-stack-thumbnail"
									request={{
										targetId: bundle.id,
										type: "BundleThumbnail",
										size: "150x150",
									}}
								/>
							</a>
						))}
					</div>
					<div className="bundle-text text">
						{getMessage("avatarItem.itemBundles.multipleBundles")}
					</div>
					<div className="bundle-text">
						<a
							href={getAvatarMarketplaceLink(getBundleTypeData(1)?.searchQuery)}
							className="text-link"
						>
							{getMessage("avatarItem.itemBundles.searchBundles")}
						</a>
					</div>
				</>
			) : (
				<>
					<a
						href={getAvatarBundleLink(bundle.id, bundle.name)}
						className="bundle-item item-card-link"
					>
						<Thumbnail
							containerClassName="bundle-thumbnail"
							request={{
								targetId: bundles[0].id,
								type: "BundleThumbnail",
								size: "150x150",
							}}
						/>
					</a>
					<div className="bundle-text text">
						{getMessage("avatarItem.itemBundles.partOf", {
							hasPrice:
								(bundle.collectibleItemDetail
									? bundle.collectibleItemDetail.saleStatus === "OnSale" &&
										bundle.collectibleItemDetail.collectibleItemType ===
											"NonLimited"
									: bundle.product?.isForSale ||
										bundle.product?.isPublicDomain) ?? false,
							price: (
								<RobuxView
									priceInRobux={
										bundle.collectibleItemDetail
											? bundle.collectibleItemDetail.price
											: bundle.product?.priceInRobux
									}
									isForSale
									gray
								/>
							),
							link: (
								<a
									href={getAvatarBundleLink(bundle.id, bundle.name)}
									className="text-link item-card-link"
								>
									{bundles[0].name}
								</a>
							),
						})}
					</div>
					<Button
						type="secondary"
						as="a"
						className="view-bundle-btn"
						href={getAvatarBundleLink(bundle.id, bundle.name)}
					>
						{getMessage("avatarItem.itemBundles.view")}
					</Button>
				</>
			)}
		</div>
	);
}
