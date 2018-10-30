import Vue from 'vue';
import Vuex, { StoreOptions, CommitOptions, Commit } from 'vuex';
import { ILight } from 'node-hue-api';
import Api from './util/Api';
import { IPlug, Favorites } from './util/Interfaces';
import { isEmptyOrBlank, byName } from './util/Objects';

const api = new Api();
Vue.use(Vuex);

export interface RootState {
  lightsPromise: Promise<ILight[]>;
  lights: { [id: string]: ILight };
  plugs: { [id: string]: IPlug };
  favorites: Favorites;
}

export function isFavorite(itemId: any, favorites: string[]) {
  return favorites.indexOf(itemId) > -1;
}

export interface MyCommit extends Commit {
  (type: Mutate, payload?: any, options?: CommitOptions): void;
}

export class MyStore extends Vuex.Store<RootState> {
  public commit: MyCommit = super.commit;
}

export enum Mutate {
  refreshLights = 'refreshLights',
  toggleLight = 'toggleLight',
  editLight = 'editLight',
  refreshPlugs = 'refreshPlugs',
  editPlug = 'editPlug',
  togglePlug = 'togglePlug',
  refreshFavorites = 'refreshFavorites',
  toggleFavorite = 'toggleFavorite',
}

export enum Get {
  lights = 'lights',
  lightsLoading = 'lightsLoading',
  plugs = 'plugs',
  favorites = 'favorites',
  favoriteIds = 'favoriteIds',
}

async function updateLights(state, lightsPromise: Promise<ILight[]>) {
  const newLights = await lightsPromise;
  newLights.forEach((newLight) => {
    const currentLight = state.lights[newLight.id];
    if ((isEmptyOrBlank(currentLight) || !currentLight.isBeingEdited) &&
      (newLight !== currentLight)) {
      (newLight as any).deviceType = 'light';
      Vue.set(state.lights, newLight.id, newLight);
      Vue.set(state.lights[newLight.id], 'name', newLight.name);
    }
  });
}
async function updatePlugs(state, promise: Promise<{ [id: string]: IPlug }>) {
  const newPlugs = await promise;
  Object.keys(newPlugs).forEach((id) => {
    const currentPlug = state.plugs[id];
    const newPlug = newPlugs[id];
    if ((isEmptyOrBlank(currentPlug) || !currentPlug.isBeingEdited) &&
      (newPlug !== currentPlug)) {
      (newPlug as any).deviceType = 'plug';
      Vue.set(state.plugs, id, newPlug);
    }
  });
}

async function updateFavorites(state, promise: Promise<Favorites>) {
  const updatedFavorites = await promise;

  const currentFavoritePlugs: string[] = state.favorites.plugs;
  const newFavoritePlugs: string[] = updatedFavorites.plugs;
  currentFavoritePlugs.forEach((id) => {
    if (newFavoritePlugs.indexOf(id) < 0 && !state.plugs[id].isBeingEdited) {
      currentFavoritePlugs.splice(currentFavoritePlugs.indexOf(id), 1);
      newFavoritePlugs.splice(newFavoritePlugs.indexOf(id), 1);
    }
  });
  newFavoritePlugs.forEach((id) => {
    currentFavoritePlugs.push(id);
  });

  const currentFavoriteLights: string[] = state.favorites.lights;
  const newFavoriteLights: string[] = updatedFavorites.lights;
  currentFavoriteLights.forEach((id) => {
    if (newFavoriteLights.indexOf(id) < 0 && !state.lights[id].isBeingEdited) {
      currentFavoriteLights.splice(currentFavoriteLights.indexOf(id), 1);
      newFavoriteLights.splice(newFavoriteLights.indexOf(id), 1);
    }
  });
  newFavoriteLights.forEach((id) => {
    currentFavoriteLights.push(id);
  });
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    lightsPromise: undefined,
    lights: {},
    plugs: {},
    favorites: { plugs: [], lights: [] },
  },
  mutations: {
    [Mutate.refreshLights]: async (state) => {
      await updateLights(state, api.getLights());
    },
    [Mutate.editLight]: async (state, payload: ILight) => {
      await updateLights(state, api.editLight(payload));
    },
    [Mutate.toggleLight]: async (state, payload: ILight) => {
      await updateLights(state, api.toggleLight(payload));
    },
    [Mutate.refreshPlugs]: async (state) => {
      await updatePlugs(state, api.getPlugs());
    },
    [Mutate.editPlug]: async (state, payload: IPlug) => {
      await updatePlugs(state, api.editPlug(payload));
    },
    [Mutate.togglePlug]: async (state, payload: IPlug) => {
      await updatePlugs(state, api.togglePlug(payload));
    },
    [Mutate.refreshFavorites]: async (state) => {
      await updateFavorites(state, api.getFavorites());
    },
    [Mutate.toggleFavorite]: async (state, payload) => {
      await updateFavorites(state, api.toggleFavorite(payload));
    },
  },
  actions: {
    [Mutate.refreshLights]: async (context) => {
      context.commit(Mutate.refreshLights);
    },
    [Mutate.editLight]: async (context, payload: ILight) => {
      context.commit(Mutate.editLight, payload);
    },
    [Mutate.toggleLight]: async (context, payload: ILight) => {
      context.commit(Mutate.toggleLight, payload);
    },
    [Mutate.refreshPlugs]: async (context) => {
      context.commit(Mutate.refreshPlugs);
    },
    [Mutate.editPlug]: async (context, payload: IPlug) => {
      context.commit(Mutate.editPlug, payload);
    },
    [Mutate.togglePlug]: async (context, payload: IPlug) => {
      context.commit(Mutate.togglePlug, payload);
    },
    [Mutate.refreshFavorites]: async (context) => {
      context.commit(Mutate.refreshFavorites);
    },
    [Mutate.toggleFavorite]: async (context, payload) => {
      context.commit(Mutate.toggleFavorite, payload);
    },
  },
  getters: {
    [Get.lights]: (state) => state.lights,
    [Get.plugs]: (state) => state.plugs,
    [Get.favorites]: (state) => {
      const lights = Object.values(state.lights)
        .filter((item) => isFavorite(item.id, state.favorites.lights))
        .sort(byName);
      const plugs = Object.values(state.plugs)
        .filter((item) => isFavorite(item.id, state.favorites.plugs))
        .sort(byName);
      return { lights, plugs };
    },
    [Get.favoriteIds]: (state) => {
      const lights = Object.keys(state.lights)
        .filter((id) => isFavorite(id, state.favorites.lights));
      const plugs = Object.keys(state.plugs)
        .filter((id) => isFavorite(id, state.favorites.plugs));
      return { lights, plugs };
    },
  },
};

export const store = new MyStore(storeOptions);
setInterval(() => {
  console.log(`Refreshing device lists`);
  updateLights(store.state, api.getLights());
  updatePlugs(store.state, api.getPlugs());
  updateFavorites(store.state, api.getFavorites());
}, 5000);

