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
    static DIR = {
        UP : 1,
        DOWN : 2,
        LEFT : 3,
        RIGHT : 4  
    };

    cols: number = 10;
    rows: number = 6;

    @property(cc.Prefab)
    pushCellPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    pushFramePrefab: cc.Prefab = null;

    cellMap:any[][];

    data: number[] = [];
    selectedCell:cc.Node = null;
    cellOriginPos:cc.Vec2 = new cc.Vec2();
    pushFramePool:cc.Node[] = [];

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
                // cell.getComponent(PushCell).setStr(`${i}-${j}`);
                this.cellMap[j][i] = cell;
            }
        }

        // console.log(this.cellMap);
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

    isCellValid(cell){
        if(cell == 0){
            return false;
        }

        return cc.isValid(cell);
    }

    //是否能消除
    isInPair(cell1:cc.Node,cell2:cc.Node) : boolean{
        if(!this.isCellValid(cell1) || !this.isCellValid(cell2)){
            return false;
        }
        
        let pushCell1:PushCell = cell1.getComponent(PushCell);
        let pushCell2:PushCell = cell2.getComponent(PushCell);

        if(pushCell1.row == pushCell2.row && pushCell1.col == pushCell2.col){
            //同一个cell 不能自己与自己消除
            return false;
        }

        if(pushCell1.row == pushCell2.row){
            let row = pushCell1.row;
            //行相同 判断两cell之间是否穿插其他cell
            let lowCol,highCol;
            if(pushCell1.col < pushCell2.col){
                lowCol = pushCell1.col;
                highCol = pushCell2.col;
            }else if(pushCell1.col > pushCell2.col){
                lowCol = pushCell2.col;
                highCol = pushCell1.col;
            }

            for(let col = lowCol + 1; col < highCol - 1; col++){
                if(this.isCellValid(this.cellMap[row][col])){
                    return false;
                }
            }
        }else if(pushCell1.col == pushCell2.col){
            let col = pushCell1.col;
            let lowRow,highRow;
            if(pushCell1.row < pushCell2.row){
                lowRow = pushCell1.row;
                highRow = pushCell2.row;
            }else if(pushCell1.row > pushCell2.row){
                lowRow = pushCell2.row;
                highRow = pushCell1.row;
            }

            for(let row = lowRow + 1; row < highRow - 1; row++){
                if(this.isCellValid(this.cellMap[row][col])){
                    return false;
                }
            }
        }else{
            return false;
        }

        return true;
    }

    removeCell(cell:cc.Node){
        let row = cell.getComponent(PushCell).row;
        let col = cell.getComponent(PushCell).col;
        cell.destroy();
        this.cellMap[row][col] = 0;
    }

    getCell(row,col){
        if(this.cellMap[row] == null){
            return;
        }

        return this.cellMap[row][col];
    }

    handleTouchStart(event:cc.Touch){
        let pos = event.getLocation();
        let cellPos = this.translateToCellPos(pos);
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        let row = cellPos.y;
        let col = cellPos.x;
        
        for(let row = 0; row < this.rows; row++){
            for(let col = 0; col < this.cols; col++){
                if(this.isCellValid(this.cellMap[row][col])){
                    this.cellMap[row][col].opacity = 255;
                }
            }
        }

        // let upEdgeCell = this.searchEdgeCell(this.selectedCell,PushTrainView.DIR.UP);
        // let downEdgeCell = this.searchEdgeCell(this.selectedCell,PushTrainView.DIR.DOWN);
        // let leftEdgeCell = this.searchEdgeCell(this.selectedCell,PushTrainView.DIR.LEFT);
        // let rightEdgeCell =  this.searchEdgeCell(this.selectedCell,PushTrainView.DIR.RIGHT);
        let currentCell = this.getCell(row,col);

        if(this.isCellValid(this.selectedCell)){
            //之前有选中
            if(this.isCellValid(this.cellMap[row][col])){
                //当前有选中 判断能否消除 
                if(this.isInPair(this.selectedCell,currentCell)){
                    //能消除则消除
                    this.removeCell(this.selectedCell);
                    this.removeCell(currentCell);
                    this.selectedCell = null;
                }else{
                    //不能消除则改选
                    this.selectedCell = currentCell;
                }
            }else{
                //当前没选中 表示移动
            }
        }else{
            //之前没选中
            if(!this.isCellValid(this.cellMap[row][col])){
                //当前也没选中
                return;
            }else{
                //当前选中
                this.selectedCell = this.cellMap[row][col];
                this.selectedCell.opacity = 100;
            }
        }
    }

    //找出某个Cell基于某个方向的最边缘的Cell
    searchEdgeCell(targetCell:cc.Node,dir:number) : cc.Node{
        if(!this.isCellValid(targetCell)){
            return;
        }

        let pushCell:PushCell = targetCell.getComponent(PushCell);
        let currentRow = pushCell.row;
        let currentCol = pushCell.col;
        let edgeCell:cc.Node = null;
        if(dir == PushTrainView.DIR.UP){
            //同列不同行
            for(let row = currentRow; row < this.rows; row++){
                if(this.isCellValid(this.cellMap[row][currentCol])){
                    edgeCell = this.cellMap[row][currentCol];
                }else{
                    break;
                }
            }
        }else if(dir == PushTrainView.DIR.DOWN){
            for(let row = currentRow; row >= 0; row--){
                if(this.isCellValid(this.cellMap[row][currentCol])){
                    edgeCell = this.cellMap[row][currentCol];
                }else{
                    break;
                }
            }
        }else if(dir == PushTrainView.DIR.LEFT){
            for(let col = currentCol; col >= 0; col--){
                if(this.isCellValid(this.cellMap[currentRow][col])){
                    edgeCell = this.cellMap[currentRow][col];
                }else{
                    break;
                }
            }
        }else if(dir == PushTrainView.DIR.RIGHT){
            for(let col = currentCol; col < this.cols; col++){
                if(this.isCellValid(this.cellMap[currentRow][col])){
                    edgeCell = this.cellMap[currentRow][col];
                }else{
                    break;
                }
            }
        }

        return edgeCell;
    }

    handleTouchMove(event:cc.Touch){

    }

    handleTouchEnd(event:cc.Touch){

    }

    onDestroy(){
        for(let i = 0; i < this.pushFramePool.length; i++){
            if(this.isCellValid(this.pushFramePool[i])){
                this.pushFramePool[i].destroy();
            }
        }
        this.pushFramePool = [];
    }
}

export = PushTrainView;