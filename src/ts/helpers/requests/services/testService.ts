import { getRobloxUrl } from "src/ts/utils/baseUrls.ts" with { type: "macro" };
import { CHANNEL_TOKEN_HEADER_NAME, httpClient } from "../main.ts";
import type { APPLICATION_BINARY_TYPES } from "src/ts/constants/misc.ts";

export type GetLayersValuesParameters<T extends string> = {
	projectId?: number;
	layers: Record<T, Record<string, unknown>>;
};

export type GetLayerValuesParameters<T extends string> = {
	projectId?: number;
	layerName: string;
	parameters: T[];
};

export type LayersValues = {
	experimentName: string | null;
	isAudienceSpecified: boolean;
	isAudienceMember: boolean | null;
	segment: number;
	experimentVariant: string;
	parameters: Record<string, unknown>;
	primaryUnit: string | null;
	primaryUnitValue: string | null;
	holdoutGroupExperimentName: string | null;
};

export type GetLayersValuesResponse<T extends string> = {
	projectId: number;
	version: number;
	publishedAt: number;
	layers: Record<T, LayersValues>;
	userAgent: string;
	platformType: string;
	platformTypeId: number;
};

export type GUACPolicy<T extends string> = {
	name: T;
	content: Record<string, unknown>;
	errorCode: number;
};

export type MultigetGUACPoliciesResponse<T extends string> = {
	results: GUACPolicy<T>[];
};

export type GetGUACPolicyRequest = {
	behaviorName: string;
	extraParameters?: Record<string, string | undefined>;
};

export type MultigetGUACPoliciesRequest<T extends string> = {
	behaviorNames: T[];
};

export type GetFeatureAccessRequest<T extends string> = {
	featureName: T;
	namespace?: string;
	extraParameters?: Record<string, unknown>[];
};

export type GetFeaturesAccessRequest<T extends string> = {
	featureNames: T[];
};

export type FeatureAccess = "Granted" | "Denied" | "Actionable";

export type GetFeaturesAccessResponse<T extends string> = {
	features: UpsellFeatureAccess<T>[];
};

export type UpsellFeatureAccess<T extends string> = {
	featureName: T;
	access: FeatureAccess;
	recourse: string | null;
	recourses: string[] | null;
	shouldPrompt: boolean;
};

export type ApplicationSettings = {
	applicationSettings: Record<string, unknown> | null;
};

export type GetClientSettingsRequest = {
	applicationName: string;
	bucketName?: string;
};

export type GetUserEnrollmentChannelRequest = {
	binaryType?: (typeof APPLICATION_BINARY_TYPES)[number];
};

export type GetUserEnrollmentChannelResponse = {
	channelName: string;
	channelAssignmentType?: 1 | 2 | 3 | 4 | 5;
	token?: string;
};

export type GetClientVersionRequest = {
	binaryType?: (typeof APPLICATION_BINARY_TYPES)[number];
	channelName?: string;
	channelToken?: string;
};

export type GetClientVersionResponse = {
	version: string;
	clientVersionUpload: string;
	bootstrapperVersion: string;
	nextClientVersionUpload?: string;
	nextClientVersion?: string;
};

export function getLayersValues<T extends string>({
	projectId = 1,
	layers,
}: GetLayersValuesParameters<T>) {
	return httpClient
		.httpRequest<GetLayersValuesResponse<T>>({
			url: `${getRobloxUrl(
				"apis",
			)}/product-experimentation-platform/v1/projects/${projectId}/values`,
			method: "POST",
			body: {
				type: "json",
				value: {
					layers,
				},
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			includeCsrf: false,
			errorHandling: "BEDEV2",
		})
		.then((res) => res.body);
}

export function getLayerValues<T extends string>({
	projectId = 1,
	layerName,
	parameters,
}: GetLayerValuesParameters<T>) {
	return httpClient
		.httpRequest<Record<T, unknown>>({
			url: `${getRobloxUrl(
				"apis",
			)}/product-experimentation-platform/v1/projects/${projectId}/layers/${layerName}/values`,
			search: {
				parameters,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
		.then((res) => res.body);
}

export function getGUACPolicy<T extends Record<string, unknown>>({
	behaviorName,
	extraParameters,
}: GetGUACPolicyRequest) {
	return httpClient
		.httpRequest<T>({
			url: `${getRobloxUrl("apis")}/guac-v2/v1/bundles/${behaviorName}`,
			search: extraParameters,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
		.then((res) => res.body);
}

export function multigetGUACPolicies<T extends string>({
	behaviorNames,
}: MultigetGUACPoliciesRequest<T>) {
	const searchParams = new URLSearchParams();
	for (const behaviorName of behaviorNames) {
		searchParams.append("names", behaviorName);
	}

	return httpClient
		.httpRequest<MultigetGUACPoliciesResponse<T>>({
			url: getRobloxUrl("apis", "/universal-app-configuration/v1/behavior-contents"),
			search: searchParams,
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
		.then((res) => res.body);
}

export function getFeatureAccess<T extends string>({
	featureName,
	namespace,
	extraParameters,
}: GetFeatureAccessRequest<T>) {
	return httpClient
		.httpRequest<UpsellFeatureAccess<T>>({
			url: getRobloxUrl("apis", "/access-management/v1/upsell-feature-access"),
			search: {
				featureName,
				namespace,
				extraParameters: extraParameters && btoa(JSON.stringify(extraParameters)),
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
		.then((res) => res.body);
}

export function getFeaturesAccess<T extends string>({ featureNames }: GetFeaturesAccessRequest<T>) {
	return httpClient
		.httpRequest<GetFeaturesAccessResponse<T>>({
			url: getRobloxUrl("apis", "/access-management/v1/feature-access"),
			search: {
				featureNames,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			errorHandling: "BEDEV2",
		})
		.then((res) => res.body);
}

export function getClientSettings({ applicationName, bucketName }: GetClientSettingsRequest) {
	return httpClient
		.httpRequest<ApplicationSettings>({
			url: `${getRobloxUrl("clientsettings")}/v2/settings/application/${applicationName}${bucketName ? `/bucket/${bucketName}` : ""}`,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
		.then((res) => res.body);
}

export function getUserEnrollmentChannel(request: GetUserEnrollmentChannelRequest) {
	return httpClient
		.httpRequest<GetUserEnrollmentChannelResponse>({
			url: getRobloxUrl("clientsettings", "/v2/user-channel"),
			search: request,
			credentials: {
				type: "cookies",
				value: true,
			},
		})
		.then((res) => res.body);
}

export function getClientVersion({
	binaryType,
	channelName,
	channelToken,
}: GetClientVersionRequest) {
	return httpClient
		.httpRequest<GetClientVersionResponse>({
			url: `${getRobloxUrl("clientsettings")}/v2/client-version/${binaryType}${channelToken ? `/channel/${channelName}` : ""}`,
			headers: {
				[CHANNEL_TOKEN_HEADER_NAME]: channelToken,
			},
			credentials: {
				type: "cookies",
				value: true,
			},
			bypassCORS: channelToken !== undefined,
		})
		.then((res) => res.body);
}
