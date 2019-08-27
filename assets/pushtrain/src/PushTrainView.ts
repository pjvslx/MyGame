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
import Util = require('../../common/src/Util');

@ccclass
class PushTrainView extends cc.Component {
    cols: number = 10;
    rows: number = 6;

    @property(cc.Prefab)
    pushCellPrefab: cc.Prefab = null;

    cellList: cc.Node[] = [];
    cellMap:any[][];

    data: number[] = [];
    selectedCell:cc.Node = null;
    cellOriginPos:cc.Vec2 = new cc.Vec2();

    onLoad(){
        Game.getInstance().pushTrain.setRootView(this);
        this.addEvent();
        this.initData();
        this.initCells();
    }

    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
    }

    initData(){
        for(let i = 1; i <= 15; i++){
            for(let count = 1; count <= 4; count++){
                this.data.push(i);
            }
        }
    }

    initCells(){
        //计算出左上角的原点位置
        //分小格 一小格为100/2
        this.cellMap = new Array<Array<any>>();
        let mapWidth = (PushCell.CELL_SIZE.width) * this.cols;
        let mapHeight = (PushCell.CELL_SIZE.height) * this.rows;
        let originPos = cc.v2(-mapWidth/2,-mapHeight/2);
        this.cellOriginPos = originPos;

        for(let i = 0; i < this.cols; i++){
            for(let j = 0; j < this.rows; j++){
                if(this.cellMap[j] == null){
                    this.cellMap[j] = [];
                }
                let randomIndex = Util.random(this.data.length) - 1;
                let num = this.data[randomIndex];
                this.data.splice(randomIndex,1);
                let cell = cc.instantiate(this.pushCellPrefab);
                cell.parent = this.node;
                cell.getComponent(PushCell).setPosition(cc.v2(originPos.x + i * PushCell.CELL_SIZE.width + PushCell.CELL_SIZE.width/2,originPos.y + j * PushCell.CELL_SIZE.height + PushCell.CELL_SIZE.height/2));
                cell.getComponent(PushCell).col = i;
                cell.getComponent(PushCell).row = j;
                cell.getComponent(PushCell).setNum(num);
                cell.getComponent(PushCell).setStr(`${i}-${j}`);
                this.cellList[this.cellList.length] = cell;
                this.cellMap[j][i] = cell;
            }
        }

        console.log(this.cellMap);
    }

    //全部转换为世界坐标计算 其中originPos也要转换
    translateToCellPos(pos:cc.Vec2){
        let worldOriginPos = this.node.convertToWorldSpaceAR(this.cellOriginPos);
        console.log('pos = ' + JSON.stringify(pos) + ' worldOriginPos = ' + JSON.stringify(worldOriginPos));
        var x = pos.x;
        var y = pos.y;
        var cellX = 0;
        var cellY = 0;
        for(var i = 0; i < this.cols; i++){
            if(x >= i * PushCell.CELL_SIZE.width + worldOriginPos.x && x < (i+1) * PushCell.CELL_SIZE.width + worldOriginPos.x){
                cellX = i;
                break;
            }
        }

        for(var i = 0; i < this.rows; i++){
            if(y >= i * PushCell.CELL_SIZE.height + worldOriginPos.y && y < (i+1) * PushCell.CELL_SIZE.height + worldOriginPos.y){
                cellY = i;
                break;
            }
        }

        return cc.v2(cellX,cellY);
    }

    handleTouchStart(event:cc.Touch){
        let pos = event.getLocation();
        let cellPos = this.translateToCellPos(pos);
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        if(cc.isValid(this.selectedCell)){
            //之前有选中
        }else{
            //之前没选中
            let row = cellPos.y;
            let col = cellPos.x;
            if(!cc.isValid(this.cellMap[row][col])){
                //当前也没选中
                return;
            }else{
                //当前选中
                this.selectedCell = this.cellMap[row][col];
                this.selectedCell.opacity = 100;
            }
        }

        // for(let i = 0; i < this.cellList.length; i++){
        //     let pushCell:PushCell = this.cellList[i].getComponent(PushCell);
        //     let rect = cc.rect(this.cellList[i].x - PushCell.CELL_SIZE.width/2,this.cellList[i].y - PushCell.CELL_SIZE.height/2,PushCell.CELL_SIZE.width,PushCell.CELL_SIZE.height);
        //     if(rect.contains(pos)){
        //         this.selectedCell = this.cellList[i];
        //         break;
        //     }
        // }
    }

    handleTouchMove(event:cc.Touch){

    }

    handleTouchEnd(event:cc.Touch){

    }
}

export = PushTrainView;