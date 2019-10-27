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
import Game = require('../../common/src/Game');
import MapCreator = require('./MapCreator');
import Diamond = require('./Diamond');
import Util = require('../../common/src/Util');
@ccclass
@menu('diamond/DiamondView')
class DiamondView extends cc.Component {
    static DIR = {
        UP : 1,
        DOWN : 2,
        LEFT : 3,
        RIGHT : 4  
    };

    static DISPEL_NUM = 3;
    @property(cc.Prefab)
    diamondPrefab: cc.Prefab = null;

    @property(cc.Node)
    contentNode: cc.Node = null;

    @property(cc.Node)
    chilunList: cc.Node[] = [];

    cols: number = 8;
    rows: number = 8;
    touchLock: boolean = false;
    currentMoveDir: number = null;
    cellMap: any = null;
    selectedCell: cc.Node = null;
    cellOriginPos: cc.Vec2 = new cc.Vec2();
    totalMoveOffset: cc.Vec2 = new cc.Vec2();
    switchTime: number = 0.2;   //交换时长
    dispelTime: number = 0.2;   //消除时长
    static GRAVITY_TIME:number = 0.2;
    static GENERATE_GRAVITY_TIME:number = 0.2;
    isSwitching: boolean = false;

    switchStartDiamond: cc.Node = null;
    switchEndDiamond: cc.Node = null;

    onLoad(){
        // Game.getInstance().diamo
        console.log('DiamondView onLoad');
        this.initDiamonds();
        this.addEvent();
    }

    initDiamonds(){
        let cellList = [1,2,3,4,5];
        let map = MapCreator.createMap(8,8,cellList);
        console.log(JSON.stringify(map));
        let contentSize = this.contentNode.getContentSize();
        let originPos = cc.v2(-contentSize.width/2,-contentSize.height/2);
        this.cellOriginPos = originPos;
        this.cellMap = new Array<Array<any>>(); 
        for(let i = 0; i < map.length; i++){
            let diamond = cc.instantiate(this.diamondPrefab);
            diamond.parent = this.contentNode;
            let pos = MapCreator.get_row_and_col_by_index(i);
            let row = pos.x;
            let col = pos.y;
            if(this.cellMap[row] == null){
                this.cellMap[row] = [];
            }
            this.cellMap[row][col] = diamond;
            let nodePos = this.translateRowColToNodePos(row,col);
            diamond.position = nodePos;
            diamond.getComponent(Diamond).setDiamondId(map[i]);
            diamond.getComponent(Diamond).col = col;
            diamond.getComponent(Diamond).row = row;
        }
    }

    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
    }

    lockTouch(tag:string){
        this.touchLock = true;
        console.log(`lockTouch tag = ${tag}`);
    }

    unlockTouch(tag:string){
        this.touchLock = false;
        console.log(`unlockTouch tag = ${tag}`);
    }

    isTouchLocked(){
        return this.touchLock;
    }

    isCellValid(cell){
        if(cell == 0){
            return false;
        }
        return cc.isValid(cell);
    }

    translateRowColToNodePos(row:number, col:number){
        return cc.v2(this.cellOriginPos.x + col * Diamond.SIZE.width + Diamond.SIZE.width/2,this.cellOriginPos.y + row * Diamond.SIZE.height + Diamond.SIZE.height/2);
    }

    translateToCellPos(pos:cc.Vec2){
        let worldOriginPos = this.node.convertToWorldSpaceAR(this.cellOriginPos);
        let x = pos.x;
        let y = pos.y;
        let cellX = -1;
        let cellY = -1;
        for(let i = 0; i < this.cols; i++){
            if(x >= i * Diamond.SIZE.width + worldOriginPos.x && x < (i+1) * Diamond.SIZE.width + worldOriginPos.x ){
                cellX = i;
                break;
            }
        }

        for(let i = 0; i < this.rows; i++){
            if(y >= i * Diamond.SIZE.height + worldOriginPos.y && y < (i+1) * Diamond.SIZE.height + worldOriginPos.y){
                cellY = i;
                break;
            }
        }

        if(cellX == -1 || cellY == -1){
            return null;
        }else{
            return cc.v2(cellX,cellY);
        }
    }

    handleTouchStart(event:cc.Touch){
        if(this.isTouchLocked()){
            return;
        }
        this.lockTouch('handleTouchStart');
        this.currentMoveDir = null;
        let pos = event.getLocation();
        let cellPos = this.translateToCellPos(pos);
        if(!cellPos){
            console.log(`未选中`);
            this.unlockTouch('handleTouchStart 未选中');
            return;
        }
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        let row = cellPos.y;
        let col = cellPos.x;
        this.selectedCell = this.cellMap[row][col];
        this.totalMoveOffset.x = 0;
        this.totalMoveOffset.y = 0;
        // Util.showToast(`row = ${row} col = ${col}`);
    }

    handleTouchMove(event:cc.Touch){
        if(!this.isCellValid(this.selectedCell)){
            return;
        }
        let pos1 = event.getStartLocation();
        let pos2 = event.getLocation();
        let distance = pos2.sub(pos1).mag();
        let xDistance = Math.pow(pos1.x - pos2.x,2);
        let yDistance = Math.pow(pos1.y - pos2.y,2);
        let xOffset = pos2.x - pos1.x;
        let yOffset = pos2.y - pos1.y;
        let deltaOffset = event.getDelta();
        if(this.currentMoveDir == null){
            if(distance < 20){
                this.currentMoveDir = null;
                return;
            }
            let dir;
            if(xDistance > yDistance){
                if(xOffset >= 0){
                    dir = DiamondView.DIR.RIGHT;
                }else{
                    dir = DiamondView.DIR.LEFT;
                }
            }else{
                if(yOffset >= 0){
                    dir = DiamondView.DIR.UP;
                }else{
                    dir = DiamondView.DIR.DOWN;
                }
            }
            this.currentMoveDir = dir;
        }else{
            return;
        }

        let originCellRow = this.selectedCell.getComponent(Diamond).row;
        let originCellCol = this.selectedCell.getComponent(Diamond).col;
        if(this.currentMoveDir == DiamondView.DIR.LEFT){
            this.switchCell(originCellRow,originCellCol,originCellRow,originCellCol - 1);
        }else if(this.currentMoveDir == DiamondView.DIR.RIGHT){
            this.switchCell(originCellRow,originCellCol,originCellRow,originCellCol + 1);
        }else if(this.currentMoveDir == DiamondView.DIR.UP){
            this.switchCell(originCellRow + 1,originCellCol,originCellRow,originCellCol);
        }else if(this.currentMoveDir == DiamondView.DIR.DOWN){
            this.switchCell(originCellRow - 1,originCellCol,originCellRow,originCellCol);
        }
    }

    handleTouchEnd(event:cc.Touch){
        if(this.isSwitching){
            return;
        }
        this.unlockTouch('handleTouchEnd');
    }

    reback(originCellRow,originCellCol,targetCellRow,targetCellCol){
        this.lockTouch('reback');
        let startDiamond:cc.Node = this.cellMap[originCellRow][originCellCol];
        let endDiamond:cc.Node = this.cellMap[targetCellRow][targetCellCol];
        if(!this.isCellValid(startDiamond)){
            return;
        }

        if(!this.isCellValid(endDiamond)){
            return;
        }

        this.isSwitching = true;
        let startNodePos = this.translateRowColToNodePos(originCellRow,originCellCol);
        let endNodePos = this.translateRowColToNodePos(targetCellRow,targetCellCol);
        startDiamond.getComponent(Diamond).play();
        endDiamond.getComponent(Diamond).play();
        startDiamond.runAction(cc.moveTo(this.switchTime,endNodePos));
        endDiamond.runAction(cc.moveTo(this.switchTime,startNodePos));
        this.switchStartDiamond = startDiamond;
        this.switchEndDiamond = endDiamond;
        this.scheduleOnce(this.handleRebackFinished,this.switchTime);
    }

    handleRebackFinished(){
        this.switchStartDiamond.stopAllActions();
        this.switchEndDiamond.stopAllActions();
        this.switchStartDiamond.getComponent(Diamond).stop();
        this.switchEndDiamond.getComponent(Diamond).stop();
        let startRow = this.switchStartDiamond.getComponent(Diamond).row;
        let startCol = this.switchStartDiamond.getComponent(Diamond).col;
        let endRow = this.switchEndDiamond.getComponent(Diamond).row;
        let endCol = this.switchEndDiamond.getComponent(Diamond).col;

        this.cellMap[startRow][startCol] = this.switchEndDiamond;
        this.switchEndDiamond.getComponent(Diamond).row = startRow;
        this.switchEndDiamond.getComponent(Diamond).col = startCol;

        this.cellMap[endRow][endCol] = this.switchStartDiamond;
        this.switchStartDiamond.getComponent(Diamond).row = endRow;
        this.switchStartDiamond.getComponent(Diamond).col = endCol;
        this.isSwitching = false;
        this.unlockTouch('handleRebackFinished');
        this.switchStartDiamond = null;
        this.switchEndDiamond = null;
    }

    switchCell(originCellRow,originCellCol,targetCellRow,targetCellCol){
        this.lockTouch('switchCell');
        let startDiamond:cc.Node = this.cellMap[originCellRow][originCellCol];
        let endDiamond:cc.Node = this.cellMap[targetCellRow][targetCellCol];
        if(!this.isCellValid(startDiamond)){
            return;
        }

        if(!this.isCellValid(endDiamond)){
            return;
        }

        this.isSwitching = true;
        let startNodePos = this.translateRowColToNodePos(originCellRow,originCellCol);
        let endNodePos = this.translateRowColToNodePos(targetCellRow,targetCellCol);
        startDiamond.getComponent(Diamond).play();
        endDiamond.getComponent(Diamond).play();
        startDiamond.runAction(cc.moveTo(this.switchTime,endNodePos));
        endDiamond.runAction(cc.moveTo(this.switchTime,startNodePos));
        this.switchStartDiamond = startDiamond;
        this.switchEndDiamond = endDiamond;
        this.scheduleOnce(this.handleSwitchFinished,this.switchTime);
    }

    handleSwitchFinished(){
        this.switchStartDiamond.stopAllActions();
        this.switchEndDiamond.stopAllActions();
        this.switchStartDiamond.getComponent(Diamond).stop();
        this.switchEndDiamond.getComponent(Diamond).stop();
        let startRow = this.switchStartDiamond.getComponent(Diamond).row;
        let startCol = this.switchStartDiamond.getComponent(Diamond).col;
        let endRow = this.switchEndDiamond.getComponent(Diamond).row;
        let endCol = this.switchEndDiamond.getComponent(Diamond).col;

        this.cellMap[startRow][startCol] = this.switchEndDiamond;
        this.switchEndDiamond.getComponent(Diamond).row = startRow;
        this.switchEndDiamond.getComponent(Diamond).col = startCol;

        this.cellMap[endRow][endCol] = this.switchStartDiamond;
        this.switchStartDiamond.getComponent(Diamond).row = endRow;
        this.switchStartDiamond.getComponent(Diamond).col = endCol;
        this.isSwitching = false;
        this.unlockTouch('handleSwitchFinished');

        let list1 = this.findDispel(startRow,startCol);
        console.log(`list1.length = ${list1.length}`);
        for(let i = 0; i < list1.length; i++){
            let cell = list1[i];
            let diamond:Diamond = cell.getComponent(Diamond);
            let row = diamond.row;
            let col = diamond.col;
            this.cellMap[row][col] = 0;
            // let scaleTo = cc.scaleTo(this.dispelTime,0).easing(cc.easeBackIn());
            // let remove = cc.removeSelf();
            // cell.runAction(cc.sequence(scaleTo,remove));
        }

        let list2 = this.findDispel(endRow,endCol);
        console.log(`list2.length = ${list2.length}`);
        for(let i = 0; i < list2.length; i++){
            let cell = list2[i];
            let diamond:Diamond = cell.getComponent(Diamond);
            let row = diamond.row;
            let col = diamond.col;
            this.cellMap[row][col] = 0;
            // let scaleTo = cc.scaleTo(this.dispelTime,0).easing(cc.easeBackIn());
            // let remove = cc.removeSelf();
            // cell.runAction(cc.sequence(scaleTo,remove));
        }

        if(list1.length == 0 && list2.length == 0){
            //如果两个都没得消 直接回退
            this.reback(startRow,startCol,endRow,endCol);
        }else{
            let resultMap = [];
            if(list1.length != 0){
                resultMap.push(list1);
            }
            if(list2.length != 0){
                resultMap.push(list2);
            }
            this.clearCell(resultMap);
        }
    }

    clearCell(resultMap){
        //cols is effected
        let colList = [];
        for(let i = 0; i < resultMap.length; i++){
            let resultList = resultMap[i];
            for(let j = 0; j < resultList.length; j++){
                let cell = resultList[j];
                let diamond:Diamond = cell.getComponent(Diamond);
                let row = diamond.row;
                let col = diamond.col;
                let scaleTo = cc.scaleTo(this.dispelTime,0).easing(cc.easeBackIn());
                let remove = cc.removeSelf();
                cell.runAction(cc.sequence(scaleTo,remove));

                let exist = false;
                for(let i = 0; i < colList.length; i++){
                    if(colList[i] == row){
                        exist = true;
                        break;
                    }
                }
                if(!exist){
                    colList.push(col);
                }
            }
        }

        let time1 = this.dispelTime;
        let time2 = DiamondView.GRAVITY_TIME;
        let actionList = [
            cc.delayTime(time1),
            cc.callFunc(this.gravityCell),
            cc.delayTime(time2),

        ];

        this.node.runAction(cc.sequence(actionList));
    }

    gravityCell(colList,time){

    }

    generateCell(colList,time){

    }

    generateCellFinished(){

    }

    findDispel(row,col){
        let list = this.findUpLeftDispel(row,col);
        console.log(`findDispel row = ${row} col = ${col}`);
        if(list.length != 0){
            console.log(`findUpLeftDispel`);
            return list;
        }
        list = this.findUpRightDispel(row,col);
        if(list.length != 0){
            console.log(`findUpRightDispel`);
            return list;
        }
        list = this.findDownLeftDispel(row,col);
        if(list.length != 0){
            console.log(`findDownLeftDispel`);
            return list;
        }
        list = this.findDownRightDispel(row,col);
        if(list.length != 0){
            console.log(`findDownRightDispel`);
            return list;
        }
        list = this.findCenterDownDispel(row,col);
        if(list.length != 0){
            console.log(`findCenterDownDispel`);
            return list;
        }
        list = this.findCenterLeftDispel(row,col);
        if(list.length != 0){
            console.log(`findCenterLeftDispel`);
            return list;
        }
        list =this.findCenterRightDispel(row,col);
        if(list.length != 0){
            console.log(`findCenterRightDispel`);
            return list;
        }
        list = this.findCenterUpDispel(row,col);
        if(list.length != 0){
            console.log(`findCenterUpDispel`);
            return list;
        }
        list = this.findHorizonDispel(row,col);
        if(list.length != 0){
            console.log(`findHorizonDispel`);
            return list;
        }
        list = this.findVerticalDispel(row,col);
        if(list.length != 0){
            console.log(`findVerticalDispel`);
            return list;
        }
        return [];
    }

    //单纯的基于某个行列和方向来查找连续的元素
    search(row,col,dir){
        let cell = this.cellMap[row][col];
        let list = [];
        if(!this.isCellValid(cell)){
            return list;
        }

        let value = cell.getComponent(Diamond).value;
        if(dir == DiamondView.DIR.LEFT){
            for(let i = col - 1; i >= 0; i--){
                let currentCell = this.cellMap[row][i];
                if(this.isCellValid(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }else if(dir == DiamondView.DIR.RIGHT){
            for(let i = col + 1; i < this.cols; i++){
                let currentCell = this.cellMap[row][i];
                if(this.isCellValid(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }else if(dir == DiamondView.DIR.UP){
            for(let i = row + 1; i < this.rows; i++){
                let currentCell = this.cellMap[i][col];
                if(this.isCellValid(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }else if(dir == DiamondView.DIR.DOWN){
            for(let i = row - 1; i >= 0; i--){
                let currentCell = this.cellMap[i][col];
                if(this.isCellValid(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }
        return list;
    }

    /**
     * O
     * O
     * O
     */
    findHorizonDispel(row,col){
        let cell = this.cellMap[row][col];
        if(!this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        list = list.concat(listLeft,listRight)

        if(list.length < DiamondView.DISPEL_NUM){
            console.log(`findHorizonDispel list.length < DiamondView.DISPEL_NUM`);
            list = [];
        }
        return list;
    }

    // OOO
    findVerticalDispel(row,col){
        let cell = this.cellMap[row][col];
        if(!this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        list = list.concat(listUp,listDown);
        if(list.length < DiamondView.DISPEL_NUM){
            console.log(`findVerticalDispel list.length < DiamondView.DISPEL_NUM`);
            list = [];
        }
        return list;
    }

    /**   O 
     *    O
     *  OOX
     */
    findUpLeftDispel(row,col){
        let cell = this.cellMap[row][col];
        if(!this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 2){
            console.log(`findUpLeftDispel left return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 2){
            console.log(`findUpLeftDispel up return`);
            return [];
        }
        return list.concat(listLeft,listUp);
    }

    /**
     * O
     * O
     * XOO
     */
    findUpRightDispel(row,col){
        let cell = this.cellMap[row][col];
        if(!this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 2){
            console.log(`findUpRightDispel right return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 2){
            console.log(`findUpRightDispel up return`);
            return [];
        }
        return list.concat(listRight,listUp);
    }

    /**
     *  OOX
     *    O
     *    O
     */
    findDownLeftDispel(row,col){
        let cell = this.cellMap[row][col];
        if(this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 2){
            console.log(`findDownLeftDispel down return`);
            return [];
        }
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 2){
            console.log(`findDownLeftDispel left return`);
            return [];
        }
        return list.concat(listDown,listLeft);
    }

    /**
     *  XOO 
     *  O
     *  O
     */
    findDownRightDispel(row,col){
        let cell = this.cellMap[row][col];
        if(this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 2){
            console.log(`findDownRightDispel down return`);
            return [];
        }
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 2){
            console.log(`findDownRightDispel right return`);
            return [];
        }
        return list.concat(listDown,listRight);
    }

    /**  O
     *   O
     *  OXO
     */
    findCenterUpDispel(row,col){
        let cell = this.cellMap[row][col];
        if(this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 1){
            console.log(`findCenterUpDispel left return`);
            return [];
        }
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 1){
            console.log(`findCenterUpDispel right return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 2){
            console.log(`findCenterUpDispel up return`);
            return [];
        }
        return list.concat(listLeft,listRight,listUp);
    }

    /**
     *  OXO
     *   O
     *   O
     */
    findCenterDownDispel(row,col){
        let cell = this.cellMap[row][col];
        if(this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 1){
            console.log(`findCenterDownDispel left return`);
            return [];
        }
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 1){
            console.log(`findCenterDownDispel right return`);
            return [];
        }
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 2){
            console.log(`findCenterDownDispel down return`);
            return [];
        }
        return list.concat(listLeft,listRight,listDown);
    }

    /**   O
     *  OOX
     *    O
     */
    findCenterLeftDispel(row,col){
        let cell = this.cellMap[row][col];
        if(this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 2){
            console.log(`findCenterLeftDispel left return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 1){
            console.log(`findCenterLeftDispel up return`);
            return [];
        }
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 1){
            console.log(`findCenterLeftDispel down return`);
            return [];
        }
        return list.concat(listLeft,listUp,listDown);
    }

    /** O
     *  XOO
     *  O
     */
    findCenterRightDispel(row,col){
        let cell = this.cellMap[row][col];
        if(this.isCellValid(cell)){
            return [];
        }
        let list = [cell];
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 2){
            console.log(`findCenterRightDispel right return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 1){
            console.log(`findCenterRightDispel up return`);
            return [];
        }
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 1){
            console.log(`findCenterRightDispel down return`);
            return [];
        }
        return list.concat(listRight,listUp,listDown);
    }
}
export = DiamondView;
