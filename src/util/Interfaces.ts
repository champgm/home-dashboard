
export interface Favorites {
  plugs: string[];
  lights: string[];
}

export interface IPlug {
  setPowerState?: (powerState: boolean) => boolean;
  getPowerState?: () => boolean;
  id: string;
  state: {
    on?: boolean;
  };
  deviceId?: string;
  host?: string;
  port?: string;
  name?: string;
  deviceName?: string;
  model?: string;
  softwareVersion?: string;
  hardwareVersion?: string;
  mac?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
  sysInfo?: string;
  cloudInfo?: string;
  consumption?: string;
}
