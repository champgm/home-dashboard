import Vue from 'vue';
import Vuex, { StoreOptions, CommitOptions, Commit } from 'vuex';
import { ILight } from 'node-hue-api';
import Api from './util/Api';
import { IPlug } from './util/IPlug';
import { isEmptyOrBlank, byName } from './util/Objects';

const api = new Api();
Vue.use(Vuex);

interface Favorites {
  plugs: string[];
  lights: string[];
}

export interface RootState {
  lightsPromise: Promise<ILight[]>;
  lights: { [id: string]: ILight };
  plugs: { [id: string]: IPlug };
  favorites: Favorites;
}

export function isFavorite(item: any, favorites: string[]) {
  return favorites.indexOf(item.id) > -1;
}

export interface MyCommit extends Commit {
  (type: Mutators, payload?: any, options?: CommitOptions): void;
}

export class MyStore extends Vuex.Store<RootState> {
  public commit: MyCommit = super.commit;
}

export enum Mutators {
  refreshLights = 'refreshLights',
  toggleLight = 'toggleLight',
  editLight = 'editLight',
  refreshPlugs = 'refreshPlugs',
  editPlug = 'editPlug',
  togglePlug = 'togglePlug',
  refreshFavorites = 'refreshFavorites',
}

export enum Getters {
  lights = 'lights',
  lightsLoading = 'lightsLoading',
  plugs = 'plugs',
  favorites = 'favorites',
}

async function updateLights(state, lightsPromise: Promise<ILight[]>) {
  const newLights = await lightsPromise;
  newLights.forEach((newLight) => {
    const currentLight = state.lights[newLight.id];
    if ((isEmptyOrBlank(currentLight) || !currentLight.isBeingEdited) &&
      (newLight !== currentLight)) {
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
      Vue.set(state.plugs, id, newPlug);
    }
  });
}

async function updateFavorites(state, promise: Promise<Favorites>) {
  Vue.set(state, 'favorites', await promise);
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    lightsPromise: undefined,
    lights: {},
    plugs: {},
    favorites: { plugs: [], lights: [] },
  },
  mutations: {
    [Mutators.refreshLights]: async (state) => {
      await updateLights(state, api.getLights());
    },
    [Mutators.editLight]: async (state, payload: ILight) => {
      await updateLights(state, api.editLight(payload));
    },
    [Mutators.toggleLight]: async (state, payload: ILight) => {
      await updateLights(state, api.toggleLight(payload));
    },
    [Mutators.refreshPlugs]: async (state) => {
      await updatePlugs(state, api.getPlugs());
    },
    [Mutators.editPlug]: async (state, payload: IPlug) => {
      await updatePlugs(state, api.editPlug(payload));
    },
    [Mutators.togglePlug]: async (state, payload: IPlug) => {
      await updatePlugs(state, api.togglePlug(payload));
    },
    [Mutators.refreshFavorites]: async (state) => {
      await updateFavorites(state, api.getFavorites());
    },
  },
  actions: {
    [Mutators.refreshLights]: async (context) => {
      context.commit(Mutators.refreshLights);
    },
    [Mutators.editLight]: async (context, payload: ILight) => {
      context.commit(Mutators.editLight, payload);
    },
    [Mutators.toggleLight]: async (context, payload: ILight) => {
      context.commit(Mutators.toggleLight, payload);
    },
    [Mutators.refreshPlugs]: async (context) => {
      context.commit(Mutators.refreshPlugs);
    },
    [Mutators.editPlug]: async (context, payload: IPlug) => {
      context.commit(Mutators.editPlug, payload);
    },
    [Mutators.togglePlug]: async (context, payload: IPlug) => {
      context.commit(Mutators.togglePlug, payload);
    },
    [Mutators.refreshFavorites]: async (context) => {
      context.commit(Mutators.refreshFavorites);
    },
  },
  getters: {
    [Getters.lights]: (state) => state.lights,
    [Getters.plugs]: (state) => state.plugs,
    [Getters.favorites]: (state) => {
      const lights = Object.values(state.lights)
        .filter((item) => isFavorite(item, state.favorites.lights))
        .sort(byName);
      const plugs = Object.values(state.plugs)
        .filter((item) => isFavorite(item, state.favorites.plugs))
        .sort(byName);
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

