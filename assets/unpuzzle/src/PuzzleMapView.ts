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
import Util = require('../../common/src/Util');
import Shake = require('./Shake');
import Game = require('../../common/src/Game');
import PuzzleMissionConfig = require('./PuzzleMissionConfig');
import Puzzle = require('./Puzzle');
import EventConfig = require('../../common/src/EventConfig');

// let data = [
//     [1,2,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0,0],
//     [0,0,0,0,0,0,0,0,0,0,1],
// ];

//@ 0:startIndex 1:endIndex 2:dir 3: 1:凹 2:凸
//⬆     1,
//⬇     2,
//⬅    3,
//➡    4,
// let lockInfo = [
//     [0,1,4,1]
// ];

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

    @property(cc.Prefab)
    moveLightPrefab: cc.Prefab = null;

    row: number = 0;
    col: number = 0;

    cellList: cc.Node[] = [];
    cellFrameList: cc.Node[] = [];
    slotList: cc.Node[] = [];

    lockInfoList:any[] = [];

    selectedCell: cc.Node = null;
    isGameOver: boolean = false;
    moveLightNode: cc.Node = null;
    currentMoveDir: number = 0;

    resetData(){
        this.row = 0;
        this.col = 0;
        for(let i = 0; i < this.cellList.length; i++){
            if(cc.isValid(this.cellList[i])){
                this.cellList[i].destroy();
            }
        }
        this.cellList = [];
        for(let i = 0; i < this.cellFrameList.length; i++){
            if(cc.isValid(this.cellFrameList[i])){
                this.cellFrameList[i].destroy();
            }
        }
        this.cellFrameList = [];
        for(let i = 0; i < this.slotList.length; i++){
            this.slotList[i].destroy();
        }
        this.slotList = [];
        this.lockInfoList = [];
        this.selectedCell = null;
        this.isGameOver = false;
    }

    convertIndexToRowAndCol(index:number):cc.Vec2{
        let data = Game.getInstance().puzzle.missionData.cellInfo;
        let cols = data[0].length;
        let rows = data.length;
        let row = Math.floor(index / cols);
        let col = index % cols;
        return cc.v2(row,col);
    }

    convertRowColToIndex(row,col):number{
        let data = Game.getInstance().puzzle.missionData.cellInfo;
        let cols = data[0].length;
        let rows = data.length;
        let index = row * cols + col;
        return index;
    }

    initCells(){
        let data = Game.getInstance().puzzle.missionData.cellInfo;
        this.lockInfoList = Game.getInstance().puzzle.missionData.lockInfo;
        //计算出左上角的原点位置
        let col = data[0].length;
        let row = data.length;
        this.col = col;
        this.row = row;
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
                    cell.getComponent(PuzzleCell).setPosition(cc.v2(originPos.x + i * PuzzleCell.CELL_SIZE.width + PuzzleCell.CELL_SIZE.width/2,originPos.y + (row - j) * PuzzleCell.CELL_SIZE.height - PuzzleCell.CELL_SIZE.height/2));
                    cell.getComponent(PuzzleCell).col = i;
                    cell.getComponent(PuzzleCell).row = j;
                    let index = this.convertRowColToIndex(j,i);
                    cell.getComponent(PuzzleCell).setNum(index);
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
        let data = Game.getInstance().puzzle.missionData.cellInfo;
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
            slot.getComponent(PuzzleSlot).startCellIndex = startIndex;
            slot.getComponent(PuzzleSlot).endCellIndex = endIndex;
        }
    }

    hideMoveDir(){
        if(cc.isValid(this.moveLightNode)){
            this.moveLightNode.active = false;
        }
    }

    showMoveDir(row,col,dir:number){
        if(!cc.isValid(this.moveLightNode)){
            this.moveLightNode = cc.instantiate(this.moveLightPrefab);
            this.moveLightNode.parent = this.node;
            this.moveLightNode.zIndex = 1;
        }
        this.moveLightNode.active = true;
        this.moveLightNode.getChildByName('img').active = true;
        if(dir == PuzzleCell.DIR.LEFT){
            this.moveLightNode.getChildByName('img').angle = 180;
        }else if(dir == PuzzleCell.DIR.RIGHT){
            this.moveLightNode.getChildByName('img').angle = 0;
        }else if(dir == PuzzleCell.DIR.DOWN){
            this.moveLightNode.getChildByName('img').angle = 270;
        }else if(dir == PuzzleCell.DIR.UP){
            this.moveLightNode.getChildByName('img').angle = 90;
        }

        let mapWidth = (PuzzleCell.CELL_SIZE.width) * this.col;
        let mapHeight = (PuzzleCell.CELL_SIZE.height) * this.row;
        let originPos = cc.v2(-mapWidth/2,-mapHeight/2);

        let x = originPos.x + col * PuzzleCell.CELL_SIZE.width + PuzzleCell.CELL_SIZE.width/2;
        let y = originPos.y + (this.row - row) * PuzzleCell.CELL_SIZE.height - PuzzleCell.CELL_SIZE.height/2;
        this.moveLightNode.position = cc.v2(x,y)
    }

    onLoad(){
        this.resetData();
        this.init();
        this.addEvent();
    }

    init(){
        this.isGameOver = false;
        this.initCells();
        this.initSlots();
    }

    handleTouchStart(event:cc.Touch){
        if(this.isGameOver){
            return;
        }
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
        if(!cc.isValid(this.selectedCell)){
            return;
        }
        let dir = this.currentMoveDir;
        this.hideMoveDir();
        if(dir == null){
            this.selectedCell = null;
            return;
        }
        if(this.checkCellMove(this.selectedCell,dir)){
            let selectedCell = this.selectedCell;
            this.selectedCell.getComponent(PuzzleCell).flyOut(dir,()=>{
                this.removeCell(selectedCell);
            });
            for(let i = this.cellList.length - 1; i >= 0; i--){
                if(this.cellList[i] == this.selectedCell){
                    this.cellList.splice(i,1);
                }
            }
            let row = this.selectedCell.getComponent(PuzzleCell).row;
            let col = this.selectedCell.getComponent(PuzzleCell).col;
            let index = this.convertRowColToIndex(row,col);
            this.removeLock(index);
            this.selectedCell = null;
        }else{
            if(dir == PuzzleCell.DIR.DOWN){
                Util.showToast('下 不行');
            }else if(dir == PuzzleCell.DIR.UP){
                Util.showToast('上 不行');
            }else if(dir == PuzzleCell.DIR.LEFT){
                Util.showToast('左 不行');
            }else if(dir == PuzzleCell.DIR.RIGHT){
                Util.showToast('右 不行');
            }
            let actShake;
            if(dir == PuzzleCell.DIR.LEFT || dir == PuzzleCell.DIR.RIGHT){
                actShake = Shake.create(0.3,5,0);
            }else if(dir == PuzzleCell.DIR.UP || dir == PuzzleCell.DIR.DOWN){
                actShake = Shake.create(0.3,0,5);
            }
            this.selectedCell.stopAllActions();
            this.selectedCell.runAction(actShake);
            this.selectedCell = null;
        }
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
            this.currentMoveDir = null;
            this.hideMoveDir();
            return;
        }
        let dir;
        if(xDistance > yDistance){
            if(xOffset >= 0){
                dir = PuzzleCell.DIR.RIGHT;
            }else{
                dir = PuzzleCell.DIR.LEFT;
            }
        }else{
            if(yOffset >= 0){
                dir = PuzzleCell.DIR.UP;
            }else{
                dir = PuzzleCell.DIR.DOWN;
            }
        }

        this.currentMoveDir = dir;
        if(this.selectedCell && dir){
            let puzzleCell:PuzzleCell = this.selectedCell.getComponent(PuzzleCell);
            this.showMoveDir(puzzleCell.row,puzzleCell.col,dir);
        }else{
            this.hideMoveDir();
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
        if(!cc.isValid(cell)){
            return false;
        }

        let puzzleCell:PuzzleCell = cell.getComponent(PuzzleCell);
        let row = puzzleCell.row;
        let col = puzzleCell.col;
        let index = this.convertRowColToIndex(row,col);
        let isLock = this.checkIsLock(index,dir);
        let hasCell = this.checkHasCellByDir(index,dir);
        return !isLock && !hasCell;
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

    checkHasCellByDir(index:number, moveDir:number){
        let pos = this.convertIndexToRowAndCol(index);
        let row = pos.x;
        let col = pos.y;
        if(moveDir == PuzzleCell.DIR.DOWN){
            for(let i = row; i < this.row; i++){
                if(i == row){
                    continue;
                }
                for(let index = 0; index < this.cellList.length; index++){
                    let cell:PuzzleCell = this.cellList[index].getComponent(PuzzleCell);
                    if(cell.col == col && cell.row == i){
                        return true;
                    }
                }
            }
        }else if(moveDir == PuzzleCell.DIR.UP){
            for(let i = row; i >= 0; i--){
                if(i == row){
                    continue;
                }
                for(let index = 0; index < this.cellList.length; index++){
                    let cell:PuzzleCell = this.cellList[index].getComponent(PuzzleCell);
                    if(cell.col == col && cell.row == i){
                        return true;
                    }
                }
            }
        }else if(moveDir == PuzzleCell.DIR.LEFT){
            for(let i = col; i >= 0; i--){
                if(i == col){
                    continue;
                }
                for(let index = 0; index < this.cellList.length; index++){
                    let cell:PuzzleCell = this.cellList[index].getComponent(PuzzleCell);
                    if(cell.col == i && cell.row == row){
                        return true;
                    }
                }
            }
        }else if(moveDir == PuzzleCell.DIR.RIGHT){
            for(let i = col; i < this.col; i++){
                if(i == col){
                    continue;
                }
                for(let index = 0; index < this.cellList.length; index++){
                    let cell:PuzzleCell = this.cellList[index].getComponent(PuzzleCell);
                    if(cell.col == i && cell.row == row){
                        return true;
                    }
                }
            }
        }

        return false;
    }

    checkIsLock(index:number, moveDir:number){
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
                    if(moveDir == dirList[j]){
                        return true;
                    }
                }
            }
        }
        return false;
    }

    removeCell(cell:cc.Node){
        if(this.isGameOver){
            return;
        }
        cell.destroy();
        if(this.cellList.length == 0){
            this.isGameOver = true;
            this.playGameOverAction(()=>{
                // Util.showToast('win');
                Game.getInstance().gNode.emit(EventConfig.EVT_PUZZLE_GAME_OVER);
            });
            
        }
    }

    playGameOverAction(finishecb:Function){
        for(let i = 0; i < this.cellFrameList.length; i++){
            if(i == this.cellFrameList.length - 1){
                this.cellFrameList[i].runAction(cc.sequence(cc.fadeOut(0.5),cc.callFunc(()=>{
                    if(finishecb){
                        finishecb();
                    }
                })));
            }else{
                this.cellFrameList[i].runAction(cc.fadeOut(0.5));
            }
        }
    }

    removeLock(index:number){
        for(let i = this.lockInfoList.length - 1; i >= 0; i--){
            if(this.lockInfoList[i][0] == index || this.lockInfoList[i][1] == index){
                this.lockInfoList.splice(i,1);
            }
        }

        for(let i = this.slotList.length - 1; i >= 0; i--){
            if(this.slotList[i].getComponent(PuzzleSlot).startCellIndex == index || this.slotList[i].getComponent(PuzzleSlot).endCellIndex == index){
                let slotNode:cc.Node = this.slotList[i];
                this.slotList.splice(i,1);
                slotNode.destroy();
            }
        }
    }
}

export = PuzzleMapView;