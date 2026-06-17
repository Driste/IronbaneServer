
var winston = require('winston');
var today = new Date();
var dateString = today.getUTCDate() +'' + today.getUTCMonth() + ''+ today.getUTCFullYear();
  var logger = winston.createLogger({
    transports: [
      new winston.transports.File({ filename: './logs/'+dateString+'error.log', level: 'error' }),
new winston.transports.File({ filename: './logs/'+dateString+'info.log', level: 'info' }),
new winston.transports.File({ filename: './logs/'+dateString+'warn.log', level: 'warn' }),
    ]
  });
module.exports = logger;