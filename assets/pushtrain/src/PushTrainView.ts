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
import EventConfig = require('../../common/src/EventConfig');

@ccclass
class PushTrainView extends cc.Component {
    static DIR = {
        UP : 1,
        DOWN : 2,
        LEFT : 3,
        RIGHT : 4  
    };

    static DIR_TYPE = {
        HORI : 1,
        VERT : 2,
    }

    cols: number = 9;
    rows: number = 12;

    @property(cc.Node)
    btnHelp:cc.Node = null;

    @property(cc.Prefab)
    pushCellPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    helpFrame: cc.Prefab = null;

    cellMap:any[][];
    cellValueMap:any[][];

    data: number[] = [];
    selectedCell:cc.Node = null;
    totalMoveCells: cc.Node[] = [];
    helpFrameList: cc.Node[] = [];
    cellOriginPos:cc.Vec2 = new cc.Vec2();
    pushFramePool:cc.Node[] = [];
    currentMoveDir: number = null;
    totalMoveOffset: cc.Vec2 = new cc.Vec2();
    moveLimitOffset: cc.Vec2 = new cc.Vec2();
    moveGridNum: number = 0;
    confirmView: cc.Node = null;
    isNeedConfirm: boolean = false;
    touchLock: boolean = false;

    onLoad(){
        Game.getInstance().pushTrain.setRootView(this);
        this.addEvent();
        this.initData();
        this.initCells();
    }

    lockTouch(){
        this.touchLock = true;
    }

    unlockTouch(){
        this.touchLock = false;
    }

    isTouchLocked(){
        return this.touchLock;
    }

    addEvent(){
        this.btnHelp.on('click',()=>{
            let now1 = Util.getPerformNow();
            let cellList = this.help();
            let now2 = Util.getPerformNow();
            console.log('help cost ' + (now2 - now1) + 'ms');
            for(let i = 0; i < this.helpFrameList.length; i++){
                this.helpFrameList[i].destroy();
            }
            this.helpFrameList = [];
            if(cellList){
                for(let i = 0;i < cellList.length; i++){
                    let cell:PushCell = cellList[i].getComponent(PushCell);
                    let row = cell.row;
                    let col = cell.col;
                    let nodePos = this.translateRowColToNodePos(row,col);
                    this.createHelpFrame(nodePos);
                }
            }
        },this);
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
    }

    createHelpFrame(nodePos){
        let frame = cc.instantiate(this.helpFrame);
        frame.position = nodePos;
        frame.parent = this.node;
        this.helpFrameList.push(frame);
    }

    removeEvent(){
        Game.getInstance().gNode.targetOff(this);
    }

    initData(){
        for(let i = 1; i <= 27; i++){
            for(let count = 1; count <= 4; count++){
                this.data.push(i);
            }
        }
    }

    initCells(){
        //计算出左上角的原点位置
        //分小格 一小格为100/2
        this.cellMap = new Array<Array<any>>();
        this.cellValueMap = new Array<Array<any>>();
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
                if(this.cellValueMap[num] == null){
                    this.cellValueMap[num] = [];
                }
                this.data.splice(randomIndex,1);
                let cell = cc.instantiate(this.pushCellPrefab);
                cell.parent = this.node;
                let nodePos = this.translateRowColToNodePos(j,i);
                cell.getComponent(PushCell).setPosition(nodePos);
                cell.getComponent(PushCell).col = i;
                cell.getComponent(PushCell).row = j;
                cell.getComponent(PushCell).setNum(num);
                this.cellMap[j][i] = cell;
                this.cellValueMap[num].push(cell);
            }
        }

        console.log(this.cellMap);
    }

    //将row和col转换为真实的坐标点位
    translateRowColToNodePos(row:number, col:number){
        return cc.v2(this.cellOriginPos.x + col * PushCell.CELL_SIZE.width + PushCell.CELL_SIZE.width/2,this.cellOriginPos.y + row * PushCell.CELL_SIZE.height + PushCell.CELL_SIZE.height/2)
    }

    //全部转换为世界坐标计算 其中originPos也要转换
    translateToCellPos(pos:cc.Vec2){
        let worldOriginPos = this.node.convertToWorldSpaceAR(this.cellOriginPos);
        // console.log('pos = ' + JSON.stringify(pos) + ' worldOriginPos = ' + JSON.stringify(worldOriginPos));
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

    help(){
        for(let num = 1; num <= 27; num++){
            let cellList = this.cellValueMap[num];
            for(let i = 0; i < cellList.length; i++){
                for(let j = 0; j < cellList.length; j++){
                    if(i == j){
                        continue;
                    }

                    if(this.isInPairInPath(cellList[i],cellList[j]) == true){
                        return [cellList[i],cellList[j]]
                    }
                }
            }
        }
    }

    //通过平移一次可以消除
    isInPairInPath(cell1:cc.Node,cell2:cc.Node){
        let ret = this.checkPairPath(cell1,cell2);
        return ret;
    }

    //通过移动originCell达到与targetCell消除
    checkPairPath(originCellNode:cc.Node,targetCellNode:cc.Node){
        let originCell = originCellNode.getComponent(PushCell);
        let targetCell = targetCellNode.getComponent(PushCell);
        let originRow = originCell.row;
        let originCol = originCell.col;
        let targetRow = targetCell.row;
        let targetCol = targetCell.col;
        if(originRow == targetRow && originCol == targetCol){
            //同一个Cell不能消
            Util.showToast('checkPairPath相同的Cell');
            return false;
        }

        if(originRow == targetRow || originCol == targetCol){
            //行相同或者列相同 直接判断是否能相消
            let ret = this.isCellInPairDirectly(originCellNode,targetCellNode);
            console.log(`@@@row1 = ${originRow} col1 = ${originCol} row2 = ${targetRow} col2 = ${targetCol} 111111111111 ret = ${ret}`);
            return ret;
        }

        //行列都不相同 考虑移动后相消的可能性
        let vertDir,horiDir;
        if(originRow < targetRow){
            vertDir = PushTrainView.DIR.UP;
        }else{
            vertDir = PushTrainView.DIR.DOWN;
        }
        if(originCol < targetCol){
            horiDir = PushTrainView.DIR.RIGHT;
        }else{
            horiDir = PushTrainView.DIR.LEFT;
        }

        //先横后竖
        let offsetLimit = this.findCanMoveLimitOffset(originCellNode,horiDir);
        let canMove = true;
        let ret = false;
        //平移都办不到 直接false
        if(Math.abs(originCol - targetCol) * PushCell.CELL_SIZE.width > Math.abs(offsetLimit.x)){
            console.log(`@@@row1 = ${originRow} col1 = ${originCol} row2 = ${targetRow} col2 = ${targetCol} 22222 offsetLimit = ${JSON.stringify(offsetLimit)} horiDir = ${horiDir}`);
            canMove = false;
        }
        //用平移后的数据进行比对 col统一用targetCol
        if(canMove){
            ret = this.isInPairDirectly(originRow,targetCol,targetRow,targetCol);
            if(ret == true){
                console.log(`@@@row1 = ${originRow} col1 = ${originCol} row2 = ${targetRow} col2 = ${targetCol} 33333 ret = ${ret}`);
                return true;
            }
        }
        
        //先竖后横
        canMove = true;
        offsetLimit = this.findCanMoveLimitOffset(originCellNode,vertDir);
        //平移都办不到 直接false
        if(Math.abs(originRow - targetRow) * PushCell.CELL_SIZE.height > Math.abs(offsetLimit.y)){
            console.log(`@@@row1 = ${originRow} col1 = ${originCol} row2 = ${targetRow} col2 = ${targetCol} 44444 offsetLimit = ${JSON.stringify(offsetLimit)} vertDir = ${vertDir}`);
            canMove = false;
        }
        //用平移后的数据进行比对 row同意用targetRow
        if(canMove){
            ret = this.isInPairDirectly(targetRow,originCol,targetRow,targetCol);
            console.log(`@@@row1 = ${originRow} col1 = ${originCol} row2 = ${targetRow} col2 = ${targetCol} 55555 ret = ${ret}`);
        }
        
        return ret;
    }

    //参数为两个cell的row,col 默认两个cell的值是一样的
    isInPairDirectly(originRow:number,originCol:number,targetRow:number,targetCol:number){
        if(originRow == targetRow && originCol == targetCol){
            Util.showToast('isInPairDirectly the same cell');
            return false;
        }

        if(originRow != targetRow && originCol != targetCol){
            //行列都不一样
            return false;
        }

        if(originRow == targetRow){
            let row = originRow;
            //行相同 判断两cell之间是否穿插其他cell
            let lowCol,highCol;
            if(originCol < targetCol){
                lowCol = originCol;
                highCol = targetCol;
            }else if(originCol > targetCol){
                lowCol = targetCol;
                highCol = originCol;
            }

            for(let col = lowCol + 1; col <= highCol - 1; col++){
                if(this.isCellValid(this.cellMap[row][col])){
                    return false;
                }
            }
        }else if(originCol == targetCol){
            let col = originCol;
            let lowRow,highRow;
            if(originRow < targetRow){
                lowRow = originRow;
                highRow = targetRow;
            }else if(originRow > targetRow){
                lowRow = targetRow;
                highRow = originRow;
            }
            for(let row = lowRow + 1; row <= highRow - 1; row++){
                if(this.isCellValid(this.cellMap[row][col])){
                    return false;
                }
            }
        }

        return true;
    }

    //是否能消除(肉眼可见的那种 无需平移)
    isCellInPairDirectly(cell1:cc.Node,cell2:cc.Node) : boolean{
        if(!this.isCellValid(cell1) || !this.isCellValid(cell2)){
            return false;
        }
        
        let pushCell1:PushCell = cell1.getComponent(PushCell);
        let pushCell2:PushCell = cell2.getComponent(PushCell);

        if(pushCell1.row == pushCell2.row && pushCell1.col == pushCell2.col){
            //同一个cell 不能自己与自己消除
            return false;
        }

        if(cell1.getComponent(PushCell).num != cell2.getComponent(PushCell).num){
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

            console.log(`lowCol = ${lowCol} highCol = ${highCol}`);
            for(let col = lowCol + 1; col <= highCol - 1; col++){
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
            console.log(`lowRow = ${lowRow} highRow = ${highRow}`);
            for(let row = lowRow + 1; row <= highRow - 1; row++){
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
        let num = cell.getComponent(PushCell).num;
        cell.destroy();
        this.cellMap[row][col] = 0;
        let cellValueList = this.cellValueMap[num];
        for(let i = 0; i < cellValueList.length; i++){
            if(cellValueList[i].getComponent(PushCell).row == row && cellValueList[i].getComponent(PushCell).col == col){
                cellValueList.splice(i,1);
                break;
            }
        }
    }

    getCell(row,col){
        if(this.cellMap[row] == null){
            return;
        }

        return this.cellMap[row][col];
    }

    //找出基于Cell能一起移动的所有Cells
    findCanMoveCellsByDir(cell:cc.Node,dir:number){
        if(!this.isCellValid(cell)){
            return [];
        }

        let currentCol = cell.getComponent(PushCell).col;
        let currentRow = cell.getComponent(PushCell).row;
        let cellList = [];

        if(dir == PushTrainView.DIR.LEFT){
            for(let col = currentCol; col >= 0; col--){
                let cell = this.getCell(currentRow,col);
                if(this.isCellValid(cell)){
                    cellList.push(cell);
                }else{
                    break;
                }
            }
        }else if(dir == PushTrainView.DIR.RIGHT){
            for(let col = currentCol; col < this.cols; col++){
                let cell = this.getCell(currentRow,col);
                if(this.isCellValid(cell)){
                    cellList.push(cell);
                }else{
                    break;
                }
            }
        }else if(dir == PushTrainView.DIR.UP){
            for(let row = currentRow; row < this.rows; row++){
                let cell = this.getCell(row,currentCol);
                if(this.isCellValid(cell)){
                    cellList.push(cell);
                }else{
                    break;
                }
            }
        }else if(dir == PushTrainView.DIR.DOWN){
            for(let row = currentRow; row >= 0; row--){
                let cell = this.getCell(row,currentCol);
                if(this.isCellValid(cell)){
                    cellList.push(cell);
                }else{
                    break;
                }
            }
        }

        return cellList;
    }

    findCanMoveLimitOffset(cell:cc.Node, dir:number) : cc.Vec2{
        let offset = cc.v2(0,0);
        if(!this.isCellValid(cell)){
            console.log('@@@findCanMoveLimitOffset00000');
            return offset;
        }

        let edgeCell = this.searchEdgeCell(cell,dir);
        let row = edgeCell.getComponent(PushCell).row;
        let col = edgeCell.getComponent(PushCell).col;
        console.log('@@@findCanMoveLimitOffset11111');
        while(1){
            if(dir == PushTrainView.DIR.UP){
                row++;
            }else if(dir == PushTrainView.DIR.DOWN){
                row--;
            }else if(dir == PushTrainView.DIR.LEFT){
                col--;
            }else if(dir == PushTrainView.DIR.RIGHT){
                col++;
            }

            if(row < 0 || row > this.rows - 1 || col < 0 || col > this.cols - 1){
                //越界
                console.log('findCanMoveLimitOffset2222 break');
                break;
            }

            if(this.isCellValid(this.cellMap[row][col])){
                //有cell挡住 不能移动
                console.log('findCanMoveLimitOffset3333 break');
                break;
            }

            if(dir == PushTrainView.DIR.UP){
                offset.y += PushCell.CELL_SIZE.height;
            }else if(dir == PushTrainView.DIR.DOWN){
                offset.y -= PushCell.CELL_SIZE.height;
            }else if(dir == PushTrainView.DIR.LEFT){
                offset.x -= PushCell.CELL_SIZE.width;
            }else if(dir == PushTrainView.DIR.RIGHT){
                offset.x += PushCell.CELL_SIZE.width;
            }
        }
        return offset;
    }

    //找出某个Cell基于某个方向的最边缘的Cell
    searchEdgeCell(targetCell:cc.Node,dir:number) : cc.Node{
        if(!this.isCellValid(targetCell)){
            return;
        }

        let pushCell:PushCell = targetCell.getComponent(PushCell);
        let currentRow = pushCell.row;
        let currentCol = pushCell.col;
        let edgeCell:cc.Node = targetCell;
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

    handleTouchStart(event:cc.Touch){
        if(this.isTouchLocked()){
            return;
        }
        this.currentMoveDir = null;
        let pos = event.getLocation();
        let cellPos = this.translateToCellPos(pos);
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        let row = cellPos.y;
        let col = cellPos.x;
        let currentCell = this.getCell(row,col);
        this.totalMoveOffset.x = 0;
        this.totalMoveOffset.y = 0;

        for(let i = 0; i < this.rows; i++){
            for(let j = 0; j < this.cols; j++){
                if(this.isCellValid(this.cellMap[i][j])){
                    this.cellMap[i][j].opacity = 255;
                }
            }
        }

        if(this.isCellValid(this.selectedCell)){
            //之前有选中
            if(this.isCellValid(this.cellMap[row][col])){
                //当前有选中 判断能否消除 
                if(this.isCellInPairDirectly(this.selectedCell,currentCell)){
                    //能消除则消除
                    this.removeCell(this.selectedCell);
                    this.removeCell(currentCell);
                    this.selectedCell = null;
                }else{
                    //不能消除则改选
                    this.selectedCell = currentCell;
                }
            }
        }else{
            //之前没选中
            if(!this.isCellValid(this.cellMap[row][col])){
                //当前也没选中 取消选中
                this.selectedCell = null;
                return;
            }else{
                //当前选中
                this.selectedCell = this.cellMap[row][col];
            }
        }

        if(this.isCellValid(this.selectedCell)){
            this.selectedCell.opacity = 100;
        }

        if(this.isCellValid(currentCell)){
            currentCell.opacity = 150;
        }
    }

    //一旦初始方向确定后 直到touchCancel前 方向都得保持当前方向
    handleTouchMove(event:cc.Touch){
        if(this.isTouchLocked()){
            console.log('handleTouchMove11111');
            return;
        }
        if(!this.isCellValid(this.selectedCell)){
            console.log('handleTouchMove22222');
            return;
        }
        let pos1 = event.getStartLocation();
        let pos2 = event.getLocation();
        let r = Util.getAngleByPos(pos2,pos1)
        let distance = pos2.sub(pos1).mag();
        let xDistance = Math.pow(pos1.x - pos2.x,2);
        let yDistance = Math.pow(pos1.y - pos2.y,2);
        let xOffset = pos2.x - pos1.x;
        let yOffset = pos2.y - pos1.y;

        let deltaOffset = event.getDelta();
        // console.log('deltaOffset = ' + JSON.stringify(deltaOffset));

        if(this.currentMoveDir == null){
            if(distance < 20){
                this.currentMoveDir = null;
                console.log('handleTouchMove33333');
                return;
            }
            let dir;
            if(xDistance > yDistance){
                if(xOffset >= 0){
                    dir = PushTrainView.DIR.RIGHT;
                }else{
                    dir = PushTrainView.DIR.LEFT;
                }
            }else{
                if(yOffset >= 0){
                    dir = PushTrainView.DIR.UP;
                }else{
                    dir = PushTrainView.DIR.DOWN;
                }
            }
            this.currentMoveDir = dir;
            this.totalMoveCells = this.findCanMoveCellsByDir(this.selectedCell,this.currentMoveDir);
            this.moveLimitOffset = this.findCanMoveLimitOffset(this.selectedCell,this.currentMoveDir);
        }else{
            if(this.moveLimitOffset.x == 0 && this.moveLimitOffset.y == 0){
                //没有可移动的空间
                console.log('handleTouchMove44444');
                return;
            }
            let moveOffset = cc.v2(0,0);
            if(this.currentMoveDir == PushTrainView.DIR.UP){
                let deltaOffsetY = deltaOffset.y;
                if(deltaOffsetY < 0){
                    //保持move方向一致
                    console.log('handleTouchMove55555');
                    return;
                }
                moveOffset.y = deltaOffsetY;
            }else if(this.currentMoveDir == PushTrainView.DIR.DOWN){
                let deltaOffsetY = deltaOffset.y;
                if(deltaOffsetY > 0){
                    console.log('handleTouchMove66666');
                    return;
                }
                moveOffset.y = deltaOffsetY;
            }else if(this.currentMoveDir == PushTrainView.DIR.LEFT){
                let deltaOffsetX = deltaOffset.x;
                if(deltaOffsetX > 0){
                    console.log('handleTouchMove77777');
                    return;
                }
                moveOffset.x = deltaOffsetX;
            }else if(this.currentMoveDir == PushTrainView.DIR.RIGHT){
                let deltaOffsetX = deltaOffset.x;
                if(deltaOffsetX < 0){
                    console.log('handleTouchMove88888');
                    return;
                }
                moveOffset.x = deltaOffsetX;
            }

            //根据limit 限制 totalMoveOffset
            //预演算
            let totalMoveOffsetX = this.totalMoveOffset.x + moveOffset.x;
            let totalMoveOffsetY = this.totalMoveOffset.y + moveOffset.y;
            if(this.currentMoveDir == PushTrainView.DIR.UP){
                if(totalMoveOffsetY > this.moveLimitOffset.y){
                    moveOffset.y = this.moveLimitOffset.y - this.totalMoveOffset.y;
                }
            }else if(this.currentMoveDir == PushTrainView.DIR.DOWN){
                if(totalMoveOffsetY < this.moveLimitOffset.y){
                    moveOffset.y = this.moveLimitOffset.y - this.totalMoveOffset.y;
                }
            }else if(this.currentMoveDir == PushTrainView.DIR.LEFT){
                if(totalMoveOffsetX < this.moveLimitOffset.x){
                    moveOffset.x = this.moveLimitOffset.x - this.totalMoveOffset.x;
                }
            }else if(this.currentMoveDir == PushTrainView.DIR.RIGHT){
                if(totalMoveOffsetX > this.moveLimitOffset.x){
                    moveOffset.x = this.moveLimitOffset.x - this.totalMoveOffset.x;
                }
            }

            for(let i = 0; i < this.totalMoveCells.length; i++){
                this.totalMoveCells[i].x += moveOffset.x;
                this.totalMoveCells[i].y += moveOffset.y;
            }
            this.totalMoveOffset.x += moveOffset.x;
            this.totalMoveOffset.y += moveOffset.y;
        }
    }

    handleTouchEnd(event:cc.Touch){
        if(this.isTouchLocked()){
            return;
        }
        if(this.totalMoveOffset.x == 0 && this.totalMoveOffset.y == 0){
            //说明是点击
            console.log('return 111111111');
            return;
        }

        //要么x为0 要么y为0
        if(this.totalMoveOffset.x == 0){
            //x=0 说明是y方向
            let offsetY = this.totalMoveOffset.y;
            let num = Math.round(offsetY / PushCell.CELL_SIZE.height);
            this.moveGridNum = num;
            //集合倒序处理
            for(let i = this.totalMoveCells.length - 1; i >= 0; i--){
                let cell = this.totalMoveCells[i];
                let oldRow = cell.getComponent(PushCell).row;
                let oldCol = cell.getComponent(PushCell).col;
                let newRow = oldRow + num;
                let newCol = oldCol;
                let newPos = this.translateRowColToNodePos(newRow,newCol);
                if(this.cellMap[oldRow] == null){
                    console.log(`oldRow = ${oldRow} cellMap is null`);
                }
                this.cellMap[oldRow][oldCol] = 0;
                this.cellMap[newRow][newCol] = cell;
                cell.getComponent(PushCell).row = newRow;
                cell.getComponent(PushCell).col = newCol;
                cell.position = newPos;
                console.log('newRow = ' + newRow + ' newCol = ' + newCol + ' num = ' + num);
            }
        }else{
            //y=0 说明是x方向
            let offsetX = this.totalMoveOffset.x;
            let num = Math.round(offsetX / PushCell.CELL_SIZE.width);
            this.moveGridNum = num;
            for(let i = this.totalMoveCells.length - 1; i >= 0; i--){
                let cell = this.totalMoveCells[i];
                let oldRow = cell.getComponent(PushCell).row;
                let oldCol = cell.getComponent(PushCell).col;
                let newRow = oldRow;
                let newCol = oldCol + num;
                let newPos = this.translateRowColToNodePos(newRow,newCol);
                this.cellMap[oldRow][oldCol] = 0;
                this.cellMap[newRow][newCol] = cell;
                cell.getComponent(PushCell).row = newRow;
                cell.getComponent(PushCell).col = newCol;
                cell.position = newPos;
                console.log('newRow = ' + newRow + ' newCol = ' + newCol + ' num = ' + num);
            }
        }
        //可消除的cell集合
        let cellList = this.checkCanElimationCells(this.selectedCell);
        //完毕后判断selectedCell能否消除 不能消除则直接回滚
        if(cellList.length == 0){
            this.rollBack();
        }else{
            //直接取第一个进行消除
            let elimationCell = cellList[0];
            this.removeCell(elimationCell);
            this.removeCell(this.selectedCell);
        }
        this.resetTouchEndData();
    }

    rollBack(){
        if(this.moveGridNum == 0){
            return;
        }
        let num = -this.moveGridNum;
        if(this.totalMoveOffset.x == 0){
            for(let i = 0; i < this.totalMoveCells.length; i++){
                let cell = this.totalMoveCells[i];
                let oldRow = cell.getComponent(PushCell).row;
                let oldCol = cell.getComponent(PushCell).col;
                let newRow = oldRow + num;
                let newCol = oldCol;
                let newPos = this.translateRowColToNodePos(newRow,newCol);
                this.cellMap[oldRow][oldCol] = 0;
                this.cellMap[newRow][newCol] = cell;
                cell.getComponent(PushCell).row = newRow;
                cell.getComponent(PushCell).col = newCol;
                cell.position = newPos;
            }
        }else{
            for(let i = 0; i < this.totalMoveCells.length; i++){
                let cell = this.totalMoveCells[i];
                let oldRow = cell.getComponent(PushCell).row;
                let oldCol = cell.getComponent(PushCell).col;
                let newRow = oldRow;
                let newCol = oldCol + num;
                let newPos = this.translateRowColToNodePos(newRow,newCol);
                this.cellMap[oldRow][oldCol] = 0;
                this.cellMap[newRow][newCol] = cell;
                cell.getComponent(PushCell).row = newRow;
                cell.getComponent(PushCell).col = newCol;
                cell.position = newPos;
            }
        }
    }

    resetTouchEndData(){
        this.selectedCell = null;
        this.totalMoveCells = [];
        this.totalMoveOffset.x = 0;
        this.totalMoveOffset.y = 0;
        this.currentMoveDir = null;
        this.moveGridNum = 0;
    }

    checkCellElimationByDir(cell:cc.Node, dir:number):cc.Node{
        let row = cell.getComponent(PushCell).row;
        let col = cell.getComponent(PushCell).col;
        let node:cc.Node = null;
        while(1){
            if(dir == PushTrainView.DIR.UP){
                row++;
            }else if(dir == PushTrainView.DIR.DOWN){
                row--;
            }else if(dir == PushTrainView.DIR.LEFT){
                col--;
            }else if(dir == PushTrainView.DIR.RIGHT){
                col++;
            }

            if(row < 0 || row > this.rows - 1 || col < 0 || col > this.cols - 1){
                //越界
                break;
            }

            //找到对应方向的第一个Cell
            if(this.isCellValid(this.cellMap[row][col])){
                //有cell挡住 不能移动
                if(cell.getComponent(PushCell).num == this.cellMap[row][col].getComponent(PushCell).num){
                    node = this.cellMap[row][col];
                }
                break;
            }
        }

        return node;
    }

    checkCanElimationCells(cell:cc.Node):cc.Node[]{
        let cellList = [];
        let upCell = this.checkCellElimationByDir(cell,PushTrainView.DIR.UP);
        if(upCell){
            cellList.push(upCell);
        }
        let downCell = this.checkCellElimationByDir(cell,PushTrainView.DIR.DOWN);
        if(downCell){
            cellList.push(downCell);
        }
        let leftCell = this.checkCellElimationByDir(cell,PushTrainView.DIR.LEFT);
        if(leftCell){
            cellList.push(leftCell);
        }
        let rightCell = this.checkCellElimationByDir(cell,PushTrainView.DIR.RIGHT);
        if(rightCell){
            cellList.push(rightCell);
        }
        return cellList;
    }

    onDestroy(){
        for(let i = 0; i < this.pushFramePool.length; i++){
            if(this.isCellValid(this.pushFramePool[i])){
                this.pushFramePool[i].destroy();
            }
        }
        this.pushFramePool = [];
        this.removeEvent();
    }
}

export = PushTrainView;