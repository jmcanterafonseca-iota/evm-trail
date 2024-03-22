import { Logger, ILogObj } from "tslog";

export class App {
    public static logger: Logger<ILogObj>;

    public static LDebug(...args: any[]) {
        this.logger.debug(...args);
    }

    public static LInfo(...args: any[]) {
        this.logger.info(...args);
    }

    public static LError(...args: any[]) {
        this.logger.error(...args);
    }
}
