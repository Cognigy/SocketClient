import {CognigyError} from "./cognigyError";
import {Output} from "./output";

export interface Options {
    baseUrl: string;
    user: string;
    apikey: string;
    flow: string;
    language: string;
    version?: number;
    reconnection?: boolean;
    interval?: number;
    handleError?: (error: CognigyError) => void;
    handleException?: (error: CognigyError) => void;
    handleOutput?: (output: Output) => void;
    handleLogstep?: (output: Output) => void;
    handleLogstepError?: (output: Output) => void;
    handleLogflow?: (output: Output) => void;
    handlePing?: () => void
    res?: any;
    passthroughIP?: string;
    token?: string;
};