import { Tile } from "../tile.js";
import { Player } from "../player.js";
import { Item } from "../item.js";

export const CuttingBoard = {
    sourceImage: "cuttingboard.png",
    solid: true,
    init: (self, data) => {
        self.active = false;
        if (data) {
            self.data = data;
        }
        else {
            self.data = {};
            self.data.item = null;
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
            self.active = !self.active;
            if (self.active) {
                player.addSubscriber(self);
                self.lastTick = Date.now();
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
            self.timeNeededMs = 1400;
            self.timeLeft = self.timeNeededMs;
        }
    },
    startCutting(self, player) {
        let activeInterval = setInterval(() => {
            if (!self.active) clearInterval(activeInterval);
            let delta = Date.now() - self.lastTick;
            self.lastTick = Date.now();
            self.timeLeft -= delta;
            // intensive resource usage
            window.game.notifyRedraw();

            if (self.timeLeft <= 0) {
                self.active = false;
                self.proto.finishCutting(self);
                player.removeSubscriber(self);
            }
        }, 50);
    },
    finishCutting(self) {
        if (!self.data.item) return;
        self.data.item.setAttr("cutted", true);
        window.game.notifyRedraw();
    },
    disconnect(self) {
        self.active = false;
    }
};