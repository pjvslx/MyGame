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

import PushCell = require('./PushCell');
import PushTrain = require('./PushTrain');
import Game = require('../../common/src/Game');

@ccclass
class PushTrainView extends cc.Component {
    cols: number = 16;
    rows: number = 8;

    @property(cc.Prefab)
    pushCellPrefab: cc.Prefab = null;

    cellList: cc.Node[] = [];

    onLoad(){
        Game.getInstance().pushTrain.setRootView(this);
        this.addEvent();
        this.initCells();
    }

    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
    }

    initCells(){
        //计算出左上角的原点位置
        //分小格 一小格为100/2
        let mapWidth = (PushCell.CELL_SIZE.width) * this.cols;
        let mapHeight = (PushCell.CELL_SIZE.height) * this.rows;
        let originPos = cc.v2(-mapWidth/2,-mapHeight/2);

        for(let i = 0; i < this.cols; i++){
            for(let j = 0; j < this.rows; j++){
                let cell = cc.instantiate(this.pushCellPrefab);
                cell.parent = this.node;
                cell.getComponent(PushCell).setPosition(cc.v2(originPos.x + i * PushCell.CELL_SIZE.width + PushCell.CELL_SIZE.width/2,originPos.y + (this.rows - j) * PushCell.CELL_SIZE.height - PushCell.CELL_SIZE.height/2));
                cell.getComponent(PushCell).col = i;
                cell.getComponent(PushCell).row = j;
                this.cellList[this.cellList.length] = cell;
            }
        }
    }

    handleTouchStart(event:cc.Touch){

    }

    handleTouchMove(event:cc.Touch){

    }

    handleTouchEnd(event:cc.Touch){

    }
}

export = PushTrainView;