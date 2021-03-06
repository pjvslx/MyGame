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

    missionIndex: number = 1;
    missionData = null;

    initMissionData(){
        this.missionIndex = 0;
        this.missionData = Util.deepCopy(PuzzleMissionConfig.data[this.missionIndex]);
    }

    initMissionDataExt(successCb:Function = null, failedCb:Function = null){
        let url = `mission/level${this.missionIndex}`;
        console.log('initMissionDataExt url = ' + url);
        cc.loader.loadRes(`mission/level${this.missionIndex}`,(err,data:cc.JsonAsset)=>{
            if(err && failedCb){
                failedCb();
                return;
            }
            this.missionData = data.json;
            if(successCb){
                successCb(data.json);
            }
        });
    }

    pass(){
        this.missionIndex++;
        this.initMissionDataExt((obj)=>{
            console.log('---------show-----------');
            this.show();
        },()=>{
            alert('no level');
        });
    }
}
export = Puzzle;