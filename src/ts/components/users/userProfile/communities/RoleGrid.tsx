export type UserCommunityRoleGridProps = {
	roleName: string;
};

export default function UserCommunityRoleGrid({ roleName }: UserCommunityRoleGridProps) {
	return (
		<div className="text-overflow game-card-name-secondary user-community-role text align-left">
			{roleName}
		</div>
	);
}
