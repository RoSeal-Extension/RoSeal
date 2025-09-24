export type RobloxBadgeMetadata = {
	id: number;
	name: string;
	iconName: string;
	priority: number;
	deprecated?: boolean;
};

export const ROBLOX_ADMINISTRATOR_BADGE_ID = 1 as const;
export const ROBLOX_BADGES_CONFIG: RobloxBadgeMetadata[] = [
	{
		id: ROBLOX_ADMINISTRATOR_BADGE_ID,
		name: "Administrator",
		iconName: "badge-administrator",
		priority: 1,
	},
	{
		id: 2,
		name: "Friendship",
		iconName: "badge-friendship",
		priority: 6,
	},
	{
		id: 3,
		name: "Combat Initiation",
		iconName: "badge-combat-initiation",
		priority: 10,
	},
	{
		id: 4,
		name: "Warrior",
		iconName: "badge-warrior",
		priority: 11,
	},
	{
		id: 5,
		name: "Bloxxer",
		iconName: "badge-bloxxer",
		priority: 12,
	},
	{
		id: 6,
		name: "Homestead",
		iconName: "badge-homestead",
		priority: 3,
	},
	{
		id: 7,
		name: "Bricksmith",
		iconName: "badge-bricksmith",
		priority: 4,
	},
	{
		id: 8,
		name: "Inviter",
		iconName: "badge-inviter",
		priority: 8,
	},
	{
		id: 11,
		name: "Builder's Club",
		iconName: "badge-builders-club",
		priority: 999,
		deprecated: true,
	},
	{
		id: 12,
		name: "Veteran",
		iconName: "badge-veteran",
		priority: 5,
	},
	{
		id: 14,
		name: "Ambassador",
		iconName: "badge-ambassador",
		priority: 9,
	},
	{
		id: 15,
		name: "Turbo's Builder's Club",
		iconName: "badge-turbo-builders-club",
		priority: 9999,
		deprecated: true,
	},
	{
		id: 16,
		name: "Outrageous Builder's Club",
		iconName: "badge-outrageous-builders-club",
		priority: 99999,
		deprecated: true,
	},
	{
		id: 17,
		name: "Official Model Maker",
		iconName: "badge-official-model-maker",
		priority: 2,
	},
	{
		id: 18,
		name: "Welcome To The Club",
		iconName: "badge-welcome-to-the-club",
		priority: 7,
	},
];
