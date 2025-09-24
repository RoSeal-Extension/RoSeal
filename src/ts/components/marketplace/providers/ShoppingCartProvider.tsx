import { type ComponentChildren, createContext } from "preact";
import { useCallback, useContext } from "preact/hooks";
import {
	MARKETPLACE_CART_LOCALSTORAGE_PREFIX,
	MARKETPLACE_CART_MAX_ITEMS_NUMBER,
} from "src/ts/constants/marketplace";
import {
	listCollectibleResellers,
	multigetAvatarItems,
	multigetCollectibleItemsByIds,
	type AvatarItemDetail,
	type Collectible,
	type CollectibleReseller,
	type MarketplaceItemType,
} from "src/ts/helpers/requests/services/marketplace";
import useAuthenticatedUser from "../../hooks/useAuthenticatedUser";
import { useLocalStorage } from "usehooks-ts";
import { success } from "../../core/systemFeedback/helpers/globalSystemFeedback";
import { getMessage } from "src/ts/helpers/i18n/getMessage";

export type MarketplaceShoppingCartItemDetail<T extends MarketplaceItemType = MarketplaceItemType> =
	AvatarItemDetail<T> & {
		collectibleItemDetails?: Collectible;
	};

export type MarketplaceShoppingCartItem = {
	addedToCartAt: number;
	collectibleItemId?: string;
	itemId: number;
	itemName: string;
	itemType: MarketplaceItemType;
};

export type MarketplaceShoppingCartData = {
	currentUserBalance: number;
	itemDetails: Record<string, MarketplaceShoppingCartItemDetail>;
	items: MarketplaceShoppingCartItem[];
	resellers: Record<number, CollectibleReseller[]>;
	selectedItems: Record<string, boolean>;
	totalPrice: number;
};

export type MarketplaceCartContextData = {
	shoppingCart?: MarketplaceShoppingCartData;
	isShoppingCartFull?: boolean;
	toggleShoppingCart?: (itemType: MarketplaceItemType, itemId: number) => Promise<void>;
};

export type MarketplaceCartProviderProps = {
	children: ComponentChildren;
};

const MarketplaceCartContext = createContext<MarketplaceCartContextData>({});

export default function MarketplaceCartProvider({ children }: MarketplaceCartProviderProps) {
	const [authenticatedUser] = useAuthenticatedUser();
	const [shoppingCart, setShoppingCart] = useLocalStorage<MarketplaceShoppingCartData>(
		`${MARKETPLACE_CART_LOCALSTORAGE_PREFIX}${authenticatedUser?.userId}`,
		{
			currentUserBalance: 0,
			itemDetails: {},
			items: [],
			resellers: {},
			selectedItems: {},
			totalPrice: 0,
		},
	);

	const isShoppingCartFull = shoppingCart.items.length >= MARKETPLACE_CART_MAX_ITEMS_NUMBER;
	const toggleShoppingCart = useCallback(
		async (itemType: MarketplaceItemType, itemId: number) => {
			if (isShoppingCartFull) return;

			for (let i = 0; i < shoppingCart.items.length; i++) {
				const item = shoppingCart.items[i];
				if (item.itemType === itemType && item.itemId === itemId) {
					shoppingCart.items.splice(i, 1);

					delete shoppingCart.itemDetails[itemId];
					delete shoppingCart.resellers[itemId];
					delete shoppingCart.selectedItems[`${itemType.toLowerCase()}${itemId}`];

					setShoppingCart({
						...shoppingCart,
					});
					return success(getMessage("marketplace.cart.systemFeedback.removeItem"));
				}
			}

			return multigetAvatarItems({
				items: [
					{
						itemType,
						id: itemId,
					},
				],
			}).then(async (_data) => {
				const data: MarketplaceShoppingCartItemDetail = _data[0];
				if (data.collectibleItemId) {
					data.collectibleItemDetails = (
						await multigetCollectibleItemsByIds({
							itemIds: [data.collectibleItemId],
						})
					)[0];
				}

				if (data.collectibleItemDetails?.lowestResalePrice) {
					const resellers = await listCollectibleResellers({
						collectibleItemId: data.collectibleItemId!,
						limit: 30,
					});

					shoppingCart.resellers[itemId] = resellers.data;
				}

				shoppingCart.selectedItems[`${itemType.toLowerCase()}${itemId}`] = true;
				shoppingCart.itemDetails[itemId] = data;
				shoppingCart.items.push({
					addedToCartAt: Math.floor(Date.now() / 1_000),
					collectibleItemId: data.collectibleItemId,
					itemId,
					itemType,
					itemName: data.name,
				});
				shoppingCart.totalPrice += data.lowestPrice;

				setShoppingCart({
					...shoppingCart,
				});

				return success(getMessage("marketplace.cart.systemFeedback.addItem"));
			});
		},
		[shoppingCart],
	);

	return (
		<MarketplaceCartContext.Provider
			value={{
				shoppingCart,
				isShoppingCartFull,
				toggleShoppingCart,
			}}
		>
			{children}
		</MarketplaceCartContext.Provider>
	);
}

export function useMarketplaceCart() {
	return useContext(MarketplaceCartContext);
}
