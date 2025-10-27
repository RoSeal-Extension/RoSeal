export function getRobloxUrl(service: string, path?: string) {
	return `${import.meta.env.ROBLOX_DOMAIN!.replace("{service}", service)}${path || ""}`;
}

export function getRobloxCDNUrl(service: string, path?: string) {
	return `${import.meta.env.ROBLOX_CDN_DOMAIN!.replace("{service}", service)}${path || ""}`;
}

export function getRoSealWebsiteUrl(path?: string) {
	return `${import.meta.env.ROSEAL_WEBSITE_DOMAIN}${path || ""}`;
}

export function getRoSealAPIUrl(path?: string) {
	return `${import.meta.env.ROSEAL_API_DOMAIN}${path || ""}`;
}

export function getRoSealUrl(service: string, path?: string) {
	return `${import.meta.env.ROSEAL_DOMAIN!.replace("{service}", service)}${path || ""}`;
}

export function getRolimonsUrl(service: string, path?: string) {
	return `${import.meta.env.ROLIMONS_DOMAIN!.replace("{service}", service)}${path || ""}`;
}

export function getRoMonitorUrl(path?: string) {
	return `${import.meta.env.ROMONITOR_DOMAIN}${path || ""}`;
}

export function getXLink(path?: string) {
	return `https://${import.meta.env.X_DOMAIN}${path || ""}`;
}

export function getBlueskyLink(path?: string) {
	return `https://${import.meta.env.BLUESKY_DOMAIN}${path || ""}`;
}

export function getCrowdinLink(path?: string) {
	return `https://${import.meta.env.CROWDIN_DOMAIN}${path || ""}`;
}

export function getMastodonLink(path?: string) {
	return `https://${import.meta.env.MASTODON_DOMAIN}${path || ""}`;
}

export function getDiscordLink(path?: string) {
	return `https://${import.meta.env.DISCORD_DOMAIN}${path || ""}`;
}
