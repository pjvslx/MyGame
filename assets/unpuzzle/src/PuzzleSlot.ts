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

import PuzzleCell = require('./PuzzleCell');

@ccclass
class PuzzleSlot extends cc.Component {

    // LIFE-CYCLE CALLBACKS:
    @property(cc.Node)
    img: cc.Node = null;

    onLoad () {

    }

    setDir(dir:number){
        let angle = 0;
        let offsetVec = cc.v2(0,0);
        switch (dir) {
            case PuzzleCell.DIR.UP:
                {
                    angle = 0;
                    offsetVec.y = PuzzleCell.CELL_SIZE.height/2;
                }
                break;
            case PuzzleCell.DIR.DOWN:
                {
                    offsetVec.y = -PuzzleCell.CELL_SIZE.height/2;
                    angle = 180;
                }
                break;
            case PuzzleCell.DIR.LEFT:
                {
                    offsetVec.x = -PuzzleCell.CELL_SIZE.width/2;
                    angle = 90;
                }
                break;
            case PuzzleCell.DIR.RIGHT:
                {
                    offsetVec.x = PuzzleCell.CELL_SIZE.width/2;
                    angle = 270
                }
                break;
            default:
                break;
        }
        this.img.position = offsetVec;
        this.img.angle = angle;
    }

    setCaveFlag(caveFlag:number){
        if(caveFlag == 1){
            this.img.scaleY = -1;
        }else{
            this.img.scaleY = 1;
        }
    }

    setPosition(row,col){

    }
}

export = PuzzleSlot;