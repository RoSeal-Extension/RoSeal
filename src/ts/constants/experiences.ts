export const PRIVATE_NOTE_STORAGE_KEY = "experiencePrivateNotes";

export const MAX_PRIVATE_NOTE_LENGTH = 2_000;

export const RESTRICTED_PLAYABILITY_STATUSES = [
	"GuestProhibited",
	"GuestUnapproved",
	"DeviceRestricted",
	"PurchaseRequired",
	"AccountRestricted",
	"ComplianceBlocked",
	"ContextualPlayabilityRegionalAvailability",
	"ContextualPlayabilityRegionalCompliance",
	"ContextualPlayabilityAgeRecommendationParentalControls",
	"ContextualPlayabilityAgeGated",
	"ContextualPlayabilityUnverifiedSeventeenPlusUser",
	"FiatPurchaseRequired",
	"FiatPurchaseDeviceRestricted",
	"ContextualPlayabilityUnrated",
	"ContextualPlayabilityAgeGatedByDescriptor",
	"ContextualPlayabilityGeneral",
	"ContextualPlayabilityExperienceBlockedParentalControls",
];
