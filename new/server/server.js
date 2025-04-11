function createServer(comm) {


    return {
        handleInput(input) {
            console.log("server handling:", input);
        }
    }
}

export const Server = {
    create: (comm) => createServer(comm)
};