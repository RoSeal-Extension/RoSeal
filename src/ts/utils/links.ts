import {
	getBlueskyLink,
	getCrowdinLink,
	getDiscordLink,
	getMastodonLink,
	getRobloxUrl,
	getRolimonsUrl,
	getRoSealWebsiteUrl,
	getXLink,
} from "./baseUrls.ts";
import currentUrl from "./currentUrl.ts";
import { filterObject } from "./objects.ts";

export function formatSeoName(name?: string): string {
	return (
		name
			?.replace(/'/g, "")
			.replace(/[^a-z0-9]+/gi, "-")
			.replace(/^-+|-+$/g, "")
			.replace(/^(COM\d|LPT\d|AUX|PRT|NUL|CON|BIN)$/i, "") || "unnamed"
	);
}

export function getLink(subdomain: string, link: string, locale?: string) {
	const setLink =
		!(locale ?? currentUrl.value.path.locale) || subdomain !== "www"
			? link
			: `/${locale ?? currentUrl.value.path.locale}${link}`;
	if (currentUrl.value.url?.hostname !== getRobloxUrl(subdomain)) {
		return `https://${getRobloxUrl(subdomain, setLink)}`;
	}

	return setLink;
}

export function getCreatorDocsLink(type: string, path: string) {
	return getLink("create", `/docs/${type}/${path}`);
}

export function getCreatorStoreAssetLink(assetId: number, assetName = "name") {
	return getLink("create", `/store/asset/${assetId}/${formatSeoName(assetName)}`);
}

export function getAvatarAssetLink(assetId: number, assetName = "name", hidden?: boolean) {
	return getLink(
		"www",
		`/${hidden ? "hidden-" : ""}catalog/${assetId}/${formatSeoName(assetName)}`,
	);
}

export function getDownloadClientLink() {
	return getLink("www", "/download/client");
}

export function getAvatarLookLink(lookId: string, lookName?: string) {
	return getLink("www", `/looks/${lookId}/${formatSeoName(lookName)}`);
}

export function getAvatarBundleLink(bundleId: number, bundleName = "name", hidden?: boolean) {
	return getLink(
		"www",
		`/${hidden ? "hidden-" : ""}bundles/${bundleId}/${formatSeoName(bundleName)}`,
	);
}

export function getUserProfileLink(userId: number, tab?: string, isDeleted?: boolean) {
	return getLink(
		"www",
		`/${isDeleted ? "deleted-" : ""}users/${userId}/profile${tab ? `#!/${tab}` : ""}`,
	);
}

export function getUserAvatarsLink(userId: number) {
	return getLink("www", `/users/${userId}/avatars`);
}

export function getUserTradeLink(userId: number, rItems?: string) {
	return getLink(
		"www",
		`/users/${userId}/trade${rItems !== undefined ? `?ritems=${rItems}` : ""}`,
	);
}

export function getUserFriendsLink(userId: number, tab?: string) {
	return getLink("www", `/users/${userId}/friends${tab ? `#!/${tab}` : ""}`);
}

export function getUserProfileByUsernameLink(username: string) {
	return getLink("www", `/users/profile?username=${username}`);
}

export function getBuyRobuxPackageLink(ap: number) {
	return getLink("www", `/upgrades/paymentmethods?ap=${ap}`);
}

export function getUserFavoritesLink(userId: number, tab?: string) {
	return getLink("www", `/users/${userId}/favorites${tab ? `#!/${tab}` : ""}`);
}

export function getUserInventoryLink(userId: number, tab?: string) {
	return getLink("www", `/users/${userId}/inventory${tab ? `#!/${tab}` : ""}`);
}

export function getRobloxSettingsLink(tab?: string) {
	return getLink("www", `/my/account${tab ? `#!/${tab}` : ""}`);
}

export function getRoSealSettingsLink(target?: string) {
	return getLink("www", `/my/account?roseal${target ? `=${target}` : ""}`);
}

export function getEditAvatarLink() {
	return getLink("www", "/my/avatar");
}

export function getGroupProfileLink(groupId: number, groupName = "name", tab?: string) {
	return getLink(
		"www",
		`/communities/${groupId}/${formatSeoName(groupName)}${tab ? `#!/${tab}` : ""}`,
	);
}

export function getGeneralReportAbuseLink(type: string, id: number) {
	return getLink("www", `/abusereport/${type}?id=${id}`);
}

export function getGeneralReportAbuseLinkV2(
	targetId: number,
	abuseVector: string,
	submitterId?: number,
	custom?: string,
) {
	return getLink(
		"www",
		`/report-abuse/?targetId=${targetId}&abuseVector=${abuseVector}${submitterId !== undefined ? `&submitterId=${submitterId}` : ""}${custom !== undefined ? `&custom=${custom}` : ""}`,
	);
}

export function getCreatorProfileLink(
	targetId: number,
	targetType?: "User" | "Group" | 1 | 2,
	targetName?: string,
) {
	return targetType && [2, "Group"].includes(targetType)
		? getGroupProfileLink(targetId, targetName)
		: getUserProfileLink(targetId);
}

export function getDiscordInviteLink(inviteCode: string) {
	return getDiscordLink(`/invite/${inviteCode}`);
}

export function getExperienceLink(placeId: number, experienceName = "name") {
	return getLink("www", `/games/${placeId}/${formatSeoName(experienceName)}`);
}

export function getConfigurePrivateServerLink(privateServerId: number) {
	return getLink("www", `/private-server/configure/${privateServerId}`);
}

export function getDeveloperProductDetailsLink(
	developerProductId: number,
	developerProductName = "unnamed",
) {
	return getLink(
		"www",
		`/developer-products/${developerProductId}/${formatSeoName(developerProductName)}`,
	);
}

export function getPassDetailsLink(passId: number, passName = "unnamed") {
	return getLink("www", `/game-pass/${passId}/${formatSeoName(passName)}`);
}

export function getRobloxCommunityStandardsLink() {
	return getRobloxInfoLink("community-guidelines");
}

export function getRobloxPrivateServerInfoLink() {
	return getRobloxInfoLink("vip-server");
}

export function getMarketplacePricingLink() {
	return getLink("www", "/marketplace-item-pricing");
}

export function getRobloxInfoLink(target: string) {
	return getLink("www", `/info/${target}`);
}

export function getRobloxBadgesInfoLink(badgeId?: number) {
	return getRobloxInfoLink(`roblox-badges${badgeId !== undefined ? `#Badge${badgeId}` : ""}`);
}

export function getRobloxTermsLink() {
	return getRobloxInfoLink("terms");
}

export function getTransactionsLink() {
	return getLink("www", "/transactions");
}

export function getBuyRobuxLink() {
	return getLink("www", "/upgrades/robux");
}

export function getHomePageUrl() {
	return getLink("www", "/home");
}

export function getRobloxSupportUrl() {
	return getLink("www", "/support");
}

export function getRoSealSiteLink(path = "") {
	return `http${import.meta.env.IS_DEV_WWW_ACCESSIBLE ? "" : "s"}://${getRoSealWebsiteUrl("")}/${path}`;
}

export function getRoSealChangelogLink(path = "") {
	return getRoSealSiteLink(`changelogs#${path}`);
}

export function getRoSealFriendInviteLink(code: string) {
	return getRoSealSiteLink(`connection-invite?code=${code}`);
}

export function getRoSealServerJoinLink(data: Record<string, string | undefined>) {
	return getRoSealSiteLink(
		`join?${new URLSearchParams(data as Record<string, string>).toString()}`,
	);
}

export function getBuyMeACoffeeLink(path = "") {
	return `https://www.buymeacoffee.com/${path}`;
}

export function getSearchGroupsLink() {
	return getLink("www", "/search/communities");
}

export function getCreateGroupLink() {
	return getLink("www", "/communities/create");
}

export function getBadgeLink(badgeId: number, badgeName = "unnamed") {
	return getLink("www", `/badges/${badgeId}/${formatSeoName(badgeName)}`);
}

export function getConfigureAvatarAssetLink(assetId: number) {
	return getLink("create", `/dashboard/creations/catalog/${assetId}/configure`);
}

export function getDevExLink() {
	return getLink("create", "/dashboard/devex");
}

export function getManagePassesLink(universeId: number) {
	return getLink("create", `/dashboard/creations/experiences/${universeId}/monetization/passes`);
}

export function getListCreationsLink(activeTab?: string, groupId?: number) {
	return getLink(
		"create",
		`/dashboard/creations${activeTab ? `?activeTab=${activeTab}` : ""}${groupId ? `${activeTab ? "&" : "?"}groupId=${groupId}` : ""}`,
	);
}

export function getAnalyticsDashboardLink(activeTab?: string) {
	return getLink("create", `/dashboard/analytics${activeTab ? `?tab=${activeTab}` : ""}`);
}

export function getLoginLink(returnUrl?: string) {
	return `${getLink("www", "/login")}${returnUrl ? `?${new URLSearchParams({ returnUrl }).toString()}` : ""}`;
}

export function getAvatarMarketplaceLink(parameters?: Record<string, string | number | undefined>) {
	return getLink(
		"www",
		`/catalog${
			parameters
				? `?${new URLSearchParams(
						filterObject(parameters) as Record<string, string>,
					).toString()}`
				: ""
		}`,
	);
}

export function getPrivateServerLink(placeId: number, linkCode: string, placeName?: string) {
	return getLink(
		"www",
		`/games/${placeId}/${formatSeoName(
			placeName || "unnamed",
		)}?privateServerLinkCode=${linkCode}`,
	);
}

export function getRolimonsHiddenAvatarAssetLink(assetId: number) {
	return `https://${getRolimonsUrl("www")}/item/${assetId}`;
}

export function getRolimonsUAIDLink(userAssetId: number) {
	return `https://${getRolimonsUrl("www")}/uaid/${userAssetId}`;
}

export function getRolimonsUserProfileLink(userId: number) {
	return `https://${getRolimonsUrl("www")}/player/${userId}`;
}

export function getPrivateServerLinkV2(linkCode: string) {
	return getLink("www", `/share?code=${linkCode}&type=Server`);
}

export function getDiscoverSearchLink(keyword: string) {
	return getLink("www", `/discover?Keyword=${keyword}`);
}

export function getEventLink(eventId: string) {
	return getLink("www", `/events/${eventId}`);
}

export function getBlueskyProfileLink(username: string) {
	return getBlueskyLink(`/profile/${username}`);
}

export function getXProfileLink(username: string) {
	return getXLink(`/${username}`);
}

export function getMastodonProfileLink(username: string) {
	return getMastodonLink(`/@${username}`);
}

export function getShareLink(type: string, code: string, locale?: string) {
	return getLink("www", `/share-links?type=${type}&code=${code}`, locale);
}

export function getCrowdinProjectLink(projectId: string) {
	return getCrowdinLink(`/project/${projectId}`);
}

export function getPremiumMembershipLink() {
	return getLink("www", "/premium/membership");
}

export function getTradesLink(tab?: string) {
	return getLink("www", `/trades${tab !== undefined ? `?tab=${tab}` : ""}`);
}
