function createRemoteComm(_socket) {


    return {
        setup() {},
        emitMessage(message) {

        }
    };
}

export const RemoteComm = {
    create: (socket) => createRemoteComm(socket)
};