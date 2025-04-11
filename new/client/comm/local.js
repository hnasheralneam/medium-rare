function createLocalComm(serverRef) {
    return {
        setup() {},
        emitInput(input) {
            /** @type { import("../../globals").Server } */
            const server = serverRef.target;
            server.handleInput(input);
        }
    };
}

export const LocalComm = {
    create: (serverRef) => createLocalComm(serverRef)
};
