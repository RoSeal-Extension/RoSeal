import usePromise from "src/ts/components/hooks/usePromise";

export type UserCommunityRoleGridProps = {
	roleName: MaybePromise<string | undefined>;
};

export default function UserCommunityRoleGrid({ roleName: _roleName }: UserCommunityRoleGridProps) {
	const [roleName] = usePromise(() => _roleName);

	if (!roleName) return null;

	return (
		<div className="text-overflow game-card-name-secondary user-community-role text align-left">
			{roleName}
		</div>
	);
}
