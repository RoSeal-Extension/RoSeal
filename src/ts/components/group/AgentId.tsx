import { listAgentUniverses } from "src/ts/helpers/requests/services/universes";
import usePromise from "../hooks/usePromise";
import { searchItems } from "src/ts/helpers/requests/services/marketplace";
import { getAssetById } from "src/ts/helpers/requests/services/assets";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type GroupAgentIdProps = {
	groupId: number;
};

export default function GroupAgentId({ groupId }: GroupAgentIdProps) {
	const [agentId] = usePromise(() => {
		return listAgentUniverses({
			agentType: "Group",
			agentId: groupId,
			accessFilter: "Public",
			limit: 10,
		}).then(async (universes) => {
			const assetId =
				universes[0]?.rootPlace.id ??
				(
					await searchItems({
						creatorType: "Group",
						creatorTargetId: groupId,
						includeNotForSale: true,
						limit: 100,
					})
				)?.data.find((item) => item.itemType === "Asset")?.id;

			if (assetId) {
				const assetDetail = await getAssetById({
					assetId,
				});
				return assetDetail.creator.id;
			}
		});
	}, [groupId]);

	return (
		<>
			{!!agentId && (
				<div className="group-agent-id">
					<span className="text-label font-caption-header">
						{getMessage("group.agentId")}
					</span>{" "}
					<span className="font-caption-header">{agentId}</span>
				</div>
			)}
		</>
	);
}
