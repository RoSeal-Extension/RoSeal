import type { Signal } from "@preact/signals";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type { FeatureValue, features } from "src/ts/helpers/features/featuresData";
import type { RobuxUpsellPackage } from "src/ts/helpers/requests/services/account";
import type { RobloxGroupedDataCenter } from "src/ts/helpers/requests/services/roseal";
import type { UserPresence } from "src/ts/helpers/requests/services/users";
import type { AuthenticatedUser } from "src/ts/utils/authenticatedUser";

export type RobloxDataCenterConnectionSpeed = "fastest" | "fast" | "average" | "slow" | "slowest";

export type RobloxGroupedDataCenterWithDistance = OmitExtend<
	RobloxGroupedDataCenter,
	{
		distance?: number;
		speed?: RobloxDataCenterConnectionSpeed;
	}
>;

export type ServersTabContextData = {
	universeId: number;
	universeName: string;
	placeId: number;
	rootPlaceId: number;
	dataCenters?: RobloxGroupedDataCenterWithDistance[];
	canManagePlace: boolean;
	privateServerPrice: number | null;
	canCreatePrivateServer: boolean;
	canPreCreatePrivateServer: boolean;
	preopenPrivateServerCreateModal: boolean;
	privateServerLimit: number;
	privateServerLinkCode?: string;
	sellerName: string;
	userRobuxAmount?: number;
	robuxUpsellPackage?: RobuxUpsellPackage;
	productionVersion?: number;
	userChannelVersion?: number;

	preCreatePrivateServersEnabled: boolean;
	showServerLikelyBotted: boolean;
	regionFiltersEnabled: boolean;
	showServerDistance: boolean;
	showServerDebugInfo: boolean;
	showServerUpdateDelayEnabled: boolean;
	showServerPerformanceEnabled: boolean;
	showServerPlaceVersionEnabled: boolean;
	showCopyGenerateLinkEnabled: boolean;
	showServerExpiringDateEnabled: boolean;
	showServerShareLinkEnabled: boolean;
	showConnectionsInServerEnabled: boolean;
	showServerLocationEnabled: boolean;
	showServerConnectionSpeedEnabled: boolean;
	excludeFullServersDefaultEnabled: boolean;
	privateServerRowsEnabled: boolean;
	preferredServerButtonEnabled: boolean;

	preferredServerRegionLatLong?: [number, number];
	tryGetServerInfoEnabled: FeatureValue<
		(typeof features)["improvedExperienceServersTab.tryGetServerInfo"]
	>[number];
	pagingType: FeatureValue<(typeof features)["improvedExperienceServersTab.paginationType"]>;
	pageSize: FeatureValue<(typeof features)["improvedExperienceServersTab.paginationSize"]>;

	thumbnailHashToPlayerTokens: Record<string, Set<string>>;
	userLatLong?: [number, number];
	authenticatedUser?: AuthenticatedUser | null;
	promptLocationPermission: boolean;
	onlineFriends: UserPresence[] | undefined | null;
	latestPlaceVersion?: number;

	activatePreferredServer: Signal<boolean>;

	setCalculateServerDistance: (
		data: FeatureValue<
			(typeof features)["improvedExperienceServersTab.tryGetServerInfo.calculateServerDistance"]
		>,
	) => void;
	setPromptLocationPermission: (data: boolean) => void;
	setThumbnailHashToPlayerTokens: (
		prev: (data: Record<string, Set<string>>) => Record<string, Set<string>>,
	) => void;
	setUserLatLong: (latLong: [number, number]) => void;
};

export const ServersTabContext = createContext<ServersTabContextData>(
	undefined as unknown as ServersTabContextData,
);

export function useServersTabContext() {
	return useContext(ServersTabContext);
}
