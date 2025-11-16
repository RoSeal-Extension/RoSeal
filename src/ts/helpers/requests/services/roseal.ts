import type { AlertType } from "src/ts/components/core/Alert";
import type { ButtonType } from "src/ts/components/core/Button";
import { getRoSealAPIUrl } from "src/ts/utils/baseUrls";
import type { AnyFeature } from "../../features/featuresData";
import type { FlagsData } from "../../flags/flagsData";
import type { ThumbnailRequest } from "../../processors/thumbnailProcessor";
import { httpClient } from "../main";

export type Alert = {
	id: number;
	content: string;
	contentLink?: string;
	dismissable?: boolean;
	alertType?: AlertType;

	_versions?: string[];
	_targets?: string[];
	_startDate?: number;
	_endDate?: number;
};

export type GetExperienceCountdownRequest = {
	universeId: number;
};

export type ExperienceCountdown = {
	universeId: number;
	type: "Release" | "Update" | "Unknown";
	time: string;
	name?: string;
	nameLink?: string;
	byPlayable?: boolean;
};

export type SubscriptionTier = 1;

export type LaunchDataDisabledFeature = {
	id: AnyFeature["id"];
	variants?: number[];
	versions?: string[];
};

export type RoSealLaunchData = {
	disabledFeaturesV2?: LaunchDataDisabledFeature[];
	flags?: FlagsData;
	subscriptionTier?: SubscriptionTier;
};

export type GetRoSealAlertsResponse = {
	agreementsUpdated: number;
	alerts?: Alert[];
};

export type ExperienceLink = {
	type: "communityWiki";
	url: string;
	locale: string;
	fromFandomInterwiki?: boolean;
	isOfficialWiki?: boolean;
};

export type ExperienceLinkMetadata = {
	universeIds: number[];
	links: ExperienceLink[];
};

export type GetRoSealExperienceLinksRequest = {
	universeId: number;
};

export type RobloxDataCenterLocation = {
	city: string;
	region: string;
	country: string;
	latLong: [number, number];
};

export type RobloxGroupedDataCenter = {
	dataCenterIds: number[];
	location: RobloxDataCenterLocation;
};

export type JSONExperimentVariable = {
	type: "json";
	jsonType: "set" | "push" | "replace" | "override";
	match: {
		field?: string[];
		robloxSubdomain: string;
		method?: string;
		regex: string;
	};
	value: unknown;
	statusCode?: number;
};

export type ClientSettingsExperimentVariable = {
	type: "clientSettings";
	clientSettingsType: "override";
	overrides: Record<string, Record<string, unknown>>;
};

export type IXPExperimentVariable = {
	type: "ixp";
	ixpType: "override";
	overrides: Record<number, Record<string, Record<string, unknown>>>;
};

export type GUACExperimentVariable = {
	type: "guac";
	guacType: "override";
	overrides: Record<string, Record<string, unknown>>;
};

export type AMPEXPExperimentVariable = {
	type: "amp";
	ampType: "override";
	overrides: Record<string, Record<string, unknown>>;
};

export type DOMExperimentVariable =
	| {
			type: "dom";
			domType: "modify";
			selector: string;
			attributes?: Record<string, string | null>;
			classList?: {
				add?: string[];
				remove?: string[];
			};
	  }
	| {
			type: "dom";
			domType: "remove";
			selector: string;
	  };

export type RobloxExperimentVariable =
	| IXPExperimentVariable
	| GUACExperimentVariable
	| DOMExperimentVariable
	| JSONExperimentVariable
	| ClientSettingsExperimentVariable
	| AMPEXPExperimentVariable;

export type RobloxExperimentBucket = {
	id: string;
	label: string;
	description?: string;
	operations: RobloxExperimentVariable[];
};

export type RobloxExperiment = {
	id: string;
	name: string;
	buckets: RobloxExperimentBucket[];
};

export type RobloxExperimentSection = {
	id: string;
	name: string;
	experiments: RobloxExperiment[];
};

export type SharedExperiencePassBenefitType = "uniform" | "varied";

export type SharedExperiencePassBenefitData = {
	type: SharedExperiencePassBenefitType;
	period?: "monthly" | "weekly" | "lifetime";
	periodSpecificTime?: string;
	universesChangeAfterPeriod?: boolean;
};

export type SharedExperiencePassLink = {
	type: ButtonType;
	label: string;
	url: string;
};

export type RobloxSharedExperiencePassUniverse = {
	id: number;
};

export type RobloxSharedExperiencePass = {
	passId: number;
	displayName?: string;
	benefitData: SharedExperiencePassBenefitData;
	iconData?: ThumbnailRequest;
	links?: SharedExperiencePassLink[];
	sourceUniverseId?: number;
	sharedUniverses: RobloxSharedExperiencePassUniverse[];
};

export type GetRobloxSharedExperiencePassesRequest = {
	universeId: number;
};

export async function getRobloxDataCenters() {
	return (
		await httpClient.httpRequest<RobloxGroupedDataCenter[]>({
			url: getRoSealAPIUrl("/v2/grouped-datacenters.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
	).body;
}

export async function getRoSealExperienceCountdown({ universeId }: GetExperienceCountdownRequest) {
	const data = (
		await httpClient.httpRequest<ExperienceCountdown[]>({
			url: getRoSealAPIUrl("/v2/experience-countdowns.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
	).body;

	for (const item of data) {
		if (item.universeId === universeId) {
			return item;
		}
	}
}

export async function getRoSealExperienceLinks({
	universeId,
}: GetRoSealExperienceLinksRequest): Promise<ExperienceLinkMetadata | undefined> {
	const data = (
		await httpClient.httpRequest<ExperienceLinkMetadata[]>({
			url: getRoSealAPIUrl("/v2/experience-links.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
	).body;

	for (const item of data) {
		if (item.universeIds.includes(universeId)) {
			return item;
		}
	}
}

export function getRoSealLaunchData(): Promise<RoSealLaunchData> {
	return httpClient
		.httpRequest<RoSealLaunchData>({
			url: getRoSealAPIUrl("/v2/launch-data.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
		.then((res) => res.body);
}

export function getRoSealAlerts() {
	return httpClient
		.httpRequest<GetRoSealAlertsResponse>({
			url: getRoSealAPIUrl("/v2/alerts.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
		.then((res) => res.body);
}

export function getRobloxExperiments(): Promise<RobloxExperimentSection[]> {
	return httpClient
		.httpRequest<RobloxExperimentSection[]>({
			url: getRoSealAPIUrl("/v2/roblox-experiments.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
		.then((res) => res.body);
}

export function getRobloxSharedExperiencePasses(
	request: GetRobloxSharedExperiencePassesRequest,
): Promise<RobloxSharedExperiencePass[]> {
	return httpClient
		.httpRequest<RobloxSharedExperiencePass[]>({
			url: getRoSealAPIUrl("/v2/shared-experience-passes.json"),
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: true,
		})
		.then((res) =>
			res.body.filter((pass) =>
				pass.sharedUniverses.some((universe) => universe.id === request.universeId),
			),
		);
}
