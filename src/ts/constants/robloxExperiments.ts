import type { RobloxExperimentVariable } from "../helpers/requests/services/roseal";

export const EXPERIMENTS_STORAGE_KEY = "robloxExperiments.overrides";
export const EXPERIMENTS_DISCOVERED_STORAGE_KEY = "robloxExperiments.discovered";

export type ExperimentsDiscoveredStorageValue = {
	ixp?: Record<number | string, Record<string, string[]>>;
	guac?: Record<number | string, Record<string, string[]>>;
	clientSettings?: Record<number | string, Record<string, string[]>>;
};
export type ExperimentsStorageValue = {
	settings: Record<string, string>;
	operations: RobloxExperimentVariable[];
};

// Try to prevent RCE vulnerabilities while allowing flexibility with the backend
export const DISALLOWED_DOM_TAG_NAMES = ["script", "style", "link"];
export const DISALLOWED_DOM_ATTRIBUTES = ["style", "href", "src"];
