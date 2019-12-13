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
import Stone = require('./Stone');
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

    @property(cc.Prefab)
    stonePrefab: cc.Prefab = null;

    @property(cc.Node)
    contentNode: cc.Node = null;

    @property(cc.Node)
    chilunList: cc.Node[] = [];

    @property(cc.Node)
    btnTime: cc.Node = null;

    @property({ type: cc.AudioClip })
    sounds: cc.AudioClip[] = [];

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
    effectColList: number[] = [];
    outsideCellList:cc.Node[] = [];

    onLoad(){
        // Game.getInstance().diamo
        console.log('DiamondView onLoad');
        this.initDiamonds();
        this.updateAllStones();
        this.addEvent();
    }

    createRandomDiamond():cc.Node{
       let randomId = Util.random(5);
       let diamond = cc.instantiate(this.diamondPrefab);
       diamond.parent = this.contentNode;
       diamond.getComponent(Diamond).setDiamondId(randomId);
       return diamond;
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
            let pos = MapCreator.get_row_and_col_by_index(i);
            let row = pos.x;
            let col = pos.y;
            if(map[i] < Stone.BASE_ID){
                let diamond = cc.instantiate(this.diamondPrefab);
                diamond.parent = this.contentNode;
                if(this.cellMap[row] == null){
                    this.cellMap[row] = [];
                }
                this.cellMap[row][col] = diamond;
                let nodePos = this.translateRowColToNodePos(row,col);
                diamond.position = nodePos;
                diamond.getComponent(Diamond).setDiamondId(map[i]);
                diamond.getComponent(Diamond).col = col;
                diamond.getComponent(Diamond).row = row;
            }else{
                let stone = cc.instantiate(this.stonePrefab);
                stone.parent = this.contentNode;
                if(this.cellMap[row] == null){
                    this.cellMap[row] = [];
                }
                this.cellMap[row][col] = stone;
                let nodePos = this.translateRowColToNodePos(row,col);
                stone.position = nodePos;
                stone.getComponent(Stone).setStoneId(Stone.BASE_ID);
                stone.getComponent(Stone).col = col;
                stone.getComponent(Stone).row = row;
            }
        }
    }

    //isFirst用于处理草 只有第一个更新时 石头上方没石头 则会有草
    updateAllStones(isFirst:boolean = false){
        for(let row = 0; row < 4; row++){
            for(let col = 0; col < 8; col++){
                let cell = this.cellMap[row][col];
                if(this.isStone(cell)){
                    this.updateStone(cell);
                }
            }
        }
    }

    updateStone(cell:cc.Node){
        let row = cell.getComponent(Stone).row;
        let col = cell.getComponent(Stone).col;
        let stone:Stone = cell.getComponent(Stone);
        //deal left and right
        let leftCell = this.cellMap[row][col - 1];
        let rightCell = this.cellMap[row][col + 1];
        let topCell = this.cellMap[row + 1][col];
        stone.setLeftEdgeVisible(!this.isStone(leftCell));
        stone.setRightEdgeVisible(!this.isStone(rightCell));
        stone.setTopEdgeVisible(!this.isStone(topCell));
    }

    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
        this.btnTime.on('click',()=>{
            // this.resetAllCellPos();
            this.dumpCellInfo();
        });
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
        if(cell == 0 || cell == null){
            return false;
        }
        return cc.isValid(cell);
    }

    isStone(cell){
        if(!this.isCellValid(cell)){
            return false;
        }
        if(cell.getComponent(Stone) == null){
            return false;
        }
        return true;
    }

    isDiamond(cell){
        if(!this.isCellValid(cell)){
            return false;
        }
        if(cell.getComponent(Diamond) == null){
            return false;
        }
        return true;
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
        if(this.isSwitching){
            console.log("handleTouchStart isSwitching = true return");
            return;
        }
        if(this.isTouchLocked()){
            console.log("handleTouchStart isTouchLocked = true return");
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
        let cell = this.cellMap[row][col];
        if(!this.isDiamond(cell)){
            console.log(`选中的不是宝石`);
            this.unlockTouch('handleTouchStart 未选中宝石');
            return;
        }
        this.selectedCell = cell;
        this.totalMoveOffset.x = 0;
        this.totalMoveOffset.y = 0;
    }

    handleTouchMove(event:cc.Touch){
        if(this.isSwitching){
            console.log("handleTouchStart isSwitching = true return");
            return;
        }
        if(!this.isCellValid(this.selectedCell)){
            return;
        }
        console.log("handleTouchMove");
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
        // endDiamond.runAction(cc.moveTo(this.switchTime,startNodePos));
        endDiamond.runAction(cc.sequence(
            cc.moveTo(this.switchTime,startNodePos),
            cc.callFunc(()=>{
                this.handleRebackFinished();
            })
        ));
        console.log("endNodePos = " + JSON.stringify(endNodePos) + " startNodePos = " + JSON.stringify(startNodePos));
        this.switchStartDiamond = startDiamond;
        this.switchEndDiamond = endDiamond;
    }

    handleRebackFinished(){
        console.log("switchStartDiamond.pos = " + JSON.stringify(this.switchStartDiamond.position) + " switchEndDiamond.pos = " + JSON.stringify(this.switchEndDiamond.position));
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
        this.selectedCell = null;
    }

    switchCell(originCellRow,originCellCol,targetCellRow,targetCellCol){
        this.lockTouch('switchCell');
        let startDiamond:cc.Node = this.cellMap[originCellRow][originCellCol];
        let endDiamond:cc.Node = this.cellMap[targetCellRow][targetCellCol];
        if(!this.isDiamond(startDiamond)){
            return;
        }

        if(!this.isDiamond(endDiamond)){
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
            this.clearCell(resultMap,'normal');
        }
    }

    resetEffectCols(){
        this.effectColList = [];
    }

    addEffectCols(cols:number[]){
        for(let i = 0; i < cols.length; i++){
            if(this.effectColList.indexOf(cols[i]) == -1){
                this.effectColList.push(cols[i]);
            }
        }
    }

    clearCell(resultMap,flag){
        console.log("clearCell flag = " + flag);
        Util.playAudioEffect(this.sounds[0],false);
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
                let cb = cc.callFunc(function(){
                    diamond.destroy();
                }.bind(diamond))
                cell.runAction(cc.sequence(scaleTo,cb));
                this.cellMap[row][col] = 0;

                let effectColList = [col];

                //针对被cell影响的stone做处理 非stone则忽略
                let stoneList = [];
                if(col != 0){
                    let leftCell = this.cellMap[row][col - 1];
                    if(this.isStone(leftCell)){
                        stoneList.push(leftCell);
                        effectColList.push(col - 1);
                    }
                }
                if(col != this.cols - 1){
                    let rightCell = this.cellMap[row][col + 1];
                    if(this.isStone(rightCell)){
                        stoneList.push(rightCell);
                        effectColList.push(col + 1);
                    }
                }
                if(row != 0){
                    let bottomCell = this.cellMap[row - 1][col];
                    if(this.isStone(bottomCell)){
                        stoneList.push(bottomCell);
                    }
                }
                //处理stone
                for(let k = 0; k < stoneList.length; k++){
                    let stone:Stone = stoneList[k].getComponent(Stone);
                    let value = stone.value - 1;
                    if(value < Stone.BASE_ID){
                        stone.node.destroy();
                        this.cellMap[stone.row][stone.col] = 0;
                    }else{
                        stone.setStoneId(value);
                    }
                }

                for(let k = 0; k < effectColList.length; k++){
                    let exist = false;
                    for(let l = 0; l < colList.length; l++){
                        if(colList[l] == effectColList[k]){
                            exist = true;
                            break;
                        }
                    }
                    if(!exist){
                        colList.push(effectColList[k]);
                    }
                }
            }
        }

        let maxRow = -1; //消除后当前最大的行 用于决定是否生成stone
        for(let row = 0; row < this.rows; row++){
            let exist = false;
            for(let col = 0; col < this.cols; col++){
                let cell = this.cellMap[row][col];
                if(this.isStone(cell)){
                    exist = true;
                    break;
                }
            }
            if(exist && maxRow < row){
                maxRow = row;
            }
        }
        let bNeedCreateStone = false;
        if(maxRow <= 1){
            bNeedCreateStone = true;
        }
        // Util.showToast('maxRow = ' + maxRow);

        this.addEffectCols(colList);

        let time1 = this.dispelTime;
        let time2 = DiamondView.GRAVITY_TIME;
        let time3 = DiamondView.GENERATE_GRAVITY_TIME;

        let gravityCellCb = ()=>{
            this.gravityCell(colList,time2,flag);
        }

        let generateCellCb = ()=>{
            this.generateCell(colList,time3);
        };

        let afterGenerateCb = ()=>{
            this.dumpCellInfo();
            let resultMap = this.findAllDispel();
            if(resultMap.length == 0){
                this.isSwitching = false;
                this.resetEffectCols();
                if(bNeedCreateStone){
                    let createRowNum = 3 - maxRow;
                    //TODO 对cellMap以及所有的Diamond和Stone重新进行洗牌(row,col的重设)
                    //清除顶出去的
                    for(let row = this.rows - 1; row > this.rows - 1 - createRowNum; row--){
                        for(let col = 0; col < this.cols; col++){
                            let cell:cc.Node = this.cellMap[row][col];
                            this.cellMap[row][col] = 0;
                            if(this.isCellValid(cell)){
                                this.outsideCellList.push(cell);
                            }
                        }
                    }
                    //处理顶上来的
                    for(let row = this.rows - 1 - createRowNum; row >= 0; row--){
                        for(let col = 0; col < this.cols; col++){
                            this.cellMap[row + createRowNum][col] = this.cellMap[row][col];
                            let cell:cc.Node = this.cellMap[row][col];
                            if(this.isStone(cell)){
                                cell.getComponent(Stone).row = row + createRowNum;
                            }else if(this.isDiamond(cell)){
                                cell.getComponent(Diamond).row = row + createRowNum;
                            }
                        }
                    }
                    //新出来的土
                    for(let row = 0; row < createRowNum; row++){
                        for(let col = 0; col < this.cols; col++){
                            let stone:cc.Node = cc.instantiate(this.stonePrefab);
                            stone.parent = this.contentNode;
                            this.cellMap[row][col] = stone;
                            let nodePos = this.translateRowColToNodePos(row,col);
                            stone.position = cc.v2(nodePos.x,nodePos.y - 90 * createRowNum);
                            stone.getComponent(Stone).setStoneId(Stone.BASE_ID);
                            stone.getComponent(Stone).col = col;
                            stone.getComponent(Stone).row = row;
                        }
                    }
                    let moveOutside = cc.moveBy(0.5,cc.v2(0,90 * createRowNum));
                    this.contentNode.runAction(cc.sequence(moveOutside,cc.callFunc(()=>{
                        //contentNode复位刷新this.cellMap整体点位
                        this.clearOutsideCellList();
                        this.resetAllCellPos();
                        this.unlockTouch('afterGenerateCb');
                    })));
                }else{
                    this.unlockTouch('afterGenerateCb');
                }
            }else{
                let delay = cc.delayTime(0.1);
                let clearCb = ()=>{
                    this.clearCell(resultMap,"afterGenerateCb");
                }
                this.node.runAction(cc.sequence(
                    delay,
                    cc.callFunc(clearCb)
                ));
            }
        };

        let actionList = [
            cc.delayTime(time1),
            cc.callFunc(gravityCellCb),
            cc.delayTime(time2),
            cc.callFunc(generateCellCb),
            cc.delayTime(time3),
            cc.callFunc(afterGenerateCb)
        ];

        this.node.runAction(cc.sequence(actionList));
    }

    clearOutsideCellList(){
        for(let i = 0; i < this.outsideCellList.length; i++){
            this.outsideCellList[i].destroy();
        }
        this.outsideCellList = [];
    }

    resetAllCellPos(){
        this.contentNode.position = cc.v2(0,0);
        for(let row = 0; row < this.rows; row++){
            for(let col = 0; col < this.cols; col++){
                let cell: cc.Node = this.cellMap[row][col];
                if(this.isCellValid(cell)){
                    let nodePos = this.translateRowColToNodePos(row,col);
                    cell.position = nodePos;
                }
            }
        }
    }

    dumpCellInfo(){
        for(let row = this.rows - 1; row >= 0; row--){
            let str = '|';
            for(let col = 0; col < this.cols; col++){
                let cell = this.cellMap[row][col];
                if(this.isDiamond(cell)){
                    str += `${cell.getComponent(Diamond).value}`;
                }else if(this.isStone(cell)){
                    str += `${cell.getComponent(Stone).value}`;
                }else{
                    str += 0;
                }
                str += ',';
                if(col == this.cols - 1){
                    str += '|';
                }
            }
            console.log(str);
        }
    }

    
    gravityCell(colList,time,flag){
        console.log("gravityCell colList = " + JSON.stringify(colList));
        for(let i = 0; i < colList.length; i++){
            let col = colList[i];
            let cellList = [];
            for(let row = 0; row < this.rows; row++){
                let cell = this.cellMap[row][col];
                if(this.isCellValid(cell)){
                    cellList.push(cell);
                    this.cellMap[row][col] = 0;
                }
            }

            if(flag == "afterGenerateCb"){
                console.log("@@@col = " + col + " height = " + cellList.length);
            }

            for(let i = 0; i < cellList.length; i++){
                let row = i;
                // console.log("@@@gravity row = " + row + " col = " + col);
                let nodePos = this.translateRowColToNodePos(row,col);
                let moveTo = cc.moveTo(time,nodePos);
                cellList[i].runAction(moveTo);
                this.cellMap[row][col] = cellList[i];
                if(this.isDiamond(cellList[i])){
                    cellList[i].getComponent(Diamond).row = row;
                    cellList[i].getComponent(Diamond).col = col;
                }else{
                    cellList[i].getComponent(Stone).row = row;
                    cellList[i].getComponent(Stone).col = col;
                }
            }
        }
    }

    generateCell(colList,time){
        console.log("generateCell colList = " + JSON.stringify(colList));
        let offsetTopY = 300;
        for(let i = 0; i < colList.length; i++){
            let col = colList[i];
            let yList = [];
            for(let j = 0; j < this.rows; j++){
                if(!this.isCellValid(this.cellMap[j][col])){
                    yList.push(j);
                }
            }

            console.log("@@@generateCell yList = " + JSON.stringify(yList));

            for(let k = 0; k < yList.length; k++){
                let y = yList[k];
                let cell = this.createRandomDiamond();
                this.cellMap[y][col] = cell;
                let nodePos = this.translateRowColToNodePos(y,col);
                cell.getComponent(Diamond).row = y;
                cell.getComponent(Diamond).col = col;
                cell.position = cc.v2(nodePos.x,nodePos.y + offsetTopY);
                let targetPos = nodePos;
                let moveTo = cc.moveTo(time,targetPos);
                cell.runAction(moveTo);
            }
        }
    }

    mergeResultList(inList,outList){
        console.log('inList.length = ' + inList.length + ' outList.length = ' + outList.length);
        for(let i = 0; i < inList.length; i++){
            let exist = false;
            let inCell = inList[i];
            for(let j = 0; j < outList.length; j++){
                let outCell = outList[j];
                if(inCell.getComponent(Diamond).row == outCell.getComponent(Diamond).row && inCell.getComponent(Diamond).col == outCell.getComponent(Diamond).col){
                    exist = true;
                    break;
                }
            }

            if(!exist){
                outList.push(inCell);
            }
        }
    }

    findAllDispel(){
        let resultMap = [];
        let valueList = [1,2,3,4,5];
        for(let i = 0; i < valueList.length; i++){
            let value = valueList[i];
            let cellList = [];
            let resultList = [];
            for(let row = 0; row < this.rows; row++){
                for(let col = 0; col < this.cols; col++){
                    let cell = this.cellMap[row][col];
                    if(this.isDiamond(cell) && cell.getComponent(Diamond).value == value){
                        cellList.push(cell);
                    }
                }
            }

            for(let j = 0; j < cellList.length; j++){
                let cell = cellList[j];
                let diamond = cell.getComponent(Diamond);
                // console.log(`findDispel row = ${diamond.row} col = ${diamond.col} value =  ${diamond.value}`);
                let curResultList = this.findDispel(diamond.row,diamond.col);
                //这里有隐患 因为有可能value不一致 但是并未相连
                this.mergeResultList(curResultList,resultList);
            }

            for(let i = 0; i < resultList.length; i++){
                let diamond:Diamond = resultList[i].getComponent(Diamond);
                console.log('@@@ value = ' + diamond.value + ' row = ' + diamond.row + ' col = ' + diamond.col);
            }

            if(resultList.length > 0){
                resultMap.push(resultList);
            }
        }
        // console.log('resultMap = ' + JSON.stringify(resultMap));
        return resultMap;
    }

    findDispel(row,col){
        let list = this.findCenterDownDispel(row,col);
        if(list.length != 0){
            // console.log(`findCenterDownDispel`);
            return list;
        }
        list = this.findCenterLeftDispel(row,col);
        if(list.length != 0){
            // console.log(`findCenterLeftDispel`);
            return list;
        }
        list =this.findCenterRightDispel(row,col);
        if(list.length != 0){
            // console.log(`findCenterRightDispel`);
            return list;
        }
        list = this.findCenterUpDispel(row,col);
        if(list.length != 0){
            // console.log(`findCenterUpDispel`);
            return list;
        }
        list = this.findUpLeftDispel(row,col);
        if(list.length != 0){
            // console.log(`findUpLeftDispel`);
            return list;
        }
        list = this.findUpRightDispel(row,col);
        if(list.length != 0){
            // console.log(`findUpRightDispel`);
            return list;
        }
        list = this.findDownLeftDispel(row,col);
        if(list.length != 0){
            // console.log(`findDownLeftDispel`);
            return list;
        }
        list = this.findDownRightDispel(row,col);
        if(list.length != 0){
            // console.log(`findDownRightDispel`);
            return list;
        }
        list = this.findHorizonDispel(row,col);
        if(list.length != 0){
            // console.log(`findHorizonDispel`);
            return list;
        }
        list = this.findVerticalDispel(row,col);
        if(list.length != 0){
            // console.log(`findVerticalDispel`);
            return list;
        }
        return [];
    }

    //单纯的基于某个行列和方向来查找连续的元素
    search(row,col,dir){
        let cell = this.cellMap[row][col];
        let list = [];
        if(!this.isDiamond(cell)){
            return list;
        }

        let value = cell.getComponent(Diamond).value;
        if(dir == DiamondView.DIR.LEFT){
            for(let i = col - 1; i >= 0; i--){
                let currentCell = this.cellMap[row][i];
                if(this.isDiamond(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }else if(dir == DiamondView.DIR.RIGHT){
            for(let i = col + 1; i < this.cols; i++){
                let currentCell = this.cellMap[row][i];
                if(this.isDiamond(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }else if(dir == DiamondView.DIR.UP){
            for(let i = row + 1; i < this.rows; i++){
                let currentCell = this.cellMap[i][col];
                if(this.isDiamond(currentCell) && currentCell.getComponent(Diamond).value == value){
                    list.push(currentCell);
                }else{
                    break;
                }
            }
        }else if(dir == DiamondView.DIR.DOWN){
            for(let i = row - 1; i >= 0; i--){
                let currentCell = this.cellMap[i][col];
                if(this.isDiamond(currentCell) && currentCell.getComponent(Diamond).value == value){
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        list = list.concat(listLeft,listRight)

        if(list.length < DiamondView.DISPEL_NUM){
            // console.log(`findHorizonDispel list.length < DiamondView.DISPEL_NUM`);
            list = [];
        }
        return list;
    }

    // OOO
    findVerticalDispel(row,col){
        let cell = this.cellMap[row][col];
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        list = list.concat(listUp,listDown);
        if(list.length < DiamondView.DISPEL_NUM){
            // console.log(`findVerticalDispel list.length < DiamondView.DISPEL_NUM`);
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 2){
            // console.log(`findUpLeftDispel left return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 2){
            // console.log(`findUpLeftDispel up return`);
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 2){
            // console.log(`findUpRightDispel right return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 2){
            // console.log(`findUpRightDispel up return`);
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 2){
            // console.log(`findDownLeftDispel down return`);
            return [];
        }
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 2){
            // console.log(`findDownLeftDispel left return`);
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 2){
            // console.log(`findDownRightDispel down return`);
            return [];
        }
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 2){
            // console.log(`findDownRightDispel right return`);
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 1){
            // console.log(`findCenterUpDispel left return`);
            return [];
        }
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 1){
            // console.log(`findCenterUpDispel right return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 2){
            // console.log(`findCenterUpDispel up return`);
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
        if(!this.isDiamond(cell)){
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listLeft = this.search(row,col,DiamondView.DIR.LEFT);
        if(listLeft.length < 2){
            // console.log(`findCenterLeftDispel left return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 1){
            // console.log(`findCenterLeftDispel up return`);
            return [];
        }
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 1){
            // console.log(`findCenterLeftDispel down return`);
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
        if(!this.isDiamond(cell)){
            return [];
        }
        let list = [cell];
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 2){
            // console.log(`findCenterRightDispel right return`);
            return [];
        }
        let listUp = this.search(row,col,DiamondView.DIR.UP);
        if(listUp.length < 1){
            // console.log(`findCenterRightDispel up return`);
            return [];
        }
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 1){
            // console.log(`findCenterRightDispel down return`);
            return [];
        }
        return list.concat(listRight,listUp,listDown);
    }
}
export = DiamondView;
