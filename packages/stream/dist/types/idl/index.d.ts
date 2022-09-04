export declare const ZEBEC_PROGRAM_IDL: {
    version: string;
    name: string;
    instructions: {
        name: string;
        accounts: {
            name: string;
            isMut: boolean;
            isSigner: boolean;
        }[];
        args: {
            name: string;
            type: string;
        }[];
    }[];
    accounts: {
        name: string;
        type: {
            kind: string;
            fields: {
                name: string;
                type: string;
            }[];
        };
    }[];
    errors: {
        code: number;
        name: string;
        msg: string;
    }[];
};
