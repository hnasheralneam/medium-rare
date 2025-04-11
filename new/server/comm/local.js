function createLocalComm(clientRef) {
    return {
        setup() {},
        emitMessage(message) {
            const client = clientRef.target;
            
        }
    };
}

export const LocalComm = {
    create: (clientRef) => createLocalComm(clientRef)
};
