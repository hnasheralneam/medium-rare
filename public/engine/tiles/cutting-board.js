import { Tile } from "../tile.mjs";
import { Player } from "../player.js";

export const CuttingBoard = {
    sourceImage: "cuttingboard.png",
    solid: true,
    init: (self, data) => {
        if (data) {
            self.data = data;
        }
        else {
            self.data = {};
            self.data.active = false;
            self.data.item = null;
        }
        if (self.data.active) {
            self.proto.startCutting(self, undefined);
        }
    },
    /**
     * @param { Tile } self
     * @param { Player } player
     */
    onInteract: (self, player, _key) => {
        if (player.item === null) {
            if (!self.data.item) return;
            if (self.data.item.attr("cutted")) {
                player.giveItem(self.data.item);
                self.data.item = null;
                return;
            }
            self.data.active = !self.data.active;
            if (self.data.active) {
                player.addSubscriber(self);
                self.data.lastTick = Date.now();
                self.proto.startCutting(self, player);
            }
            else {
                player.removeSubscriber(self);
            }
        }
        else {
            if (self.data.item !== null) return;
            if (!player.item.proto.cuttable) return;
            self.data.item = player.releaseItem();
            // time needed to cut
            self.data.timeNeededMs = 1200;
            self.data.timeLeft = self.data.timeNeededMs;
        }
    },
    startCutting(self, player) {
        let activeInterval = setInterval(() => {
            if (!self.data.active) clearInterval(activeInterval);
            let delta = Date.now() - self.data.lastTick;
            self.data.lastTick = Date.now();
            self.data.timeLeft -= delta;
            // intensive resource usage
            if (self.serverComms) self.serverComms.emitRedraw();

            if (self.data.timeLeft <= 0) {
                self.data.active = false;
                self.proto.finishCutting(self);
                if (player) player.removeSubscriber(self);
                if (self.serverComms) self.serverComms.server.handleCellChanged(self);
            }
        }, 50);
    },
    finishCutting(self) {
        if (!self.data.item) return;
        self.data.item.setAttr("cutted", true);
        if (self.serverComms) self.serverComms.emitRedraw();
    },
    disconnect(self) {
        self.data.active = false;
        if (self.serverComms) {
            self.serverComms.server.handleCellChanged(self);
            self.serverComms.emitRedraw();
        }
    }
};