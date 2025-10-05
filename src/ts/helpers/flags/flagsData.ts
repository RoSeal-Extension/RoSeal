export type FlagsData = {
	thirdParties: {
		showRolimonsLink: boolean;
	};
	developerProducts: {
		overrideTransactionsLink: boolean;
		experienceStoreOffSaleOffByDefault: boolean;
	};
	onboarding: {
		showOnboarding: boolean;
	};
	homePage: {
		blockSDUI: boolean;
	};
};

export const flagsData: FlagsData = {
	thirdParties: {
		showRolimonsLink: true,
	},
	developerProducts: {
		experienceStoreOffSaleOffByDefault: false,
		overrideTransactionsLink: true,
	},
	onboarding: {
		showOnboarding: true,
	},
	homePage: {
		blockSDUI: false,
	},
};
