import Vue from 'vue';
import Vuex, { StoreOptions, CommitOptions, Commit } from 'vuex';
import { ILight, ILightGroup } from 'node-hue-api';
import Api from './util/Api';
import { IPlug, Favorites } from './util/Interfaces';
import { isEmptyOrBlank, byName } from './util/Objects';

const api = new Api();
Vue.use(Vuex);

export interface RootState {
  groups: { [id: string]: ILightGroup };
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
  editGroup = 'editGroup',
  editLight = 'editLight',
  editPlug = 'editPlug',
  refreshFavorites = 'refreshFavorites',
  refreshGroups = 'refreshGroups',
  refreshLights = 'refreshLights',
  refreshPlugs = 'refreshPlugs',
  toggleFavorite = 'toggleFavorite',
  toggleGroup = 'toggleGroup',
  toggleLight = 'toggleLight',
  togglePlug = 'togglePlug',
}

export enum Get {
  favoriteIds = 'favoriteIds',
  favorites = 'favorites',
  groups = 'groups',
  lights = 'lights',
  lightsLoading = 'lightsLoading',
  plugs = 'plugs',
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
async function updateGroups(state, groupsPromise: Promise<ILightGroup[]>) {
  const newGroups = await groupsPromise;
  newGroups.forEach((newGroup) => {
    const currentGroup = state.groups[newGroup.id];
    if ((isEmptyOrBlank(currentGroup) || !currentGroup.isBeingEdited) &&
      (newGroup !== currentGroup)) {
      (newGroup as any).deviceType = 'group';
      Vue.set(state.groups, newGroup.id, newGroup);
      Vue.set(state.groups[newGroup.id], 'name', newGroup.name);
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
    if (currentFavoritePlugs.indexOf(id)) {
      currentFavoritePlugs.push(id);
    }
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
    if (currentFavoriteLights.indexOf(id)) {
      currentFavoriteLights.push(id);
    }
  });

  const currentFavoriteGroups: string[] = state.favorites.groups;
  const newFavoriteGroups: string[] = updatedFavorites.groups;
  currentFavoriteGroups.forEach((id) => {
    if (newFavoriteGroups.indexOf(id) < 0 && !state.groups[id].isBeingEdited) {
      currentFavoriteGroups.splice(currentFavoriteGroups.indexOf(id), 1);
      newFavoriteGroups.splice(newFavoriteGroups.indexOf(id), 1);
    }
  });
  newFavoriteGroups.forEach((id) => {
    if (currentFavoriteGroups.indexOf(id)) {
      currentFavoriteGroups.push(id);
    }
  });
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    groups: {},
    lights: {},
    plugs: {},
    favorites: { plugs: [], lights: [], groups: [] },
  },
  mutations: {
    [Mutate.refreshLights]: async (state) => {
      updateLights(state, api.getLights());
    },
    [Mutate.editLight]: async (state, payload: ILight) => {
      updateLights(state, api.editLight(payload));
    },
    [Mutate.toggleLight]: async (state, payload: ILight) => {
      updateLights(state, api.toggleLight(payload));
    },
    [Mutate.refreshGroups]: async (state) => {
      updateGroups(state, api.getGroups());
    },
    [Mutate.editGroup]: async (state, payload: ILightGroup) => {
      updateGroups(state, api.editGroup(payload));
    },
    [Mutate.toggleGroup]: async (state, payload: ILightGroup) => {
      updateGroups(state, api.toggleGroup(payload));
    },
    [Mutate.refreshPlugs]: async (state) => {
      updatePlugs(state, api.getPlugs());
    },
    [Mutate.editPlug]: async (state, payload: IPlug) => {
      updatePlugs(state, api.editPlug(payload));
    },
    [Mutate.togglePlug]: async (state, payload: IPlug) => {
      updatePlugs(state, api.togglePlug(payload));
    },
    [Mutate.refreshFavorites]: async (state) => {
      updateFavorites(state, api.getFavorites());
    },
    [Mutate.toggleFavorite]: async (state, payload) => {
      updateFavorites(state, api.toggleFavorite(payload));
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
    [Mutate.refreshGroups]: async (context) => {
      context.commit(Mutate.refreshGroups);
    },
    [Mutate.editGroup]: async (context, payload: ILightGroup) => {
      context.commit(Mutate.editGroup, payload);
    },
    [Mutate.toggleGroup]: async (context, payload: ILightGroup) => {
      context.commit(Mutate.toggleGroup, payload);
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
    [Get.groups]: (state) => state.groups,
    [Get.favorites]: (state) => {
      const lights = Object.values(state.lights)
        .filter((item) => isFavorite(item.id, state.favorites.lights))
        .sort(byName);
      const plugs = Object.values(state.plugs)
        .filter((item) => isFavorite(item.id, state.favorites.plugs))
        .sort(byName);
      const groups = Object.values(state.groups)
        .filter((item) => isFavorite(item.id, state.favorites.groups))
        .sort(byName);
      return { lights, plugs, groups };
    },
    [Get.favoriteIds]: (state): { lights: string[], plugs: string[], groups: string[] } => {
      const lights = Object.keys(state.lights)
        .filter((id) => isFavorite(id, state.favorites.lights));
      const plugs = Object.keys(state.plugs)
        .filter((id) => isFavorite(id, state.favorites.plugs));
      const groups = Object.keys(state.groups)
        .filter((id) => isFavorite(id, state.favorites.groups));
      return { lights, plugs, groups };
    },
  },
};

export const store = new MyStore(storeOptions);
setInterval(async () => {
  console.log(`Refreshing device lists`);
  updateGroups(store.state, api.getGroups());
  updateLights(store.state, api.getLights());
  updatePlugs(store.state, api.getPlugs());
  updateFavorites(store.state, api.getFavorites());
}, 5000);

