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
import PuzzleView = require('./PuzzleView');
import Module = require('../../common/src/Module');
import PuzzleMissionConfig = require('./PuzzleMissionConfig');
import Util = require('../../common/src/Util');
@ccclass
class Puzzle extends Module {
    sceneName = 'puzzle';
    root: PuzzleView = null;

    missionIndex: number = 0;
    missionData = null;

    initMissionData(){
        this.missionIndex = 0;
        this.missionData = Util.deepCopy(PuzzleMissionConfig.data[this.missionIndex]);
    }

    pass(){
        this.missionIndex++;
        this.missionData = Util.deepCopy(PuzzleMissionConfig.data[this.missionIndex]);
    }
}
export = Puzzle;