export const CommLocal = {

};

function createRemoteComm(socket) {


    return {
        setup() {},
        emitInput() {}
    };
}

export const RemoteComm = {
    create: (socket) => createRemoteComm(socket)
};