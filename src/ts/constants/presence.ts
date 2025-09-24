type PresenceTypeData = {
	typeId: number;
	type: string;
	locationType: string;
	iconName?: string;
	canFilter?: boolean;
};

export type UserPresenceType = (typeof presenceTypes)[number]["type"];
export type UserPresenceLocationType = (typeof presenceTypes)[number]["locationType"];
export type UserPresenceTypeId = (typeof presenceTypes)[number]["typeId"];

export const presenceTypes = [
	{
		typeId: 0,
		type: "Offline",
		locationType: "Offline",
		canFilter: true,
	},
	{
		typeId: 1,
		type: "Online",
		locationType: "Page",
		iconName: "online",
		canFilter: true,
	},
	{
		typeId: 2,
		type: "InGame",
		locationType: "Game",
		iconName: "game",
		canFilter: true,
	},
	{
		typeId: 3,
		type: "InStudio",
		locationType: "Studio",
		iconName: "studio",
		canFilter: true,
	},
] as const satisfies PresenceTypeData[];
