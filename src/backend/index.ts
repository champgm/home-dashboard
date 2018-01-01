import ApplicationRouter from './routing/ApplicationRouter';
import getSecrets from './configuration/GetSecrets';
import getPorts from './configuration/GetPorts';
import getBridgeDetails from './configuration/GetBridgeDetails';
import getBroadcastAddress from './configuration/GetBroadcastAddress';

const secretConfiguration = getSecrets();
const expressConfiguration = getPorts();
const bridgeDetails = getBridgeDetails();
const plugIps = getBroadcastAddress();

const server = new ApplicationRouter(
  expressConfiguration,
  bridgeDetails,
  plugIps,
  secretConfiguration
);

server.start();

