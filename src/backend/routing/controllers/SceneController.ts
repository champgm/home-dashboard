import * as bunyan from 'bunyan';
import * as makeRequest from 'request-promise';
import UtilityScenes from './utilities/UtilityScenes';
import LightController from './LightController';
import CommonController from './CommonController';
import * as path from 'path';
import { LoggerParent } from '../../logger/logger';
import IScene from '../../../common/interfaces/IScene';
import ILight from '../../../common/interfaces/ILight';
import IState from '../../../common/interfaces/IState';
import IMap from '../../../common/interfaces/IMap';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
const type: string = 'scenes';

export default class SceneController extends CommonController<IScene> {
  lightController: LightController;

  constructor(bridgeUri: string) {
    super(type, bridgeUri, bunyanLogger);
    this.lightController = new LightController(bridgeUri);
  }

  async get(id: string): Promise<IScene> {
    if (Object.keys(UtilityScenes.AllUtilityScenes).indexOf(id) > -1) {
      return UtilityScenes.AllUtilityScenes[id];
    }
    const scene: IScene = await super.get(id);
    scene.storelightstate = false;
    return scene;
  }

  async getAll(v2ScenesRequested?: boolean): Promise<IMap<IScene>> {
    if (v2ScenesRequested) {
      bunyanLogger.info('V2 Scenes requested, will return only V2 scenes.');
    } else {
      bunyanLogger.info('V2 Scenes not requested, will return all.');
    }

    // First, get all of the bridge scenes
    const scenes: IMap<IScene> = await super.getAll();

    // Start collecting all scenes.
    const resultScenes: IMap<IScene> = {};

    // Add any Utility scenes first.
    const utilityScenes: IMap<IScene> = UtilityScenes.AllUtilityScenes;
    for (const sceneId in utilityScenes) {
      if (Object.prototype.hasOwnProperty.call(utilityScenes, sceneId)) {
        resultScenes[sceneId] = utilityScenes[sceneId];
      }
    }

    // Now, we need to record each light's ID INSIDE of the light.
    // While we do this, we might as well do the V2 filtering as well.
    // For each top-level attribute (which, if it's what we're looking for, will be a scene ID)
    Object.keys(scenes).forEach((sceneId) => {
      // Check to make sure it's a real attribute and not some weird superclass attribute
      const scene: IScene = scenes[sceneId];

      // Filter out non-V2 scenes, if they're not wanted.
      if (v2ScenesRequested) {
        if (scene.version === 2) {
          resultScenes[sceneId] = scenes[sceneId];
        } else {
          // bunyanLogger.info({ sceneVersion: scene.version || 'undefined' }, 'Scene version was not 2');
        }
      } else {
        resultScenes[sceneId] = scenes[sceneId];
      }
    });

    return resultScenes;
  }

  async select(sceneId: string): Promise<IState> {
    bunyanLogger.info({ sceneId }, 'Select called for scene.');
    if (UtilityScenes.getAllUtilitySceneIds().includes(sceneId)) {
      bunyanLogger.info('Scene ID represents a utility scene.');
      switch (sceneId) {
        case UtilityScenes.getAllOffId(): {
          const lights: IMap<ILight> = await this.lightController.getAll();
          for (const lightId in Object.keys(lights)) {
            if (Object.prototype.hasOwnProperty.call(lights, lightId)) {
              await this.lightController.turnOff(lightId);
            }
          }
          return { on: false };
        }
        default: {
          const unsupportedMessage: string = `Unsupported utility scene ID: ${sceneId}`;
          bunyanLogger.info(unsupportedMessage);
          throw new Error(unsupportedMessage);
        }
      }
    } else {
      bunyanLogger.info('Scene ID represents a normal scene.');
      const scene: IScene = await this.get(sceneId);
      for (const lightId in scene.lightStates) {
        if (Object.prototype.hasOwnProperty.call(scene.lightStates, lightId)) {
          const lightState: IState = scene.lightStates[lightId];
          await this.lightController.setState(lightId, lightState);
        }
      }

      // Return the current state of the scene
      return { on: true };
    }
  }

  async update(itemId: string, json: any): Promise<IScene> {
    const uri: string = `${this.type}/${itemId}`;
    if (!json.storelightstate) {
      delete json.storelightstate;
    }
    const putOptions: any = this.requestOptionsUtil.putWithBody(uri, json);
    const response: any = await makeRequest(putOptions);
    return response;
  }

  setState(itemId: string, state: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getState(itemId: string): Promise<IState> {
    throw new Error('Method not implemented.');
  }
}
