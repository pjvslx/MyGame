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
import PuzzleSlot = require('./PuzzleSlot');
import Util = require('../../common/Util');

let data = [
    [1,2,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,1],
];

//@ 0:startIndex 1:endIndex 2:dir 3: 1:凹 2:凸
//⬆     1,
//⬇     2,
//⬅    3,
//➡    4,
let lockInfo = [
    [0,1,4,1]
];

let hookInfo = [
    // [0,1,]
];

@ccclass
@menu('Puzzle/PuzzleMapView')
class PuzzleMapView extends cc.Component {
    @property(cc.Prefab)
    puzzleCellPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    framePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    slotPrefab: cc.Prefab = null;

    cellList: cc.Node[] = [];
    cellFrameList: cc.Node[] = [];
    slotList: cc.Node[] = [];

    lockInfoList:any[] = [];

    selectedCell: cc.Node = null;

    map = null;

    convertIndexToRowAndCol(index:number):cc.Vec2{
        let cols = data[0].length;
        let rows = data.length;
        let row = Math.floor(index / cols);
        let col = index % cols;
        return cc.v2(row,col);
    }

    convertRowColToIndex(row,col):number{
        let cols = data[0].length;
        let rows = data.length;
        let index = row * cols + col;
        return index;
    }

    initCells(){
        this.lockInfoList = lockInfo;
        //计算出左上角的原点位置
        let col = data[0].length;
        let row = data.length;
        //分小格 一小格为100/2
        let mapWidth = (PuzzleCell.CELL_SIZE.width) * col;
        let mapHeight = (PuzzleCell.CELL_SIZE.height) * row;
        let originPos = cc.v2(-mapWidth/2,-mapHeight/2);

        for(let i = 0; i < col; i++){
            for(let j = 0; j < row; j++){
                let flag = data[j][i];
                if(flag != 0){
                    let cell = cc.instantiate(this.puzzleCellPrefab);
                    cell.parent = this.node;
                    cell.x = originPos.x + i * PuzzleCell.CELL_SIZE.width + PuzzleCell.CELL_SIZE.width/2;
                    cell.y = originPos.y + (row - j) * PuzzleCell.CELL_SIZE.height - PuzzleCell.CELL_SIZE.height/2;
                    cell.getComponent(PuzzleCell).setNum(flag);
                    cell.getComponent(PuzzleCell).col = i;
                    cell.getComponent(PuzzleCell).row = j;
                    this.cellList[this.cellList.length] = cell;

                    let cellFrame = cc.instantiate(this.framePrefab);
                    cellFrame.parent = this.node;
                    cellFrame.x = originPos.x + i * PuzzleCell.CELL_SIZE.width + PuzzleCell.CELL_SIZE.width/2;
                    cellFrame.y = originPos.y + (row - j) * PuzzleCell.CELL_SIZE.height - PuzzleCell.CELL_SIZE.height/2;
                    this.cellFrameList[this.cellFrameList.length] = cellFrame;
                }
            }
        }
    }

    initSlots(){
        let cols = data[0].length;
        let rows = data.length;
        //分小格 一小格为100/2
        let mapWidth = (PuzzleCell.CELL_SIZE.width) * cols;
        let mapHeight = (PuzzleCell.CELL_SIZE.height) * rows;
        let originPos = cc.v2(-mapWidth/2,-mapHeight/2);

        for(let i = 0; i < this.lockInfoList.length; i++){
            let lockInfo = this.lockInfoList[i];
            let startIndex = lockInfo[0];
            let endIndex = lockInfo[1];
            let dir = lockInfo[2];
            let caveFlag = lockInfo[3];
            let slot = cc.instantiate(this.slotPrefab);
            slot.parent = this.node;
            let rowColPos = this.convertIndexToRowAndCol(startIndex);
            let row = rowColPos.x;
            let col = rowColPos.y;
            slot.x = originPos.x + col * PuzzleCell.CELL_SIZE.width + PuzzleCell.CELL_SIZE.width/2;
            slot.y = originPos.y + (rows - row) * PuzzleCell.CELL_SIZE.height - PuzzleCell.CELL_SIZE.height/2;
            this.slotList[this.slotList.length] = slot;
            slot.getComponent(PuzzleSlot).setDir(dir);
            slot.getComponent(PuzzleSlot).setCaveFlag(caveFlag);
        }
    }

    onLoad(){
        this.initCells();
        this.initSlots();
        this.addEvent();
    }

    handleTouchStart(event:cc.Touch){
        console.log('pos = ' + event.getLocation());
        let pos = event.getLocation();
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        this.selectedCell = null;
        for(let i = 0; i < this.cellList.length; i++){
            let puzzleCell:PuzzleCell = this.cellList[i].getComponent(PuzzleCell);
            let rect = cc.rect(this.cellList[i].x - PuzzleCell.CELL_SIZE.width/2,this.cellList[i].y - PuzzleCell.CELL_SIZE.height/2,PuzzleCell.CELL_SIZE.width,PuzzleCell.CELL_SIZE.height);
            if(rect.contains(pos)){
                // console.log('index = ' + puzzleCell.num);
                console.log('row = ' + puzzleCell.row + ' col = ' + puzzleCell.col );
                this.selectedCell = this.cellList[i];
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
        // console.log('distance = ' + pos2.sub(pos1).mag() + ' r = ' + r);
        let distance = pos2.sub(pos1).mag();
        let xDistance = Math.pow(pos1.x - pos2.x,2);
        let yDistance = Math.pow(pos1.y - pos2.y,2);
        let xOffset = pos2.x - pos1.x;
        let yOffset = pos2.y - pos1.y;
        if(distance < 50){
            return;
        }
        let dir;
        if(xDistance > yDistance){
            if(xOffset >= 0){
                // console.log('右');
                dir = PuzzleCell.DIR.RIGHT;
            }else{
                // console.log('左');
                dir = PuzzleCell.DIR.LEFT;
            }
        }else{
            if(yOffset >= 0){
                // console.log('上');
                dir = PuzzleCell.DIR.UP;
            }else{
                // console.log('下');
                dir = PuzzleCell.DIR.DOWN;
            }
        }
        // if(this.selectedCell && dir){
        //     this.selectedCell.getComponent(PuzzleCell).flyOut(dir);
        //     this.selectedCell = null;
        // }
        this.checkCellMove(this.selectedCell,dir);
        if(this.selectedCell && dir){
            if(this.checkCellMove(this.selectedCell,dir)){
                this.selectedCell.getComponent(PuzzleCell).flyOut(dir);
                this.selectedCell = null;
            }
        }
    }

    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
    }

    reverseDir(dir:number){
        let reverseDir;
        switch (dir) {
            case PuzzleCell.DIR.DOWN:
                {
                    reverseDir = PuzzleCell.DIR.UP;
                }
                break;
            case PuzzleCell.DIR.UP:
                {
                    reverseDir = PuzzleCell.DIR.DOWN;
                }
                break;
            case PuzzleCell.DIR.LEFT:
                {
                    reverseDir = PuzzleCell.DIR.RIGHT;
                }
                break;
            case PuzzleCell.DIR.RIGHT:
                {
                    reverseDir = PuzzleCell.DIR.LEFT;
                }
                break;
            default:
                break;
        }
        return reverseDir;
    }

    checkCellMove(cell:cc.Node,dir:number) : boolean{
        if(cc.isValid(cell)){
            return false;
        }

        let puzzleCell:PuzzleCell = cell.getComponent(PuzzleCell);
        let row = puzzleCell.row;
        let col = puzzleCell.col;
        let index = this.convertRowColToIndex(row,col);
        let isLock = this.checkIsLock(index,dir);
        return !isLock;
    }

    getLockDirListbyLockDir(dir:number){
        let dirList = [];
        switch (dir) {
            case PuzzleCell.DIR.DOWN:
                {
                    dirList = [PuzzleCell.DIR.DOWN,PuzzleCell.DIR.LEFT,PuzzleCell.DIR.RIGHT];
                }
                break;
            case PuzzleCell.DIR.UP:
                {
                    dirList = [PuzzleCell.DIR.UP,PuzzleCell.DIR.LEFT,PuzzleCell.DIR.RIGHT];
                }
                break;
            case PuzzleCell.DIR.LEFT:
                {
                    dirList = [PuzzleCell.DIR.LEFT,PuzzleCell.DIR.UP,PuzzleCell.DIR.DOWN];
                }
                break;
            case PuzzleCell.DIR.RIGHT:
                {
                    dirList = [PuzzleCell.DIR.RIGHT,PuzzleCell.DIR.UP,PuzzleCell.DIR.DOWN];
                }
            default:
                break;
        }
        return dirList;
    }

    checkIsLock(index:number, dir:number){
        for(let i = 0; i < this.lockInfoList.length; i++){
            let lockInfo = this.lockInfoList[i];
            let startIndex = lockInfo[0];
            let endIndex = lockInfo[1];
            let dir = lockInfo[2];
            let dirList;
            if(startIndex == index){
                dirList = this.getLockDirListbyLockDir(dir);
            }else if(endIndex == index){
                dirList = this.getLockDirListbyLockDir(this.reverseDir(dir));
            }

            if(dirList){
                for(let j = 0; j < dirList.length; j ++){
                    if(dir == dirList[j]){
                        return true;
                    }
                }
            }
        }
        return false;
    }
}

export = PuzzleMapView;