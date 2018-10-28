import Vue from 'vue';
import Vuex, { StoreOptions, MutationTree, CommitOptions, Payload, Commit, GetterTree } from 'vuex';
import { ILight } from 'node-hue-api';
import Api from './util/Api';
import { isContext } from 'vm';
import { isEmptyOrBlank } from './util/Objects';
import { IPlug } from './util/IPlug';

const api = new Api();
Vue.use(Vuex);


export interface RootState {
  lightsLoading: boolean;
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
  refreshPlugs = 'refreshPlugs',
  togglePlug = 'togglePlug',
}

export enum Getters {
  lights = 'lights',
  lightsLoading = 'lightsLoading',
  plugs = 'plugs',
}

async function updateIndividualLights(state, lightsPromise: Promise<ILight[]>) {
  const newLights = await lightsPromise;
  newLights.forEach((newLight) => {
    const currentLight = state.lights[newLight.id];
    if (newLight !== currentLight) {
      Vue.set(state.lights, newLight.id, newLight);
    }
  });
  console.log(`All lights: ${JSON.stringify(state.lights)}`);
}
async function updateIndividualPlugs(state, promise: Promise<{ [id: string]: IPlug }>) {
  const newPlugs = await promise;
  Object.keys(newPlugs).forEach((id) => {
    const currentPlug = state.plugs[id];
    const newPlug = newPlugs[id];
    if (newPlug !== currentPlug) {
      Vue.set(state.plugs, id, newPlug);
    }
  });
  console.log(`All plugs: ${JSON.stringify(state.plugs)}`);
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    lightsLoading: true,
    lightsPromise: undefined,
    lights: {},
    plugs: {},
  },
  mutations: {
    [Mutators.refreshLights]: async (state) => {
      console.log(`refreshLights called`);
      state.lightsLoading = true;
      await updateIndividualLights(state, api.getLights());
      console.log(`Lights are loaded`);
      state.lightsLoading = false;
    },
    [Mutators.toggleLight]: async (state, payload: ILight) => {
      console.log(`toggleLight called with payload: ${payload}`);
      await updateIndividualLights(state, api.toggleLight(payload));
    },
    [Mutators.refreshPlugs]: async (state) => {
      await updateIndividualPlugs(state, api.getPlugs());
    },
    [Mutators.togglePlug]: async (state, payload: IPlug) => {
      await updateIndividualPlugs(state, api.togglePlug(payload));
    },
  },
  actions: {
    [Mutators.refreshLights]: async (context) => {
      context.commit(Mutators.refreshLights);
    },
    [Mutators.toggleLight]: async (context, payload: ILight) => {
      context.commit(Mutators.toggleLight, payload);
    },
    [Mutators.refreshPlugs]: async (context) => {
      context.commit(Mutators.refreshPlugs);
    },
    [Mutators.togglePlug]: async (context, payload: ILight) => {
      context.commit(Mutators.togglePlug, payload);
    },
  },
  getters: {
    [Getters.lights]: (state) => state.lights,
    [Getters.lightsLoading]: (state) => state.lightsLoading,
    [Getters.plugs]: (state) => state.plugs,
  },
};

// export const store = new Vuex.Store(storeOptions);
export const store = new MyStore(storeOptions);
setInterval(() => {
  updateIndividualLights(store.state, api.getLights());
  updateIndividualPlugs(store.state, api.getPlugs());
}, 5000);

