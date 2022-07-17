
export class ConsoleLog {
    readonly logger: boolean;
    constructor(logger: boolean) {
        this.logger = logger;
    }

    info(message: string) {
        if (this.logger) { console.log(message); }
    }

    error(message: string) {
        if (this.logger) { console.error(message); }
    }

    warning(message: string) {
        if(this.logger) { console.warn(message); }
    }
}