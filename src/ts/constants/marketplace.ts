import type { Agent } from "../helpers/requests/services/assets";

export type MarketplaceColorFiltersState = {
	primaryBaseColor: [number, number, number];
	primaryBaseColorEnabled: boolean;
	secondaryBaseColor: [number, number, number];
	secondaryBaseColorEnabled: boolean;
	anyBaseColor: [number, number, number];
	anyBaseColorEnabled: boolean;
};

export const DEFAULT_MARKETPLACE_COLOR_FILTERS_STATE: MarketplaceColorFiltersState = {
	primaryBaseColor: [0, 0, 0],
	primaryBaseColorEnabled: false,
	secondaryBaseColor: [0, 0, 0],
	secondaryBaseColorEnabled: false,
	anyBaseColor: [0, 0, 0],
	anyBaseColorEnabled: false,
};

export type AgentIncludingAll = Agent | "All";

export const MARKETPLACE_CREATOR_TYPES = [
	{
		type: "User",
		key: "user",
	},
	{
		type: "Group",
		key: "community",
	},
	{
		type: "All",
		key: "all",
	},
] as const;

export const MARKETPLACE_CART_LOCALSTORAGE_PREFIX = "Roblox.AvatarMarketplace.Cart:";
export const MARKETPLACE_CART_MAX_ITEMS_NUMBER = 20;
