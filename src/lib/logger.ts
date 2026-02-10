export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  event: string;
  [key: string]: any;
}

export const logger = {
  info: (payload: LogPayload) => {
    console.log(JSON.stringify({ level: 'info', timestamp: new Date().toISOString(), ...payload }));
  },
  warn: (payload: LogPayload) => {
    console.warn(JSON.stringify({ level: 'warn', timestamp: new Date().toISOString(), ...payload }));
  },
  error: (payload: LogPayload) => {
    console.error(JSON.stringify({ level: 'error', timestamp: new Date().toISOString(), ...payload }));
  },
  debug: (payload: LogPayload) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(JSON.stringify({ level: 'debug', timestamp: new Date().toISOString(), ...payload }));
    }
  }
};
