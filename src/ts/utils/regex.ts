export const MY_ACCOUNT_REGEX = /^\/my\/account$/i;
export const GROUP_DETAILS_REGEX = /^\/(groups|communities|profiles)\/(\d+)(\/([a-z0-9-_]*)?)?$/i;
export const USER_PROFILE_REGEX = /^\/users\/(\d+)(\/(profile)?)?$/i;
export const DELETED_USER_PROFILE_REGEX = /^\/deleted-users\/(\d+)(\/(profile)?)?$/i;
export const SEARCH_USERS_REGEX = /^\/search\/users$/i;
export const AVATAR_MARKETPLACE_REGEX = /^\/catalog$/i;
export const AVATAR_ITEM_REGEX = /^\/(bundles|catalog)\/(\d+)(\/([a-z0-9-]+)?)?$/i;
export const LOOK_REGEX = /^\/looks\/(\d+)(\/([a-z0-9-]+)?)?$/i;
export const USER_INVENTORY_REGEX = /^\/users(\/(.+?))?\/inventory$/i;
export const USER_FRIENDS_REGEX = /^\/users(\/(\d+))?\/(friends|connections)$/i;
export const USER_FAVORITES_REGEX = /^\/users(\/(\d+))?\/favorites$/i;
export const MY_AVATAR_REGEX = /^\/my\/avatar$/i;
export const EXPERIENCE_DETAILS_REGEX = /^\/games\/(\d+)(\/([a-z0-9-]+)?)?$/i;
export const EXPERIENCE_DEEPLINK_REGEX = /^\/games\/start$/i;
export const EXPERIENCE_EVENT_REGEX = /^\/events\/(\d+)$/i;
// We want to support just the ID. Do not add $
export const PLACE_CHECK_REGEX = /^\/games\/check\/(\d+)/i;
export const REQUEST_ERROR_REGEX = /^\/request-error$/i;
export const CHARTS_REGEX = /^\/(discover|charts)$/i;
export const HOME_REGEX = /^\/home$/i;
export const SHARE_LINK_REGEX = /^\/share-links$/i;
export const TRANSACTIONS_REGEX = /^\/transactions$/i;
export const GROUP_CONFIGURE_REGEX = /^\/(groups|communities|profiles)\/configure$/i;
export const BADGE_DETAILS_REGEX = /^\/badges\/(\d+)(\/([a-z0-9-]+))?$/i;
export const DEVELOPER_PRODUCT_DETAILS_REGEX = /^\/developer-products\/(\d+)\/?([a-z0-9-]+)?$/i;
export const UNIVERSE_REDIRECT_REGEX = /^\/(games|experiences)\/universe-redirect\/([0-9]+)$/i;
export const HIDDEN_AVATAR_ASSET_DETAILS_REGEX = /^\/(hidden-catalog)\/(\d+)\/?([a-z0-9-]+)?$/i;
export const HIDDEN_AVATAR_BUNDLE_DETAILS_REGEX = /^\/(hidden-bundles)\/(\d+)\/?([a-z0-9-]+)?$/i;
export const MY_MESSAGES_REGEX = /^\/my\/messages$/i;
export const PASS_DETAILS_REGEX = /^\/game-pass\/(\d+)\/([a-z0-9-]+)$/i;
export const REFERENCE_ICONS_REGEX = /^\/reference\/icons$/i;
export const MARKETPLACE_ITEM_PRICING_REGEX = /^\/marketplace-item-pricing$/i;
export const TRENDING_SEARCHES_REGEX = /^\/trending-searches$/i;
export const ACCOUNT_SHENANIGANS_REGEX = /^\/account-shenanigans$/i;
export const NO_SEALS_REGEX = /^\/no-seals$/i;
export const SEALS_REGEX = /^\/seals$/i;
export const BUY_ROBUX_REGEX = /^\/upgrades\/robux$/i;
export const BUY_ROBUX_PACKAGE_PAYMENTMETHODS_REGEX = /^\/upgrades\/paymentmethods$/i;
export const ACCOUNT_SIGNUP_REGEX = /^\/(createaccount)?$/i;

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const USERNAME_MENTION_REGEX = /@([a-z0-9_]{2,20})/gi;
export const USERNAME_REGEX = /^([a-z0-9_ .]{2,20})$/i;

export const CREATOR_STORE_ASSET_REGEX = /^\/store\/asset\/(\d+)(\/([a-z0-9-]+))?$/i;

export const SYMBOL_REGEX =
	/[\u00A1-\u00BF\u00D7\u00F7\u02B0-\u036F\u2000-\u206F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF]/gu;

export function escapeRegExp(text: string) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
