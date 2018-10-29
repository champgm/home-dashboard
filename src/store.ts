import Vue from 'vue';
import Vuex, { StoreOptions, CommitOptions, Commit } from 'vuex';
import { ILight } from 'node-hue-api';
import Api from './util/Api';
import { IPlug } from './util/IPlug';
import { isEmptyOrBlank } from './util/Objects';

const api = new Api();
Vue.use(Vuex);


export interface RootState {
  lightsPromise: Promise<ILight[]>;
  lights: { [id: string]: ILight };
  plugs: { [id: string]: IPlug };
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
}

export enum Getters {
  lights = 'lights',
  lightsLoading = 'lightsLoading',
  plugs = 'plugs',
}

// function nothingIsBeingEdited(state) {
//   const isBeingEdited = (thing) => thing.isBeingEdited;
//   return !Object.values(state.lights)
//     .concat(Object.values(state.plugs))
//     .some(isBeingEdited);
// }

async function updateIndividualLights(state, lightsPromise: Promise<ILight[]>) {
  const newLights = await lightsPromise;
  newLights.forEach((newLight) => {
    const currentLight = state.lights[newLight.id];
    if ((isEmptyOrBlank(currentLight) || !currentLight.isBeingEdited) &&
      (newLight !== currentLight)) {
      Vue.set(state.lights, newLight.id, newLight);
      Vue.set(state.lights[newLight.id], 'name', newLight.name);
    }
  });
  // console.log(`All lights: ${JSON.stringify(state.lights)}`);
}
async function updateIndividualPlugs(state, promise: Promise<{ [id: string]: IPlug }>) {
  const newPlugs = await promise;
  Object.keys(newPlugs).forEach((id) => {
    const currentPlug = state.plugs[id];
    const newPlug = newPlugs[id];
    if ((isEmptyOrBlank(currentPlug) || !currentPlug.isBeingEdited) &&
      (newPlug !== currentPlug)) {
      Vue.set(state.plugs, id, newPlug);
    }
  });
  // console.log(`All plugs: ${JSON.stringify(state.plugs)}`);
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    lightsPromise: undefined,
    lights: {},
    plugs: {},
  },
  mutations: {
    [Mutators.refreshLights]: async (state) => {
      await updateIndividualLights(state, api.getLights());
    },
    [Mutators.editLight]: async (state, payload: ILight) => {
      await updateIndividualLights(state, api.editLight(payload));
    },
    [Mutators.toggleLight]: async (state, payload: ILight) => {
      await updateIndividualLights(state, api.toggleLight(payload));
    },
    [Mutators.refreshPlugs]: async (state) => {
      await updateIndividualPlugs(state, api.getPlugs());
    },
    [Mutators.editPlug]: async (state, payload: IPlug) => {
      await updateIndividualPlugs(state, api.editPlug(payload));
    },
    [Mutators.togglePlug]: async (state, payload: IPlug) => {
      await updateIndividualPlugs(state, api.togglePlug(payload));
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
  },
  getters: {
    [Getters.lights]: (state) => state.lights,
    [Getters.plugs]: (state) => state.plugs,
  },
};

// export const store = new Vuex.Store(storeOptions);
export const store = new MyStore(storeOptions);
setInterval(() => {
  console.log(`Refreshing device lists`);
  updateIndividualLights(store.state, api.getLights());
  updateIndividualPlugs(store.state, api.getPlugs());
}, 5000);

