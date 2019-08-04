// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, menu, property} = cc._decorator;

import PuzzleCell = require('./PuzzleCell');
import Util = require('../../common/Util');

//
let data = [
    [1,0,2,0,3,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0],
    [1,0,0,0,0,0,0,0,1,0],
    [0,0,0,0,0,0,0,0,0,0],
]

@ccclass
@menu('Puzzle/PuzzleMapView')
class PuzzleMapView extends cc.Component {
    @property(cc.Prefab)
    puzzleCellPrefab: cc.Prefab = null;

    cellList: cc.Node[] = [];

    map = null;

    initCell(){
        //计算出左上角的原点位置
        let col = data[0].length;
        let row = data.length;
        //分小格 一小格为100/2
        let mapWidth = (PuzzleCell.CELL_SIZE.width / 2) * col;
        let mapHeight = (PuzzleCell.CELL_SIZE.height / 2) * row;
        let originPos = cc.v2(-mapWidth/2,-mapHeight/2);

        for(let i = 0; i < col; i++){
            for(let j = 0; j < row; j++){
                let flag = data[j][i];
                if(flag != 0){
                    let cell = cc.instantiate(this.puzzleCellPrefab);
                    cell.parent = this.node;
                    cell.x = originPos.x + i * PuzzleCell.CELL_SIZE.width / 2;
                    cell.y = originPos.y + (row - j) * PuzzleCell.CELL_SIZE.height / 2 - PuzzleCell.CELL_SIZE.height;
                    cell.getComponent(PuzzleCell).setNum(flag);
                    this.cellList[this.cellList.length] = cell;
                    console.log('cell.x = ' + cell.x + ' cell.y = ' + cell.y );
                }
            }
        }
    }

    onLoad(){
        this.initCell();
        this.addEvent();
    }

    handleTouchStart(event:cc.Touch){
        console.log('pos = ' + event.getLocation());
        let pos = event.getLocation();
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        for(let i = 0; i < this.cellList.length; i++){
            let rect = cc.rect(this.cellList[i].x,this.cellList[i].y,PuzzleCell.CELL_SIZE.width,PuzzleCell.CELL_SIZE.height);
            if(rect.contains(pos)){
                console.log('index = ' + this.cellList[i].getComponent(PuzzleCell).num);
                break;
            }
        }
    }

    handleTouchEnd(event:cc.Touch){

    }

    handleTouchMove(event:cc.Touch){
        let pos1 = event.getStartLocation();
        let pos2 = event.getLocation();
        let r = Util.getAngleByPos(pos2,pos1)
        console.log('distance = ' + pos2.sub(pos1).mag() + ' r = ' + r);
        let distance = pos2.sub(pos1).mag();
        let xDistance = Math.pow(pos1.x - pos2.x,2);
        let yDistance = Math.pow(pos1.y - pos2.y,2);
        if(distance < 50){
            return;
        }
        if(xDistance > yDistance){
            console.log('横');
        }else{
            console.log('竖');
        }
    }

    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
    }
}

export = PuzzleMapView;