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
import DiamondCountdown = require('./DiamondCountdown');
import EventConfig = require('../../common/src/EventConfig');
import InstrumentView = require('./InstrumentView');

interface Result{
    row?:number,
    col?:number,
    value?:number,
    type?:number,
    list?:cc.Node[],
}

@ccclass
@menu('diamond/DiamondView')
class DiamondView extends cc.Component {
    static DIR = {
        UP : 1,
        DOWN : 2,
        LEFT : 3,
        RIGHT : 4  
    };

    static DISPEL_TYPE = {
        CENTER_DOWN : 1,
        CENTER_LEFT : 2,
        CENTER_RIGHT: 3,
        CENTER_UP: 4,
        UP_LEFT: 5,
        UP_RIGHT: 6,
        DOWN_LEFT: 7,
        DOWN_RIGHT: 8,
        HORI: 9,
        VERT: 10
    }

    static COMPOSE_TYPE = {
        NONE : 0,
        BOMB : 1,
        CROSS : 2,
        CUBE : 3
    }

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

    @property(cc.Node)
    timeNode: cc.Node = null;

    @property(cc.Node)
    instrumentNode: cc.Node = null;

    @property({ type: cc.AudioClip })
    sounds: cc.AudioClip[] = [];

    @property(cc.Prefab)
    brokenStonePb: cc.Prefab = null;

    @property(cc.Prefab)
    brokenSoilPb: cc.Prefab = null;

    @property(cc.Node)
    waringNode: cc.Node = null;

    diamondNodePool: cc.Node[] = [];
    stoneNodePool: cc.Node[] = [];
    soilBrokenPool: cc.Node[] = [];
    stoneBrokenPool: cc.Node[] = [];
    cols: number = 8;
    rows: number = 8;
    currentMoveDir: number = null;
    cellMap: any = null;
    selectedCell: cc.Node = null;
    cellOriginPos: cc.Vec2 = new cc.Vec2();
    switchTime: number = 0.2;   //交换时长
    dispelTime: number = 0.2   //消除时长
    static GRAVITY_TIME:number = 0.1;
    static GENERATE_GRAVITY_TIME:number = 0.1;
    static LANDUP_TIME:number = 1.5;
    isSwitching: boolean = false;
    isDispel: boolean = false;

    switchStartDiamond: cc.Node = null;
    switchEndDiamond: cc.Node = null;
    effectColList: number[] = [];
    outsideCellList:cc.Node[] = [];

    singleClearMoveCellList: cc.Node[] = [];

    onLoad(){
        // Game.getInstance().diamo
        console.log('DiamondView onLoad');
        this.initDiamonds();
        this.initTime();
        this.updateAllStones();
        this.addEvent();
    }

    playWarning(){
        console.log('playWarning');
        this.waringNode.stopAllActions();
        this.waringNode.active = true;
        let opacity = 100;
        this.waringNode.opacity = opacity;
        let fadeTo = cc.fadeTo(0.7,0);
        let call = cc.callFunc(()=>{
            this.playWarningSound();
        });
        let fadeTo2 = cc.fadeTo(0.7,opacity);
        let seq = cc.sequence(call,fadeTo,fadeTo2);
        let rep = cc.repeatForever(seq)
        this.waringNode.runAction(rep);
    }

    stopWarning(){
        this.waringNode.stopAllActions();
        this.waringNode.active = false;
    }

    initTime(){
        this.timeNode.getComponent(DiamondCountdown).setSeconds(DiamondCountdown.defaultMaxSeconds);
    }

    getSoilBroken() : cc.Node{
        let soilBroken = this.soilBrokenPool.shift();
        if(soilBroken == null){
            soilBroken = cc.instantiate(this.brokenSoilPb);
            soilBroken.parent = this.contentNode;
        }
        soilBroken.active = true;
        soilBroken.getComponent(sp.Skeleton).setToSetupPose();
        soilBroken.getComponent(sp.Skeleton).setAnimation(0,'animation',false);
        soilBroken.getComponent(sp.Skeleton).timeScale = 1;
        soilBroken.getComponent(sp.Skeleton).setCompleteListener(()=>{
            soilBroken.active = false;
            this.soilBrokenPool.push(soilBroken);
        });
        return soilBroken;
    }

    getStoneBroken():cc.Node{
        let stoneBroken = this.stoneBrokenPool.shift();
        if(stoneBroken == null){
            stoneBroken = cc.instantiate(this.brokenStonePb);
            stoneBroken.parent = this.contentNode;
        }
        stoneBroken.active = true;
        stoneBroken.getComponent(sp.Skeleton).setToSetupPose();
        stoneBroken.getComponent(sp.Skeleton).setAnimation(0,'animation',false);
        stoneBroken.getComponent(sp.Skeleton).timeScale = 2;
        stoneBroken.getComponent(sp.Skeleton).setCompleteListener(()=>{
            stoneBroken.active = false;
            this.stoneBrokenPool.push(stoneBroken);
        });
        return stoneBroken;
    }

    createRandomDiamond():cc.Node{
       let randomId = Util.random(5);
       let diamond = this.getDiamond(randomId);
       diamond.parent = this.contentNode;
       diamond.getComponent(Diamond).setDiamondId(randomId);
       return diamond;
    }

    createDiamond(id:number){
        let diamond = cc.instantiate(this.diamondPrefab);
        diamond.parent = this.contentNode;
        diamond.getComponent(Diamond).setDiamondId(id);
        return diamond;
    }

    getDiamond(id:number){
        let diamondNode = this.diamondNodePool.shift();
        if(diamondNode == null){
            diamondNode = this.createDiamond(id);
        }
        diamondNode.getComponent(Diamond).setDiamondId(id);
        diamondNode.active = true;
        diamondNode.scale = 1;
        return diamondNode;
    }

    destroyDiamond(diamondNode:cc.Node){
        diamondNode.active = false;
        this.diamondNodePool.push(diamondNode);
    }

    createStone(id:number = Stone.BASE_ID){
        let stone = cc.instantiate(this.stonePrefab);
        stone.parent = this.contentNode;
        stone.getComponent(Stone).setStoneId(id);
        return stone;
    }

    getStone(id:number = Stone.BASE_ID){
        let stone = this.stoneNodePool.shift();
        if(stone == null){
            stone = this.createStone(id);
        }
        stone.getComponent(Stone).setStoneId(id);
        stone.active = true;
        return stone;
    }

    destroyStone(stoneNode:cc.Node){
        stoneNode.active = false;
        this.stoneNodePool.push(stoneNode);
        let broken = this.getSoilBroken();
        broken.parent = this.contentNode;
        broken.position = stoneNode.position;
        broken.zIndex = 1000;
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
                let diamond = this.getDiamond(map[i]);
                if(this.cellMap[row] == null){
                    this.cellMap[row] = [];
                }
                this.cellMap[row][col] = diamond;
                let nodePos = this.translateRowColToNodePos(row,col);
                diamond.position = nodePos;
                diamond.getComponent(Diamond).col = col;
                diamond.getComponent(Diamond).row = row;
            }else{
                let stone = this.getStone();
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

    updateAllStones(){
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
        this.node._touchListener.setSwallowTouches(false);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_TIMEOUT,()=>{
            this.gameOver();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_START_WARNING,()=>{
            this.playWarning();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_STOP_WARNING,()=>{
            this.stopWarning();
        },this);
        this.btnTime.on('click',()=>{
            // this.resetAllCellPos();
            // this.dumpCellInfo();
            // this.playWheelAction();
            // this.setInstrument(this.instrumentNode.getComponent(InstrumentView).value + 21);
            // this.playWarningSound();
            let now1 = Util.getPerformNow();
            this.exchangCheckArrFun();
            let now2 = Util.getPerformNow();
            console.log('need ' + (now2 - now1) + ' 毫秒');
        });
    }

    setInstrument(value:number){
        this.instrumentNode.getComponent(InstrumentView).setValue(value);
    }

    gameOver(){
        Util.showToast('game over');
        this.stopWarning();
        this.waringNode.active = true;
        this.waringNode.opacity = 100;
    }

    removeEvent(){
        Game.getInstance().gNode.targetOff(this);
    }

    onDestroy(){
        this.removeEvent();
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

        if(this.isDispel){
            console.log('isDispel = true so return');
            return;
        }
        this.currentMoveDir = null;
        let pos = event.getLocation();
        let cellPos = this.translateToCellPos(pos);
        if(!cellPos){
            console.log(`未选中`);
            return;
        }
        pos.x -= cc.winSize.width/2;
        pos.y -= cc.winSize.height/2;
        let row = cellPos.y;
        let col = cellPos.x;
        let cell = this.cellMap[row][col];
        if(!this.isDiamond(cell)){
            console.log(`选中的不是宝石`);
            return;
        }
        this.selectedCell = cell;
    }

    handleTouchMove(event:cc.Touch){
        if(this.isSwitching){
            console.log("handleTouchStart isSwitching = true return");
            return;
        }

        if(this.isDispel){
            console.log('isDispel = true so return');
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
    }

    reback(originCellRow,originCellCol,targetCellRow,targetCellCol){
        let startDiamond:cc.Node = this.cellMap[originCellRow][originCellCol];
        let endDiamond:cc.Node = this.cellMap[targetCellRow][targetCellCol];
        if(!this.isCellValid(startDiamond)){
            return;
        }

        if(!this.isCellValid(endDiamond)){
            return;
        }

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
        this.switchStartDiamond = null;
        this.switchEndDiamond = null;
        this.selectedCell = null;
    }

    switchCell(originCellRow,originCellCol,targetCellRow,targetCellCol){
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

        let ret1:Result = this.findDispel(startRow,startCol);
        if(ret1 != null){
            console.log(`list1.length = ${ret1.list.length}`);
            for(let i = 0; i < ret1.list.length; i++){
                let cell = ret1.list[i];
                let diamond:Diamond = cell.getComponent(Diamond);
                let row = diamond.row;
                let col = diamond.col;
                // this.cellMap[row][col] = 0;
            }
        }
        
        let ret2 = this.findDispel(endRow,endCol);
        if(ret2 != null){
            console.log(`list2.length = ${ret2.list.length}`);
            for(let i = 0; i < ret2.list.length; i++){
                let cell = ret2.list[i];
                let diamond:Diamond = cell.getComponent(Diamond);
                let row = diamond.row;
                let col = diamond.col;
                // this.cellMap[row][col] = 0;
            }
        }

        if(ret1 == null && ret2 == null){
            //如果两个都没得消 直接回退
            this.reback(startRow,startCol,endRow,endCol);
        }else{
            let resultMap:Result[] = [];
            if(ret1 != null){
                resultMap.push(ret1);
            }
            if(ret2 != null){
                resultMap.push(ret2);
            }
            this.isSwitching = false;
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

    playDiamondBrokenSound(){
        Util.playAudioEffect(this.sounds[0],false);
    }

    playStoneBrokenSound(){
        Util.playAudioEffect(this.sounds[1],false);
    }

    playCreateStoneSound(){
        Util.playAudioEffect(this.sounds[3],false);
    }

    playWarningSound(){
        Util.playAudioEffect(this.sounds[4],false);
    }

    clearCell(resultMap:Result[],flag){
        console.log("clearCell flag = " + flag);
        this.isDispel = true;
        //cols is effected
        let colList = [];
        let hasStoneBroken = false;
        console.log("resultMap.length = " + resultMap.length);
        this.singleClearMoveCellList = [];
        let hasCompose = false;
        for(let i = 0; i < resultMap.length; i++){
            let ret = resultMap[i];
            let composeType = this.calcComposeType(ret);
            for(let j = 0; j < ret.list.length; j++){
                let cell = ret.list[j];
                let diamond:Diamond = cell.getComponent(Diamond);
                let row = diamond.row;
                let col = diamond.col;
                if(composeType == DiamondView.COMPOSE_TYPE.NONE){
                    let scaleTo = cc.scaleTo(this.dispelTime,0).easing(cc.easeBackIn());
                    let cb = cc.callFunc(()=>{
                        this.destroyDiamond(diamond.node);
                    })
                    cell.runAction(cc.sequence(scaleTo,cb));
                    this.cellMap[row][col] = 0;
                }else{
                    //其他cell要朝row,col靠拢
                    if(row != ret.row || col != ret.col){
                        let nodePos = this.translateRowColToNodePos(ret.row,ret.col);
                        let moveTo = cc.moveTo(this.dispelTime,nodePos);
                        let cb = cc.callFunc(()=>{
                            this.destroyDiamond(diamond.node);
                        });
                        cell.runAction(cc.sequence(moveTo,cb));
                        this.cellMap[row][col] = 0;
                    }
                    hasCompose = true;
                }
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
                if(stoneList.length > 0){
                    hasStoneBroken = true;
                }
                //处理stone
                for(let k = 0; k < stoneList.length; k++){
                    let stone:Stone = stoneList[k].getComponent(Stone);
                    let value = stone.value - 1;
                    if(value < Stone.BASE_ID){
                        this.destroyStone(stone.node);
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

        this.playDiamondBrokenSound();
        if(hasStoneBroken){
            this.playStoneBrokenSound();
            this.updateAllStones();
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
        if(hasCompose){
            time1 += 0.2;
        }
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
            // let resultMap = this.findAllDispel();
            let resultMap = this.findTargetDispel(this.singleClearMoveCellList);
            if(resultMap.length == 0){
                this.selectedCell = null;
                this.resetEffectCols();
                if(bNeedCreateStone){
                    let createRowNum = 3 - maxRow;
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
                            let stone:cc.Node = this.getStone();
                            stone.parent = this.contentNode;
                            this.cellMap[row][col] = stone;
                            let nodePos = this.translateRowColToNodePos(row,col);
                            stone.position = cc.v2(nodePos.x,nodePos.y - 90 * createRowNum);
                            stone.getComponent(Stone).setStoneId(Stone.BASE_ID);
                            stone.getComponent(Stone).col = col;
                            stone.getComponent(Stone).row = row;
                        }
                    }
                    let moveOutside = cc.moveBy(DiamondView.LANDUP_TIME,cc.v2(0,90 * createRowNum));
                    this.playWheelAction();
                    this.timeNode.getComponent(DiamondCountdown).addSeconds(20,DiamondView.LANDUP_TIME);
                    this.contentNode.runAction(cc.sequence(moveOutside.easing(cc.easeQuinticActionOut()),cc.callFunc(()=>{
                        //contentNode复位刷新this.cellMap整体点位
                        this.clearOutsideCellList();
                        this.resetAllCellPos();
                        this.isDispel = false;
                    })));
                    this.playCreateStoneSound();
                    this.instrumentNode.getComponent(InstrumentView).addValue(10);
                    this.updateAllStones();
                }else{
                    this.isDispel = false;
                }
                let isEnd = this.checkIsEnd();
                if(isEnd){
                    Util.showToast('死局');
                }
            }else{
                let delay = cc.delayTime(0.05);
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
                    if(cellList[i].getComponent(Diamond).row != row){
                        //填充
                        this.singleClearMoveCellList.push(cellList[i]);
                    }
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
                this.singleClearMoveCellList.push(cell);
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

    //merge不应该是合并 而是优选
    mergeResultList(inRet:Result,outRet:Result):Result{
        // console.log('inList.length = ' + inList.length + ' outList.length = ' + outList.length);
        let ret;
        if(inRet.value != outRet.value){
            ret = outRet;
            return ret;
        }
        if(inRet.list.length >= outRet.list.length){
            ret = inRet;
        }else{
            ret = outRet;
        }
        return ret;
        // for(let i = 0; i < inRet.list.length; i++){
        //     let exist = false;
        //     let inCell = inRet.list[i];
        //     for(let j = 0; j < outRet.list.length; j++){
        //         let outCell = outRet.list[j];
        //         if(inCell.getComponent(Diamond).row == outCell.getComponent(Diamond).row && inCell.getComponent(Diamond).col == outCell.getComponent(Diamond).col){
        //             exist = true;
        //             break;
        //         }
        //     }
        //     if(!exist){
        //         outRet.list.push(inCell);
        //     }
        // }
    }

    //是否可合并结果 只要两个list存在row,col相差1即可
    canResultMerge(ret1:Result,ret2:Result):boolean{
        if(ret1.value != ret2.value){
            return false;
        }
        for(let i = 0; i < ret1.list.length; i++){
            let node1 = ret1.list[i];
            let diamond1 = node1.getComponent(Diamond);
            for(let j = 0; j < ret2.list.length; j++){
                let node2 = ret2.list[j];
                let diamond2 = node2.getComponent(Diamond);
                let diff = Math.abs(diamond1.row - diamond2.row) + Math.abs(diamond1.col - diamond2.col);
                if(diff <= 1){
                    return true;
                }
            }
        }
        return false;
    }

    findTargetDispel(cellList){
        let resultMap:Result[] = [];
        for(let i = 0; i < cellList.length; i++){
            let cell = cellList[i];
            let diamond = cell.getComponent(Diamond);
            let currentRet:Result = this.findDispel(diamond.row,diamond.col);
            if(currentRet != null){
                let canMerge = false;
                for(let k = 0; k < resultMap.length; k++){
                    let result = resultMap[k];
                    if(this.canResultMerge(currentRet,result)){
                        this.mergeResultList(currentRet,result);
                        canMerge = true;
                        break;
                    }
                }
                if(!canMerge){
                    resultMap.push(currentRet);
                }
            }
        }
        return resultMap;
    }

    findAllDispel(){
        let resultMap:Result[] = [];
        let valueList = [1,2,3,4,5];
        for(let i = 0; i < valueList.length; i++){
            let value = valueList[i];
            let cellList = [];
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
                let currentRet:Result = this.findDispel(diamond.row,diamond.col);
                if(currentRet != null){
                    let canMerge = false;
                    for(let k = 0; k < resultMap.length; k++){
                        let result = resultMap[k];
                        if(this.canResultMerge(currentRet,result)){
                            result = this.mergeResultList(currentRet,result);
                            canMerge = true;
                            break;
                        }
                    }
                    if(!canMerge){
                        resultMap.push(currentRet);
                    }
                }
            }
        }
        return resultMap;
    }

    // return null or {row:, col:, type:, list:[]}
    findDispel(row,col):Result{
        let ret:Result = {};
        ret.row = row;
        ret.col = col;
        ret.value = this.cellMap[row][col].getComponent(Diamond).value;
        ret.list = this.findCenterDownDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.CENTER_DOWN;
            return ret;
        }
        ret.list = this.findCenterLeftDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.CENTER_LEFT;
            return ret;
        }
        ret.list =this.findCenterRightDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.CENTER_RIGHT;
            return ret;
        }
        ret.list = this.findCenterUpDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.CENTER_UP;
            return ret;
        }
        ret.list = this.findUpLeftDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.UP_LEFT;
            return ret;
        }
        ret.list = this.findUpRightDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.UP_RIGHT;
            return ret;
        }
        ret.list = this.findDownLeftDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.DOWN_LEFT;
            return ret;
        }
        ret.list = this.findDownRightDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.DOWN_RIGHT;
            return ret;
        }
        ret.list = this.findHorizonDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.HORI;
            return ret;
        }
        ret.list = this.findVerticalDispel(row,col);
        if(ret.list.length != 0){
            ret.type = DiamondView.DISPEL_TYPE.VERT;
            return ret;
        }
        return null;
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

    calcComposeType(result:Result){
        let composeType = DiamondView.COMPOSE_TYPE.NONE;
        if(result.type == DiamondView.DISPEL_TYPE.HORI){
            if(result.list.length == 4){
                composeType = DiamondView.COMPOSE_TYPE.BOMB;
            }else if(result.list.length > 4){
                composeType = DiamondView.COMPOSE_TYPE.CUBE;
            }
        }else if(result.type == DiamondView.DISPEL_TYPE.VERT){
            if(result.list.length == 4){
                composeType = DiamondView.COMPOSE_TYPE.BOMB;
            }else if(result.list.length > 4){
                composeType = DiamondView.COMPOSE_TYPE.CUBE;
            }
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_DOWN){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_LEFT){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_RIGHT){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_UP){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.DOWN_LEFT){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.DOWN_RIGHT){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.UP_LEFT){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.UP_RIGHT){
            composeType = DiamondView.COMPOSE_TYPE.CROSS;
        }
        return composeType;
    }

    // OOO
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

    /**
     * O
     * O
     * O
     */
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

    playWheelAction(){
        console.log("playWheelAction");
        let a = 290;
        let dur = DiamondView.LANDUP_TIME;
        for(let i = 0; i < this.chilunList.length; i++){
            this.chilunList[i].stopAllActions();
            if(i % 2 == 0){
                this.chilunList[i].runAction(cc.rotateBy(dur,a).easing(cc.easeQuinticActionOut()))
            }else{
                this.chilunList[i].runAction(cc.rotateBy(dur,-a).easing(cc.easeQuinticActionOut()));
            }
        }
    }

    // check game end
    checkIsEnd(){
        return this.exchangCheckArrFun();
    }

    check3Same():boolean{
        for(var i = 0;i < this.cols;i++){
            for(var j = 0;j < this.rows;j++){
                if( i < this.cols - 2 &&
                    this.isDiamond(this.cellMap[j][i]) &&
                    this.isDiamond(this.cellMap[j][i+1]) &&
                    this.isDiamond(this.cellMap[j][i+2]) &&
                    this.cellMap[j][i].getComponent(Diamond).value == this.cellMap[j][i+1].getComponent(Diamond).value &&
                    this.cellMap[j][i+1].getComponent(Diamond).value == this.cellMap[j][i+2].getComponent(Diamond).value
                ){
                   return false
                }

                if( j < this.rows - 2 && 
                    this.isDiamond(this.cellMap[j][i]) &&
                    this.isDiamond(this.cellMap[j+1][i]) &&
                    this.isDiamond(this.cellMap[j+2][i]) &&
                    this.cellMap[j][i].getComponent(Diamond).value == this.cellMap[j+1][i].getComponent(Diamond).value &&
                    this.cellMap[j+1][i].getComponent(Diamond).value == this.cellMap[j+2][i].getComponent(Diamond).value ){
                        return false;
                }
            }
        }
        return true
    }

    exchangCheckArrFun() : boolean{
        for(var i = 0 ; i < this.cols ; i++) {
            for (var j = 0; j < this.rows-1; j++) {
                var temp = this.cellMap[j][i];
                this.cellMap[j][i] = this.cellMap[j+1][i];
                this.cellMap[j+1][i] = temp;

                var end  = this.check3Same();
                this.cellMap[j+1][i] = this.cellMap[j][i]
                this.cellMap[j][i] = temp
                cc.log(end)
                if(end == false){
                    cc.log("还存在三个相同的色块 游戏继续")
                    return false;
                }
                
            }
        }

        for(var k = 0 ; k < this.cols-1; k++) {
            for (var l = 0; l < this.rows; l++) {
                var temp1 = this.cellMap[l][k];
                this.cellMap[l][k] = this.cellMap[l][k+1];
                this.cellMap[l][k+1] = temp1;
                var end1  = this.check3Same();
                this.cellMap[l][k+1] = this.cellMap[l][k]
                this.cellMap[l][k] = temp1
                cc.log(end1)
                if(end1 ==false){
                    cc.log("还存在三个相同的色块 游戏继续")
                    return false;
                }
            }
        }
        cc.log("没有可以交换的块了 游戏结束")
        return true;
    }
}
export = DiamondView;
