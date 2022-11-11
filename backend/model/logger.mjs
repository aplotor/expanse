const backend = process.cwd();

import winston from "winston";

const log_logger = create_logger("info");
const log = log_logger.info.bind(log_logger);
const error_logger = create_logger("error");
const error = error_logger.error.bind(error_logger);

function create_logger(level) { // https://github.com/winstonjs/winston#logging-levels "npm logging levels"
	const logger = winston.createLogger({
		format: winston.format.combine(
			winston.format.timestamp({
				format: "YYYY-MM-DD HH:mm:ss"
			}),
			winston.format.json(),
			winston.format.printf((log) => {
				return `${JSON.stringify({
					timestamp: log.timestamp,
					message: log.message
				}, null, 4)}`;
			})
		),
		transports: [
			// new winston.transports.Console(),
			new winston.transports.File({
				filename: `${backend}/logs/${(level == "info" ? "log" : level)}.txt`
			})
		]
	});
	return logger;
}

export {
	log,
	error
};
