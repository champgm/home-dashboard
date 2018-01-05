import ApplicationRouter from './routing/ApplicationRouter';
import { getPorts, Ports } from './configuration/Ports';
import { getBridgeDetails, BridgeDetails } from './configuration/BridgeDetails';
import { getBroadcastAddress } from './configuration/BroadcastAddress';

const expressPorts: Ports = getPorts();
const bridgeDetails: BridgeDetails = getBridgeDetails();
const broadcastAddress: string = getBroadcastAddress();

process.on('unhandledRejection', error => {
  console.error(error);
});

const server: ApplicationRouter = new ApplicationRouter(
  expressPorts,
  bridgeDetails,
  broadcastAddress
);

server.start();
