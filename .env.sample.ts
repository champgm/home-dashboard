export class BridgeConfiguration {
  HUE_BRIDGE_IP: string;
  HUE_BRIDGE_TOKEN: string;
  HUE_BRIDGE_PORT: number;
}

export const bridgeConfiguration: BridgeConfiguration = {
  HUE_BRIDGE_IP: '10.0.0.100',
  HUE_BRIDGE_TOKEN: '12345abcdeUUID',
  HUE_BRIDGE_PORT: 80
};

export class NetworkConfiguration {
  BROADCAST_ADDRESS: string;
  INTERFACE_NAME: string;
}

export const networkConfiguration: NetworkConfiguration = {
  BROADCAST_ADDRESS: '10.0.0.255',
  INTERFACE_NAME: 'en0'
};

export class DashButtonConfiguration {
  DASH_BUTTON_MAC_MAP: { [key: string]: string };
}

export const dashButtonConfiguration: DashButtonConfiguration = {
  DASH_BUTTON_MAC_MAP: {
    'aa:bb:cc:dd:ee:ff': 'http://127.0.0.1:8080/plugs/10.0.0.101/select', // Cat food button
    '11:22:33:44:55:66': 'http://127.0.0.1:8080/scenes/NvSSHHRU-RR-Y/select' // Laundry detergent
  }
};

export class WebConfiguration {
  WEB_PORT: number;
}

export const webConfiguration: WebConfiguration = {
  WEB_PORT: 8080
};

