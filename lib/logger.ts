import winston from "winston";

// ログレベル設定
const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

// カスタムフォーマット
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss",
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // メタデータがある場合は追加
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // スタックトレースがある場合は追加
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// コンソール用フォーマット（開発環境用）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: "HH:mm:ss",
  }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    let log = `${timestamp} ${level}: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// ロガーインスタンス作成
const logger = winston.createLogger({
  level: logLevel,
  format: customFormat,
  defaultMeta: { service: "youtube-content-generator" },
  transports: [
    // コンソール出力のみ
    new winston.transports.Console({
      format:
        process.env.NODE_ENV === "production" ? customFormat : consoleFormat,
    }),
  ],
});

export default logger;

// 便利なメソッドをエクスポート
export const logInfo = (message: string, meta?: any) =>
  logger.info(message, meta);
export const logError = (message: string, error?: Error | any, meta?: any) => {
  if (error instanceof Error) {
    logger.error(message, {
      error: error.message,
      stack: error.stack,
      ...meta,
    });
  } else {
    logger.error(message, { error, ...meta });
  }
};
export const logWarn = (message: string, meta?: any) =>
  logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) =>
  logger.debug(message, meta);
