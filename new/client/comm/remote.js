function createRemoteComm(_socket) {


    return {
        setup() {},
        emitInput(input) {

        }
    };
}

export const RemoteComm = {
    create: (socket) => createRemoteComm(socket)
};