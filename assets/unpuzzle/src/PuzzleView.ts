// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, property} = cc._decorator;
import PuzzleMapView = require('./PuzzleMapView');
import Game = require('../../common/src/Game');
import Util = require('../../common/src/Util');
@ccclass
class PuzzleView extends cc.Component {
    @property(PuzzleMapView)
    mapView: PuzzleMapView = null;

    onLoad(){
        let game:Game = Game.getInstance();
        game.puzzle.setRootView(this);

        Util.showToast('hello');
    }
}

export = PuzzleView;