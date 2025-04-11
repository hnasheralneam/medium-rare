export type Server = {
    handleInput(input: any): void,
};

type Client = {
    handleMessage(message: any): void
};