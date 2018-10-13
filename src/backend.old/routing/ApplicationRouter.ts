import WebApplication from './applications/WebApplication';
import RequestOptionsUtil from './controllers/utilities/RequestOptionsUtil';
import ScheduleController from './controllers/ScheduleController';
import SensorController from './controllers/SensorController';
import LightController from './controllers/LightController';
import SceneController from './controllers/SceneController';
import GroupController from './controllers/GroupController';
import PlugController from './controllers/PlugController';
import RuleController from './controllers/RuleController';
import {errorHandler} from './middleware/HandleErrors';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import { BridgeDetails } from '../configuration/BridgeDetails';
import { Ports } from '../configuration/Ports';

export interface Controllers {
  requestOptionsUtil: RequestOptionsUtil;
  scheduleController: ScheduleController;
  sensorController: SensorController;
  lightController: LightController;
  sceneController: SceneController;
  groupController: GroupController;
  ruleController: RuleController;
  plugController: PlugController;
}

export default class ApplicationRouter {

  broadcastAddress: string;
  internalExpressPort: number;
  externalExpressPort: number;
  bridgeUri: string;

  constructor(expressConfiguration: Ports, bridgeDetails: BridgeDetails, broadcastAddress: string) {
    this.bridgeUri =
      `http://${bridgeDetails.bridgeIp}:` +
      `${bridgeDetails.bridgePort}/` +
      `api/${bridgeDetails.bridgeToken}`;
    this.internalExpressPort = expressConfiguration.internalPort;
    this.broadcastAddress = broadcastAddress;
  }

  async start(): Promise<boolean> {
    const controllers: Controllers = {
      requestOptionsUtil: new RequestOptionsUtil(this.bridgeUri),
      scheduleController: new ScheduleController(this.bridgeUri),
      sensorController: new SensorController(this.bridgeUri),
      lightController: new LightController(this.bridgeUri),
      sceneController: new SceneController(this.bridgeUri),
      groupController: new GroupController(this.bridgeUri),
      ruleController: new RuleController(this.bridgeUri),
      plugController: new PlugController(this.broadcastAddress)
    };



    const webApplication: WebApplication = new WebApplication(
      controllers,
      this.internalExpressPort);
    webApplication.use(morgan('common'));
    webApplication.use(bodyParser.json());
    webApplication.start();

    return true;
  }
}
