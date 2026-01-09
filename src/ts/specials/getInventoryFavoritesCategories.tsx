import { getMessage } from "../helpers/i18n/getMessage";
import type {
	ListUserInventoryCategoriesResponse,
	UserInventoryCategory,
	UserInventoryCategoryItem,
} from "../helpers/requests/services/inventory";
import { getItemTypeDisplayLabel } from "../utils/itemTypesText";

export function getInventoryFavoritesCategories(
	isInventory: boolean,
	isSelf: boolean,
	appendCategories?: UserInventoryCategory[],
	includeUnusedAssetTypes?: boolean,
): ListUserInventoryCategoriesResponse {
	const data = {
		categories: [
			{
				name: "Classic Heads",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 17),
				categoryType: "Head",
				items: [
					{
						name: "Classic Heads",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 17),
						filter: null,
						id: 17,
						type: "AssetType",
						categoryType: "Head",
					},
				],
			},
			{
				name: "Faces",
				displayName: getMessage("userInventory.categories.faces"),
				categoryType: "Face",
				items: [
					{
						name: "Faces",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 18),
						filter: null,
						id: 18,
						type: "AssetType",
						categoryType: "Face",
					},
				],
			},
			...(!isInventory
				? [
						{
							name: "Fonts",
							displayName: getMessage("userInventory.categories.fonts"),
							categoryType: "Font",
							items: [
								{
									name: "Font Families",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										73,
									),
									filter: null,
									id: 73,
									type: "AssetType" as const,
									categoryType: "FontFamily",
								},
								{
									name: "Font Faces",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										74,
									),
									filter: null,
									id: 74,
									type: "AssetType" as const,
									categoryType: "FontFace",
								},
							],
						},
					]
				: []),
			{
				name: "Decals",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 13),
				categoryType: "Decal",
				items: [
					{
						name: "Decals",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 13),
						filter: null,
						id: 13,
						type: "AssetType",
						categoryType: "Decal",
					},
				],
			},
			{
				name: "Models",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 10),
				categoryType: "Model",
				items: [
					{
						name: "Models & Packages",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 10),
						filter: null,
						id: 10,
						type: "AssetType",
						categoryType: "Model",
					},
				],
			},
			...(isInventory && isSelf
				? [
						{
							name: "Private Servers",
							displayName: getMessage("userInventory.categories.privateServers"),
							categoryType: "PrivateServers",
							items: [
								{
									name: "My Private Servers",
									displayName: getMessage(
										"userInventory.categories.myPrivateServers",
									),
									filter: "MyPrivateServers",
									id: 9,
									type: "AssetType" as const,
									categoryType: "MyPrivateServers",
								},
								{
									name: "Other Private Servers",
									displayName: getMessage(
										"userInventory.categories.otherPrivateServers",
									),
									filter: "OtherPrivateServers",
									id: 11,
									type: "AssetType" as const,
									categoryType: "OtherPrivateServers",
								},
							],
						},
					]
				: []),
			...(isInventory
				? [
						{
							name: "Badges",
							displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 21),
							categoryType: "Badge",
							items: [
								{
									name: "Badges",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										21,
									),
									filter: null,
									id: 21,
									type: "AssetType" as const,
									categoryType: "Badge",
								},
							],
						},
						{
							name: "Game Passes",
							displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 34),
							categoryType: "GamePass",
							items: [
								{
									name: "Game Passes",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										34,
									),
									filter: null,
									id: 34,
									type: "AssetType" as const,
									categoryType: "GamePass",
								},
							],
						},
					]
				: []),
			{
				name: "Plugins",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 38),
				categoryType: "Plugin",
				items: [
					{
						name: "Plugins",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 38),
						filter: null,
						id: 38,
						type: "AssetType",
						categoryType: "Plugin",
					},
				],
			},
			{
				name: "Animations",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 24),
				categoryType: "Animation",
				items: [
					{
						name: "Animations",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 24),
						filter: null,
						id: 24,
						type: "AssetType",
						categoryType: "Animation",
					},
				],
			},
			{
				name: "Audio",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 3),
				categoryType: "Audio",
				items: [
					{
						name: "Audio",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 3),
						filter: null,
						id: 3,
						type: "AssetType",
						categoryType: "Audio",
					},
				],
			},
			{
				name: "MeshParts",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 40),
				categoryType: "MeshPart",
				items: [
					{
						name: "Meshes",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 40),
						filter: null,
						id: 40,
						type: "AssetType",
						categoryType: "MeshPart",
					},
				],
			},
			{
				name: "Heads",
				displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 4),
				categoryType: "DynamicHead",
				items: [
					{
						name: "Heads",
						displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 4),
						filter: null,
						id: 4,
						type: "Bundle",
						categoryType: "DynamicHead",
					},
					{
						name: "Mood Animations",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 78),
						filter: null,
						id: 78,
						type: "AssetType",
						categoryType: "MoodAnimation",
					},
					{
						name: "Eyebrows",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 76),
						filter: null,
						id: 76,
						type: "AssetType",
						categoryType: "Eyebrows",
					},
					{
						name: "Eyelashes",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 77),
						filter: null,
						id: 77,
						type: "AssetType",
						categoryType: "Eyelashes",
					},
					{
						name: "Dynamic Heads Asset",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 79),
						filter: null,
						id: 79,
						type: "AssetType",
						categoryType: "DynamicHeads",
					},
				],
			},
			{
				name: "Video",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 62),
				categoryType: "Video",
				items: [
					{
						name: "Video",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 62),
						filter: null,
						id: 62,
						type: "AssetType",
						categoryType: "Video",
					},
				],
			},
			{
				name: "Bundles",
				displayName: getMessage("userInventory.categories.bundles"),
				categoryType: "Bundle",
				items: [
					{
						name: "Body Parts",
						displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 1),
						filter: null,
						id: 1,
						type: "Bundle",
						categoryType: "BodyParts",
					},
					{
						name: "Avatar Animations",
						displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 2),
						filter: null,
						id: 2,
						type: "Bundle",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Shoes",
						displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 3),
						filter: null,
						id: 3,
						type: "Bundle",
						categoryType: "Shoes",
					},
				],
			},
			{
				name: "Body Parts",
				displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 1),
				categoryType: "BodyParts",
				items: [
					{
						name: "Torso",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 27),
						filter: null,
						id: 27,
						type: "AssetType",
						categoryType: "Body",
					},
					{
						name: "Right Arm",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 28),
						filter: null,
						id: 28,
						type: "AssetType",
						categoryType: "RightArm",
					},
					{
						name: "Left Arm",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 29),
						filter: null,
						id: 29,
						type: "AssetType",
						categoryType: "LeftArm",
					},
					{
						name: "Left Leg",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 30),
						filter: null,
						id: 30,
						type: "AssetType",
						categoryType: "LeftLeg",
					},
					{
						name: "Right Leg",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 31),
						filter: null,
						id: 31,
						type: "AssetType",
						categoryType: "RightLeg",
					},
				],
			},
			{
				name: "Accessories",
				displayName: getMessage("userInventory.categories.accessories"),
				categoryType: "Accessories",
				items: [
					{
						name: "Head",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 8),
						filter: null,
						id: 8,
						type: "AssetType",
						categoryType: "Hat",
					},
					{
						name: "Face",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 42),
						filter: null,
						id: 42,
						type: "AssetType",
						categoryType: "FaceAccessory",
					},
					{
						name: "Neck",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 43),
						filter: null,
						id: 43,
						type: "AssetType",
						categoryType: "NeckAccessory",
					},
					{
						name: "Shoulder",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 44),
						filter: null,
						id: 44,
						type: "AssetType",
						categoryType: "ShoulderAccessory",
					},
					{
						name: "Front",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 45),
						filter: null,
						id: 45,
						type: "AssetType",
						categoryType: "FrontAccessory",
					},
					{
						name: "Back",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 46),
						filter: null,
						id: 46,
						type: "AssetType",
						categoryType: "BackAccessory",
					},
					{
						name: "Waist",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 47),
						filter: null,
						id: 47,
						type: "AssetType",
						categoryType: "WaistAccessory",
					},
					{
						name: "Gear",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 19),
						filter: null,
						id: 19,
						type: "AssetType",
						categoryType: "Gear",
					},
				],
			},
			{
				name: "Classic Clothing",
				displayName: getMessage("userInventory.categories.classicClothing"),
				categoryType: "ClassicClothing",
				items: [
					{
						name: "Classic T-shirts",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 2),
						filter: null,
						id: 2,
						type: "AssetType",
						categoryType: "TShirt",
					},
					{
						name: "Classic Shirts",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 11),
						filter: null,
						id: 11,
						type: "AssetType",
						categoryType: "Shirt",
					},
					{
						name: "Classic Pants",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 12),
						filter: null,
						id: 12,
						type: "AssetType",
						categoryType: "Pants",
					},
				],
			},
			{
				name: "Hair Accessories",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 41),
				categoryType: "HairAccessory",
				items: [
					{
						name: "Hair",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 41),
						filter: null,
						id: 41,
						type: "AssetType",
						categoryType: "HairAccessory",
					},
				],
			},
			...(isInventory
				? []
				: ([
						{
							name: "Avatars",
							displayName: getItemTypeDisplayLabel("Look", "shortCategory"),
							categoryType: "Avatars",
							items: [
								{
									name: "Avatars",
									displayName: getItemTypeDisplayLabel("Look", "shortCategory"),
									filter: null,
									id: 16,
									type: "AssetType",
									categoryType: "Avatars",
								},
							],
						},
					] satisfies UserInventoryCategory[])),

			{
				name: "Tops",
				displayName: getMessage("userInventory.categories.tops"),
				categoryType: "Tops",
				items: [
					{
						name: "T-shirts",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 64),
						filter: null,
						id: 64,
						type: "AssetType",
						categoryType: "TShirtAccessory",
					},
					{
						name: "Shirts",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 65),
						filter: null,
						id: 65,
						type: "AssetType",
						categoryType: "ShirtAccessory",
					},
					{
						name: "Sweaters",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 68),
						filter: null,
						id: 68,
						type: "AssetType",
						categoryType: "SweaterAccessory",
					},
					{
						name: "Jackets",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 67),
						filter: null,
						id: 67,
						type: "AssetType",
						categoryType: "JacketAccessory",
					},
				],
			},
			{
				name: "Bottoms",
				displayName: getMessage("userInventory.categories.bottoms"),
				categoryType: "Bottoms",
				items: [
					{
						name: "Pants",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 66),
						filter: null,
						id: 66,
						type: "AssetType",
						categoryType: "PantsAccessory",
					},
					{
						name: "Shorts",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 69),
						filter: null,
						id: 69,
						type: "AssetType",
						categoryType: "ShortsAccessory",
					},
					{
						name: "Skirts",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 72),
						filter: null,
						id: 72,
						type: "AssetType",
						categoryType: "SkirtsAccessory",
					},
				],
			},
			{
				name: "Shoes",
				displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 3),
				categoryType: "Shoes",
				items: [
					{
						name: "Left Shoe",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 70),
						filter: null,
						id: 70,
						type: "AssetType",
						categoryType: "LeftShoeAccessory",
					},
					{
						name: "Right Shoe",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 71),
						filter: null,
						id: 71,
						type: "AssetType",
						categoryType: "RightShoeAccessory",
					},
				],
			},
			{
				name: "Emote Animations",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 61),
				categoryType: "EmoteAnimation",
				items: [
					{
						name: "Emotes",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 61),
						filter: null,
						id: 61,
						type: "AssetType",
						categoryType: "EmoteAnimation",
					},
				],
			},
			{
				name: "Places",
				displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 9),
				categoryType: "Place",
				items:
					isInventory && isSelf
						? [
								{
									name: "Created by Me",
									displayName: getMessage("userInventory.categories.createdByMe"),
									filter: "Created",
									id: 9,
									type: "AssetType",
									categoryType: "Created",
								},
								{
									name: "Purchased",
									displayName: getMessage("userInventory.categories.purchased"),
									filter: "Purchased",
									id: 9,
									type: "AssetType",
									categoryType: "Purchased",
								},
								{
									name: "My Experiences",
									displayName: getMessage(
										"userInventory.categories.myExperiences",
									),
									filter: "MyGames",
									id: 9,
									type: "AssetType",
									categoryType: "MyGames",
								},
								{
									name: "Other Experiences",
									displayName: getMessage(
										"userInventory.categories.otherExperiences",
									),
									filter: "OtherGames",
									id: 9,
									type: "AssetType",
									categoryType: "OtherGames",
								},
							]
						: [
								{
									name: "Places",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										9,
									),
									filter: null,
									id: 9,
									type: "AssetType",
									categoryType: "Place",
								},
							],
			},
			{
				name: "Avatar Animations",
				displayName: getItemTypeDisplayLabel("Bundle", "shortCategory", 2),
				categoryType: "AvatarAnimations",
				items: [
					{
						name: "Run",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 53),
						filter: null,
						id: 53,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Walk",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 55),
						filter: null,
						id: 55,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Fall",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 50),
						filter: null,
						id: 50,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Jump",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 52),
						filter: null,
						id: 52,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Idle",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 51),
						filter: null,
						id: 51,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Swim",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 54),
						filter: null,
						id: 54,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					{
						name: "Climb",
						displayName: getItemTypeDisplayLabel("Asset", "shortCategory", 48),
						filter: null,
						id: 48,
						type: "AssetType",
						categoryType: "AvatarAnimations",
					},
					...(includeUnusedAssetTypes
						? ([
								{
									name: "Pose",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										56,
									),
									filter: null,
									id: 56,
									type: "AssetType",
									categoryType: "AvatarAnimations",
								},
								{
									name: "Death",
									displayName: getItemTypeDisplayLabel(
										"Asset",
										"shortCategory",
										49,
									),
									filter: null,
									id: 49,
									type: "AssetType",
									categoryType: "AvatarAnimations",
								},
							] satisfies UserInventoryCategoryItem[])
						: []),
				],
			},
			...(appendCategories ?? []),
		],
	} satisfies ListUserInventoryCategoriesResponse;

	return data;
}
