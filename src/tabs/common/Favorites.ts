import { AsyncStorage } from "react-native";
import { triggerUpdate } from "./Alerter";

export async function toggleFavorite(arrayName: string, itemId: string) {
  const favorites = await getFavoriteArray(arrayName);
  const currentIndex = favorites.indexOf(itemId, 0);
  if (currentIndex > -1) {
    favorites.splice(currentIndex, 1);
  } else {
    favorites.push(itemId);
  }
  await AsyncStorage.setItem(arrayName, JSON.stringify(favorites));
  triggerUpdate();
}

export async function getFavoriteArray(arrayName: string): Promise<string[]> {
  const rawFavorites = await AsyncStorage.getItem(arrayName);
  const favorites: string[] = rawFavorites ? JSON.parse(rawFavorites) : [];
  return favorites;
}
