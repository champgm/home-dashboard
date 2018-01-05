import * as bunyan from 'bunyan';
export const LoggerParent: bunyan = bunyan.createLogger({ name: 'Hue-Stuff:Backend-API' });
