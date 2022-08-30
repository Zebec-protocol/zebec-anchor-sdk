export declare const ZEBEC_MULTISIG_PROGRAM_IDL: {
    version: string;
    name: string;
    instructions: ({
        name: string;
        accounts: {
            name: string;
            isMut: boolean;
            isSigner: boolean;
        }[];
        args: ({
            name: string;
            type: {
                vec: string;
            };
        } | {
            name: string;
            type: string;
        })[];
    } | {
        name: string;
        accounts: {
            name: string;
            isMut: boolean;
            isSigner: boolean;
        }[];
        args: ({
            name: string;
            type: string;
        } | {
            name: string;
            type: {
                vec: {
                    defined: string;
                };
            };
        })[];
    })[];
    accounts: {
        name: string;
        type: {
            kind: string;
            fields: ({
                name: string;
                type: string;
            } | {
                name: string;
                type: {
                    vec: {
                        defined: string;
                    };
                };
            } | {
                name: string;
                type: {
                    vec: string;
                };
            })[];
        };
    }[];
    types: {
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
export declare const ZEBEC_STREAM_PROGRAM_IDL: {
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
