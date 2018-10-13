import DashButtonRouter from './dash/DashButtonRouter';
import express from 'express';
import path from 'path';
import bunyan from 'bunyan';
import LoggerParent from './common/logger';

const bunyanLogger: bunyan = LoggerParent.child({ fileName: `${path.basename(__filename)}` });
process.on('unhandledRejection', error => {
  bunyanLogger.error(error);
});

new DashButtonRouter().watch();

const expressApplication = express();

expressApplication.listen(this.port, () => {
  bunyanLogger.info({ port: this.port }, 'Hue Application listening.');
});
