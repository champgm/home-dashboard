import IItem from './IItem';

export default interface IPlug extends IItem {
  setPowerState: (powerState: boolean) => boolean;
  getPowerState: () => boolean;
  on: boolean;
  deviceId: string;
  host: string;
  port: string;
  name: string;
  deviceName: string;
  model: string;
  softwareVersion: string;
  hardwareVersion: string;
  mac: string;
  latitude: string;
  longitude: string;
  status: string;
  sysInfo: string;
  cloudInfo: string;
  consumption: string;
}
