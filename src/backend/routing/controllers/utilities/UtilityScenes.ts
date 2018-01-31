import IScene from '../../../../common/interfaces/IScene';
import IMap from '../../../../common/interfaces/IMap';

export default class UtilityScenes {
  static AllUtilityScenes: any = {
    [UtilityScenes.getAllOffId()]: UtilityScenes.getAllOffScene()
  };
  // allUtilityScenes[] = UtilityScenes.getAllOffScene();

  static getAllUtilitySceneIds(): string[] {
    return [UtilityScenes.getAllOffId()];
  }

  // static getAllUtilityScenes(): IMap<IScene> {
  //   UtilityScenes.allUtilityScenes
  // }

  static getAllOffId(): string {
    return 'ee29c141-c738-44ec-8863-c4feff3741b7';
  }

  static getAllOffScene(): IScene {
    const allOffScene: IScene = {
      name: 'ALL OFF',
      id: UtilityScenes.getAllOffId(),
      version: 2
    };
    return allOffScene;
  }
}
