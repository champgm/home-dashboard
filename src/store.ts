import Vue from 'vue';
import Vuex, { StoreOptions, MutationTree, CommitOptions, Payload, Commit, GetterTree } from 'vuex';
import { ILight } from 'node-hue-api';
import Api from './util/Api';
import { isContext } from 'vm';
import { isEmptyOrBlank } from './util/Objects';

const api = new Api();
Vue.use(Vuex);


export interface RootState {
  lightsLoading: boolean;
  lightsPromise: Promise<ILight[]>;
  lights: { [id: string]: ILight };
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
}

export enum Getters {
  lights = 'lights',
  lightsLoading = 'lightsLoading',
}

async function updateIndividualLights(state, lightsPromise: Promise<ILight[]>) {
  const newLights = await lightsPromise;
  newLights.forEach((newLight) => {
    const currentLight = state.lights[newLight.id];
    if (newLight !== currentLight) {
      Vue.set(state.lights, newLight.id, newLight);
    }
  });
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    lightsLoading: true,
    lightsPromise: undefined,
    lights: {},
  },
  mutations: {
    [Mutators.refreshLights]: async (state) => {
      console.log(`refreshLights called`);
      state.lightsLoading = true;
      await updateIndividualLights(state, api.getLights());
      console.log(`Lights are loaded.`);
      state.lightsLoading = false;
    },
    [Mutators.toggleLight]: async (state, payload: ILight) => {
      console.log(`toggleLight called with payload: ${payload}`);
      await updateIndividualLights(state, api.toggleLight(payload));
    },
  },
  actions: {
    [Mutators.refreshLights]: async (context) => {
      context.commit(Mutators.refreshLights);
    },
    [Mutators.toggleLight]: async (context, payload: ILight) => {
      context.commit(Mutators.toggleLight, payload);
    },
  },
  getters: {
    [Getters.lights]: (state) => state.lights,
    [Getters.lightsLoading]: (state) => state.lightsLoading,
  },
};

// export const store = new Vuex.Store(storeOptions);
export const store = new MyStore(storeOptions);
setInterval(() => {
  updateIndividualLights(store.state, api.getLights());
}, 5000);

