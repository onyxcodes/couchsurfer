import {pino} from 'pino';

const browserLogger = pino({
    browser: {
        serialize: true,
      write: {
        info: function (o) {
          console.log(o)
        },
        error: function (o) {
          console.log(o)
        }
      }
    }
});

export default browserLogger;