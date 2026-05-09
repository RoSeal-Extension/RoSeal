export type FlagsData = {
	thirdParties: {
		showRolimonsLink: boolean;
	};
	developerProducts: {
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
	},
	onboarding: {
		showOnboarding: true,
	},
	homePage: {
		blockSDUI: false,
	},
};
