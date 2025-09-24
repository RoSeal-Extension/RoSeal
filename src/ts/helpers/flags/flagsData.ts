export type FlagsData = {
	hiddenAvatarAssets: {
		showRolimonsLink: boolean;
	};
	developerProducts: {
		overrideTransactionsLink: boolean;
		experienceStoreOffSaleOffByDefault: boolean;
	};
	onboarding: {
		showOnboarding: boolean;
	};
};

export const flagsData: FlagsData = {
	hiddenAvatarAssets: {
		showRolimonsLink: true,
	},
	developerProducts: {
		experienceStoreOffSaleOffByDefault: false,
		overrideTransactionsLink: true,
	},
	onboarding: {
		showOnboarding: true,
	},
};
