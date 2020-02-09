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
import DiamondConfig = require('./DiamondConfig');
import StoneRate = require('./StoneRate');
import SingleDepthData = require('./SingleDepthData');
import GoldRate = require('./GoldRate');
import CrossAnim = require('./CrossAnim');
import ViewAction = require('../../common/src/ViewAction');
import GuideConfig = require('./guide/GuideConfig');
import Player = require('./Player');
import BalanceView = require('./BalanceView');

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

    static DISPEL_NUM = 3;
    @property(cc.Prefab)
    diamondPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    stonePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    bombPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    crossPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    goldLabelPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    revivePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    balancePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    turnplatePrefab: cc.Prefab = null;

    @property(cc.Node)
    contentNode: cc.Node = null;

    @property(cc.Node)
    chilunList: cc.Node[] = [];

    @property(cc.Node)
    btnTime: cc.Node = null;

    @property(cc.Node)
    btnDigger: cc.Node = null;

    @property(cc.Node)
    btnSearch: cc.Node = null;

    @property(cc.Node)
    btnBottom: cc.Node = null;

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

    @property(cc.Node)
    goldLabel: cc.Node = null;

    @property(cc.Node)
    helpList: cc.Node[] = [];

    @property(cc.Node)
    exceedNode: cc.Node = null;

    @property(cc.Node)
    collectNode: cc.Node = null;

    @property(cc.Node)
    targetCollectNode: cc.Node = null;

    @property(cc.SpriteFrame)
    goldCollectFrameList: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    otherCollectFrameList : cc.SpriteFrame[] = [];

    @property(cc.Node)
    gameOverNode: cc.Node = null;   // block the touchs

    @property(cc.Node)
    imgGameOver: cc.Node = null;

    @property(cc.Node)
    startNode: cc.Node = null;

    diamondNodePool: cc.Node[] = [];
    stoneNodePool: cc.Node[] = [];
    soilBrokenPool: cc.Node[] = [];
    stoneBrokenPool: cc.Node[] = [];
    bombPool: cc.Node[] = [];
    crossPool: cc.Node[] = [];
    goldLabelPool: cc.Node[] = [];
    cols: number = 8;
    rows: number = 8;
    currentMoveDir: number = null;
    cellMap: any = null;
    selectedCell: cc.Node = null;
    cellOriginPos: cc.Vec2 = new cc.Vec2();
    switchTime: number = 0.2;   //交换时长
    dispelTime: number = 0.2   //消除时长
    crossTime: number = 0.8;
    static GRAVITY_TIME:number = 0.1;
    static GENERATE_GRAVITY_TIME:number = 0.1;
    static LANDUP_TIME:number = 1.5;
    isSwitching: boolean = false;
    isDispel: boolean = false;

    switchStartDiamond: cc.Node = null;
    switchEndDiamond: cc.Node = null;
    effectColList: number[] = [];
    outsideCellList:cc.Node[] = [];
    depthLevel: number = 0;
    metrePerDepthLevel: number = 2;
    goldNum: number = 0;
    isGuide: boolean = false;
    isHelp: boolean = false;
    isDigger: boolean = false;

    timeToolLimit:number = 1;
    diggerToolLimit:number = 3;
    searchToolLimit:number = 3;

    timeToolUseNum: number = 0;
    diggerToolUseNum: number = 0;
    searchToolUseNum: number = 0;

    isTimeout: boolean = false;
    originContentY: number = 0;

    onLoad(){
        // Game.getInstance().diamo
        console.log('DiamondView onLoad');
        if(Game.getInstance().player.isFirstPlay){
            this.initGuideDiamonds();
        }else{
            this.initDiamonds();
        }
        // this.initGuideDiamonds();
        this.updateAllStones();
        this.updateUI();
        this.addEvent();
        this.playBGM();
        this.postExccedMessage();
        this.playStartAction();
        Game.getInstance().adManager.showBanner();
        this.originContentY = this.contentNode.y;
    }

    playStartAction(){
        this.gameOverNode.active = true;
        this.imgGameOver.active = false;
        this.startNode.active = true;
        this.startNode.scale = 0.5;
        this.startNode.opacity = 180;
        let scale1 = cc.scaleTo(0.2,1);
        let fade1 = cc.fadeTo(0.2,255);
        let spawn1 = cc.spawn(scale1,fade1);
        let cb = cc.callFunc(()=>{
            this.playStartSound();
        });
        let delay = cc.delayTime(0.8);
        let scale2 = cc.scaleTo(0.2,0);
        let fade2 = cc.fadeTo(0.2,0);
        let spawn2 = cc.spawn(scale2,fade2);
        let actionList = [spawn1,cb,delay,spawn2];
        actionList.push(cc.callFunc(()=>{
            this.gameOverNode.active = false
            this.startNode.active = false;
            this.initTime();
        }));
        this.startNode.runAction(cc.sequence(actionList));
    }

    playFailAction(cb?:Function){
        this.playGameOverSound();
        //将所有宝石垂直落下
        this.gameOverNode.active = true;
        this.imgGameOver.active = true;
        this.imgGameOver.scale = 0.5;
        this.imgGameOver.opacity = 180;
        let scale1 = cc.scaleTo(0.2,1);
        let fade1 = cc.fadeTo(0.2,255);
        let spawn1 = cc.spawn(scale1,fade1);
        let delay = cc.delayTime(0.8);
        let scale2 = cc.scaleTo(0.2,0);
        let fade2 = cc.fadeTo(0.2,0);
        let spawn2 = cc.spawn(scale2,fade2);
        let actionList = [spawn1,delay,spawn2];
        actionList.push(cc.callFunc(()=>{
            let diamondList = [];
            for(let row = 0; row < this.rows; row++){
                for(let col = 0; col < this.cols; col++){
                    if(this.isDiamond(this.cellMap[row][col])){
                        diamondList.push(this.cellMap[row][col]);
                    }
                }
            }
            let count = diamondList.length;
            let interval = 0.01;
            for(let i = 0; i < count; i++){
                let soundIndex = i;
                let index = Util.random(diamondList.length) - 1;
                let cell = diamondList[index];
                cell.zIndex = 1000;
                diamondList.splice(index,1);
                let delay = cc.delayTime(interval * i);
                let moveBy = cc.moveBy(0.2,cc.v2(0,-1000));
                let call = cc.callFunc(()=>{
                    if(soundIndex % 10 == 0){
                        this.playFalldownSound();
                    }
                });
                let actionList:any[] = [delay,moveBy,call];
                if(i == count - 1){
                    let call = cc.callFunc(()=>{
                        if(cb){
                            cb();
                        }
                    });
                    actionList.push(cc.delayTime(1));
                    actionList.push(call);
                }
                cell.runAction(cc.sequence(actionList));
            }
        }));
        this.imgGameOver.runAction(cc.sequence(actionList));
    }

    postExccedMessage(){
        if(Util.isWXPlatform()){
            let maxScore = Game.getInstance().player.maxScore;
            window['wx'].postMessage({
                message: 'Exceed',
                data : {
                    maxScore: maxScore
                }
            });
        }
    }

    test(){
        let map = [[1,1,2,1,1],[2,2,1,1]];
        for(let col = 0; col < map.length; col++){
            let rowInfo = map[col];
            let index = -1;
            for(let row = 8 - rowInfo.length; row < 8; row++){
                index++;
                console.log(`row[${row}] col[${col}] = ${rowInfo[index]}`);
                this.cellMap[row][col].getComponent(Diamond).setDiamondId(rowInfo[index]);
                if((row == 4 && col == 0) || (row == 5 && col == 1)){
                    this.cellMap[row][col].getComponent(Diamond).setComposeType(Diamond.COMPOSE_TYPE.BOMB);
                }
            }
        }
    }

    setIsDispel(isDispel:boolean){
        this.isDispel = isDispel;
        if(this.isDispel == false){
            Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_DISPEL_FINISHED);
        }
    }

    showReviveView(){
        let reviveView = cc.instantiate(this.revivePrefab);
        reviveView.parent = cc.Canvas.instance.node;
        reviveView.getComponent(ViewAction).open();
    }

    showBalanceView(currentScore:number,maxScore:number){
        let balanceView = cc.instantiate(this.balancePrefab);
        balanceView.parent = cc.Canvas.instance.node;
        balanceView.getComponent(ViewAction).open();
        balanceView.getComponent(BalanceView).init(currentScore,maxScore);
    }

    showTurnplateView(){
        let turnplateView = cc.instantiate(this.turnplatePrefab);
        turnplateView.parent = cc.Canvas.instance.node;
        turnplateView.getComponent(ViewAction).open();
    }

    addGold(num:number){
        this.goldNum += num;
        this.goldLabel.getComponent(cc.Label).string = `${this.goldNum}`;
    }

    createGoldIdListByDepth(depthId:number,num:number){
        let goldIdList = [];
        let depthData:SingleDepthData = DiamondConfig.stoneData[DiamondConfig.stoneData.length - 1];
        for(let i = 0; i < DiamondConfig.stoneData.length; i++){
            if(DiamondConfig.stoneData[i].depthId == depthId){
                depthData = DiamondConfig.stoneData[i];
                break;
            }
        }

        if(depthData == null){
            for(let i = 0; i < num; i++){
                goldIdList.push(0);
            }
            return goldIdList;
        }

        for(let i = 0; i < depthData.goldRateList.length; i++){
            let goldRate:GoldRate = depthData.goldRateList[i];
            let goldLevelId = goldRate.goldLevelId;
            let goldIdConfigList = DiamondConfig.goldLevelConfig[goldLevelId - 1];
            let goldNum = Math.floor(num * goldRate.rate);
            for(let j = 0; j < goldNum; j++){
                let randomIndex = Util.random(goldIdConfigList.length) - 1;
                let goldId = goldIdConfigList[randomIndex];
                goldIdList.push(goldId);
            }
        }

        for(let i = goldIdList.length; i <= num; i++){
            goldIdList.push(0);
        }
        console.log(`goldIdList = ${JSON.stringify(goldIdList)}`);
        return goldIdList;
    }

    setCell(row:number,col:number,cell:cc.Node|number){
        this.cellMap[row][col] = cell;
    }

    createStoneIdListByDepth(depthId:number,stoneNum:number){
        let stoneIdList = [];
        let depthData:SingleDepthData = DiamondConfig.stoneData[DiamondConfig.stoneData.length - 1];
        for(let i = 0; i < DiamondConfig.stoneData.length;i++){
            if(DiamondConfig.stoneData[i].depthId == depthId){
                depthData = DiamondConfig.stoneData[i];
                break;
            }
        }

        if(depthData == null){
            for(let i = 0; i < stoneNum; i++){
                stoneIdList.push(Stone.BASE_ID);
            }
            return stoneIdList;
        }

        for(let i = 0; i < depthData.stoneRateList.length; i++){
            let stoneRate:StoneRate = depthData.stoneRateList[i];
            let stoneId = stoneRate.stoneId;
            let num = Math.floor(stoneNum * stoneRate.rate);
            console.log('createStoneIdListByDepth stoneId = ' + stoneId + ' num = ' + num);
            for(let j = 0; j < num; j++){
                stoneIdList.push(stoneId);
            }
        }

        for(let i = stoneIdList.length; i <= stoneNum; i++){
            stoneIdList.push(Stone.BASE_ID);
        }
        return stoneIdList;
    }

    addDepthLevel(){
        this.depthLevel++;
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

    flyGoldLabel(row:number,col:number,goldNum:number){
        let goldLabel = this.goldLabelPool.shift();
        if(goldLabel == null){
            goldLabel = cc.instantiate(this.goldLabelPrefab);
            goldLabel.parent = this.collectNode;
            goldLabel.zIndex = 2000;
        }
        goldLabel.active = true;
        goldLabel.scale = 1.2;
        goldLabel.getComponent(cc.Label).string = `${goldNum}`;
        goldLabel.opacity = 255;
        goldLabel.position = cc.v2(-this.cols * Diamond.SIZE.width/2 + (col + 0.5) * Diamond.SIZE.width,-this.rows * Diamond.SIZE.height/2 + (row + 0.5) * Diamond.SIZE.height + 40);
        let moveBy = cc.moveBy(1,cc.v2(0,100));
        let fadeout = cc.fadeOut(1);
        let spawn = cc.spawn(moveBy,fadeout);
        let call = cc.callFunc(()=>{
            goldLabel.active = false;
            if(this.goldLabelPool.indexOf(goldLabel) == -1){
                this.goldLabelPool.push(goldLabel);
            }
        });
        goldLabel.runAction(cc.sequence(
            spawn,call
        ));
    }

    getCross(): cc.Node{
        let cross = this.crossPool.shift();
        if(cross == null){
            cross = cc.instantiate(this.crossPrefab);
            cross.parent = this.contentNode;
            cross.zIndex = 1000;
        }
        cross.active = true;
        return cross;
    }

    destroyCross(cross:cc.Node){
        cross.active = false;
        if(this.crossPool.indexOf(cross) == -1){
            this.crossPool.push(cross);
        }
    }

    getBomb() : cc.Node{
        let bomb = this.bombPool.shift();
        if(bomb == null){
            bomb = cc.instantiate(this.bombPrefab);
            bomb.parent = this.contentNode;
            bomb.zIndex = 1000;
        }
        bomb.active = true;
        bomb.getComponent(sp.Skeleton).setToSetupPose();
        bomb.getComponent(sp.Skeleton).setAnimation(0,'baoz',false);
        bomb.getComponent(sp.Skeleton).timeScale = 1;
        bomb.getComponent(sp.Skeleton).setCompleteListener(()=>{
            bomb.active = false;
            this.bombPool.push(bomb);
        });
        return bomb;
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
        diamondNode.getComponent(Diamond).setComposeType(Diamond.COMPOSE_TYPE.NONE);
        diamondNode.active = true;
        diamondNode.scale = 1;
        return diamondNode;
    }

    destroyDiamond(diamondNode:cc.Node){
        diamondNode.active = false;
        if(this.diamondNodePool.indexOf(diamondNode) == -1){
            this.diamondNodePool.push(diamondNode);
        }
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
        let goldId = stoneNode.getComponent(Stone).goldId;
        if(goldId != 0){
            let row = stoneNode.getComponent(Stone).row;
            let col = stoneNode.getComponent(Stone).col;
            let goldNum = DiamondConfig.scoreConfig[goldId - 1];
            this.flyGoldLabel(row,col,goldNum);
            this.addGold(goldNum);
            this.playGoldFlySound();
            this.playCollectAction(goldId,row,col);
        }
        stoneNode.getComponent(Stone).setStoneId(Stone.BASE_ID);
        stoneNode.getComponent(Stone).setGoldId(0);
        if(this.stoneNodePool.indexOf(stoneNode) == -1){
            this.stoneNodePool.push(stoneNode);
        }
    }

    playCollectAction(goldId,row,col){
        if(goldId <= Stone.GOLD_ID.GOLD_L){
            this.playCollectGoldAction(goldId,row,col);
        }else{
            this.playCollectOtherAction(goldId,row,col);
        }
    }

    playCollectGoldAction(goldId,row,col){
        let goldSpriteFrameList = [];
        if(goldId == Stone.GOLD_ID.GOLD_S){
            goldSpriteFrameList = [
                this.goldCollectFrameList[0],
                this.goldCollectFrameList[3],
                this.goldCollectFrameList[4]
            ];
        }else if(goldId == Stone.GOLD_ID.GOLD_M){
            goldSpriteFrameList = [
                this.goldCollectFrameList[0],
                this.goldCollectFrameList[1],
                this.goldCollectFrameList[4]
            ];
        }else if(goldId == Stone.GOLD_ID.GOLD_L){
            goldSpriteFrameList = [
                this.goldCollectFrameList[0],
                this.goldCollectFrameList[1],
                this.goldCollectFrameList[2]
            ];
        }

        let nodePos = this.translateRowColToNodePos(row,col);
        let widthRange = 40;
        let heightRange = 40;
        let targetPos = this.targetCollectNode.position;
        let interval = 0.1;
        for(let i = 0; i < goldSpriteFrameList.length; i++){
            let index = i;
            let node = new cc.Node();
            node.parent = this.collectNode;
            node.scale = 1.5;
            node.addComponent(cc.Sprite).spriteFrame = goldSpriteFrameList[i];
            let x = nodePos.x + Util.random(widthRange * 2) - widthRange;
            let y = nodePos.y + Util.random(heightRange * 2) - heightRange;
            node.position = cc.v2(x,y);
            node.runAction(cc.sequence(
                cc.delayTime(interval * index),
                cc.moveTo(1.3,targetPos).easing(cc.easeQuinticActionOut()),
                cc.callFunc(()=>{
                    node.destroy();
                })
            ));
        }
    }

    playCollectOtherAction(goldId,row,col){
        let nodePos = this.translateRowColToNodePos(row,col);
        let node = new cc.Node();
        let targetPos = this.targetCollectNode.position;
        node.parent = this.collectNode;
        node.position = nodePos;
        node.addComponent(cc.Sprite).spriteFrame = this.otherCollectFrameList[goldId - 4];
        node.runAction(cc.sequence(
            cc.moveTo(1.3,targetPos).easing(cc.easeQuinticActionOut()),
            cc.callFunc(()=>{
                node.destroy();
            })
        ));
    }

    initGuideDiamonds(){
        let contentSize = this.contentNode.getContentSize();
        let originPos = cc.v2(-contentSize.width/2,-contentSize.height/2);
        this.cellOriginPos = originPos;

        let stoneIdList:number[] = this.createStoneIdListByDepth(this.depthLevel,30);
        let normalStoneNum = 0;
        for(let i = 0; i < stoneIdList.length; i++){
            if(stoneIdList[i] == Stone.BASE_ID){
                normalStoneNum++;
            }
        }
        let goldIdList:number[] = this.createGoldIdListByDepth(this.depthLevel,normalStoneNum);

        let guideMissionData = GuideConfig.guideMissionData;
        this.cellMap = new Array<Array<any>>();
        for(let i = 0; i < guideMissionData.length; i++){
            for(let col = 0; col < this.cols; col++){
                let row = this.rows - 1 - i;
                // let row = i;
                if(this.cellMap[row] == null){
                    this.cellMap[row] = [];
                }
                let value = guideMissionData[i][col];
                console.log(`row = ${row} col = ${col} value = ${value}`);
                let cell;
                if(value >= 1 && value <= 5){
                    cell = this.getDiamond(value);
                    cell.getComponent(Diamond).row = row;
                    cell.getComponent(Diamond).col = col;
                }else if(value >= Stone.BASE_ID){
                    cell = this.getStone(value);
                    let randomIndex = Util.random(stoneIdList.length) - 1;
                    let stoneId = stoneIdList[randomIndex];
                    cell.getComponent(Stone).setStoneId(stoneId);
                    stoneIdList.splice(randomIndex,1)
                    if(stoneId == Stone.BASE_ID){
                        randomIndex = Util.random(goldIdList.length) - 1;
                        let goldId = goldIdList[randomIndex];
                        cell.getComponent(Stone).setGoldId(goldId);
                        goldIdList.splice(randomIndex,1);
                    }
                    cell.getComponent(Stone).setRowCol(row,col);
                }
                cell.parent = this.contentNode;
                cell.position = this.translateRowColToNodePos(row,col);
                this.cellMap[row][col] = cell;
            }
        }
    }

    initDiamonds(){
        let cellList = [1,2,3,4,5];
        let map = MapCreator.createMap(8,8,cellList);
        // console.log(JSON.stringify(map));
        let contentSize = this.contentNode.getContentSize();
        let originPos = cc.v2(-contentSize.width/2,-contentSize.height/2);
        this.cellOriginPos = originPos;
        this.cellMap = new Array<Array<any>>();
        let stoneIdList:number[] = this.createStoneIdListByDepth(this.depthLevel,30);
        let normalStoneNum = 0;
        for(let i = 0; i < stoneIdList.length; i++){
            if(stoneIdList[i] == Stone.BASE_ID){
                normalStoneNum++;
            }
        }
        let goldIdList:number[] = this.createGoldIdListByDepth(this.depthLevel,normalStoneNum);
        console.log('stoneIdList = ' + JSON.stringify(stoneIdList));
        for(let i = 0; i < map.length; i++){
            let pos = MapCreator.get_row_and_col_by_index(i);
            let row = pos.x;
            let col = pos.y;
            if(map[i] < Stone.BASE_ID){
                let diamond = this.getDiamond(map[i]);
                if(this.cellMap[row] == null){
                    this.cellMap[row] = [];
                }
                this.setCell(row,col,diamond);
                let nodePos = this.translateRowColToNodePos(row,col);
                diamond.position = nodePos;
                diamond.getComponent(Diamond).col = col;
                diamond.getComponent(Diamond).row = row;
            }else{
                let stone = this.getStone();
                if(this.cellMap[row] == null){
                    this.cellMap[row] = [];
                }
                this.setCell(row,col,stone);
                let nodePos = this.translateRowColToNodePos(row,col);
                stone.position = nodePos;
                let randomIndex = Util.random(stoneIdList.length) - 1;
                let stoneId = stoneIdList[randomIndex];
                stone.getComponent(Stone).setStoneId(stoneId);
                stoneIdList.splice(randomIndex,1)
                if(stoneId == Stone.BASE_ID){
                    randomIndex = Util.random(goldIdList.length) - 1;
                    let goldId = goldIdList[randomIndex];
                    if(goldId == null){
                        console.log('goldId = ');
                    }
                    stone.getComponent(Stone).setGoldId(goldId);
                    goldIdList.splice(randomIndex,1);
                }
                stone.getComponent(Stone).setRowCol(row,col);
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

    updateUI(){
        let timeCount = Game.getInstance().player.getAttr(Player.ATTR.TIME_TOOL);
        let diggerCount = Game.getInstance().player.getAttr(Player.ATTR.DIGGER_TOOL);
        let searchCount = Game.getInstance().player.getAttr(Player.ATTR.SEARCH_TOOL);
        this.btnTime.getChildByName('count').getComponent(cc.Label).string = `${timeCount}`;
        this.btnDigger.getChildByName('count').getComponent(cc.Label).string = `${diggerCount}`;
        this.btnSearch.getChildByName('count').getComponent(cc.Label).string = `${searchCount}`;
        this.btnTime.getComponent(cc.Button).interactable = (timeCount > 0 && this.timeToolUseNum < this.timeToolLimit);
        this.btnDigger.getComponent(cc.Button).interactable = (diggerCount > 0 && this.diggerToolUseNum < this.diggerToolLimit && !this.isDigger);
        this.btnSearch.getComponent(cc.Button).interactable = (searchCount > 0 && !this.isHelp && this.searchToolUseNum < this.searchToolLimit);
    }

    //为了加强视频的点击率 会在timeout的情况强行提示玩家用时间道具
    addEvent(){
        this.node.on(cc.Node.EventType.TOUCH_START,this.handleTouchStart,this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE,this.handleTouchMove,this);
        this.node.on(cc.Node.EventType.TOUCH_END,this.handleTouchEnd,this);
        this.node._touchListener.setSwallowTouches(false);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_TIMEOUT,()=>{
            if(!this.isDispel){
                this.timeout();
            }
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_START_WARNING,()=>{
            this.playWarning();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_STOP_WARNING,()=>{
            this.stopWarning();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_ATTR_CHANGE,()=>{
            this.updateUI();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_DISPEL_FINISHED,()=>{
            if(this.timeNode.getComponent(DiamondCountdown).seconds == 0){
                this.timeout();
            }
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_REVIVE_GIVEUP,()=>{
            this.gameOver();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_USE_TIME,()=>{
            Util.showToast(`+30秒`);
            this.timeToolUseNum++;
            this.timeNode.getComponent(DiamondCountdown).addSeconds(DiamondCountdown.TOOL_SECONDS_ADD);
            this.isTimeout = false;
            this.updateUI();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_SHOW_TURNPLATE,()=>{
            this.showTurnplateView();
        },this);
        this.btnTime.on('click',()=>{
            this.handleUseTime();
            Util.playClickSound();
        });

        this.btnSearch.on('click',()=>{
            if(this.isSwitching || this.isDispel){
                return;
            }
            this.handleUseSearch();
            Util.playClickSound();
        },this);

        this.btnDigger.on('click',()=>{
            Util.playClickSound();
            if(this.isDispel || this.isSwitching){
                return;
            }
            this.handleUseDigger();
        },this);

        this.btnBottom.on('click',()=>{
            // Util.playClickSound();
            // this.showBalanceView(this.goldNum,Game.getInstance().player.maxScore);
            // this.showTurnplateView();
            this.testClear();
        },this);
    }

    handleUseTime(){
        Util.showToast(`+30秒`);
        this.timeToolUseNum++;
        Game.getInstance().player.addAttr(Player.ATTR.TIME_TOOL,-1);
        this.isTimeout = false;
        this.timeNode.getComponent(DiamondCountdown).addSeconds(DiamondCountdown.TOOL_SECONDS_ADD);
    }

    handleUseDigger(){
        let stoneList = [];
        let row = 0;
        for(let col = 0; col < this.cols; col++){
            if(this.isStone(this.cellMap[row][col])){
                stoneList.push(this.cellMap[row][col]);
            }
        }
        this.isDigger = true;
        this.diggerToolUseNum++;
        this.clearStones(stoneList);
        Game.getInstance().player.addAttr(Player.ATTR.DIGGER_TOOL,-1);
    }

    cancelDigger(){
        this.isDigger = false;
    }

    handleUseSearch(){
        let posList = [];
        this.isHelp = true;
        this.searchToolUseNum++;
        Game.getInstance().player.addAttr(Player.ATTR.SEARCH_TOOL,-1);
        let isEnd = this.checkIsEnd(posList);
        this.helpList[0].active = false;
        this.helpList[1].active = false;
        for(let i = 0; i < posList.length; i++){
            let row = posList[i].row;
            let col = posList[i].col;
            let nodePos = this.translateRowColToNodePos(row,col);
            this.helpList[i].active = true;
            this.helpList[i].position = nodePos;
            this.helpList[i].zIndex = 1000;
        }
    }

    cancelSearch(){
        this.helpList[0].active = false;
        this.helpList[1].active = false;
        this.isHelp = false;
        this.updateUI();
    }

    setInstrument(value:number){
        this.instrumentNode.getComponent(InstrumentView).setValue(value);
    }

    timeout(){
        if(this.isTimeout){
            return;
        }
        let timeToolCount = Game.getInstance().player.getAttr(Player.ATTR.TIME_TOOL);
        this.isTimeout = true;
        if(this.timeToolUseNum == 0){
            //没用过time
            this.revive();
        }else{
            this.gameOver();
        }
    }

    revive(){
        this.showReviveView();
    }

    gameOver(){
        Game.getInstance().player.setFirstPlay(false);
        this.gameOverNode.active = true;
        // Util.showToast('game over');
        this.stopWarning();
        this.stopBGM();
        this.waringNode.active = false;
        this.waringNode.opacity = 100;
        // for really gameover
        let oldMaxScore = Game.getInstance().player.maxScore;
        Game.getInstance().player.setMaxScore(this.goldNum);
        
        if(Util.isWXPlatform()){
            if(this.goldNum > oldMaxScore){
                window['wx'].postMessage({
                    message:'uploadGameData',
                    data:{
                        score: this.goldNum
                    }
                });
            }
        }

        this.playFailAction(()=>{
            this.showBalanceView(this.goldNum,Game.getInstance().player.maxScore);
        });
    }

    removeEvent(){
        Game.getInstance().gNode.targetOff(this);
    }

    onDestroy(){
        this.removeEvent();
        this.stopBGM();
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
            console.log('isDispel == true so return');
            return;
        }

        this.currentMoveDir = null;
        let pos = event.getLocation();
        pos.y -= this.contentNode.y;
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
            // console.log("handleTouchStart isSwitching = true return");
            return;
        }

        if(this.isDispel){
            // console.log('isDispel == true so return');
            return;
        }
        if(!this.isCellValid(this.selectedCell)){
            return;
        }
        // console.log("handleTouchMove");
        let pos1 = event.getStartLocation();
        pos1.y -= this.contentNode.y;
        let pos2 = event.getLocation();
        pos2.y -= this.contentNode.y;
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

        this.setCell(startRow,startCol,this.switchEndDiamond);
        this.switchEndDiamond.getComponent(Diamond).row = startRow;
        this.switchEndDiamond.getComponent(Diamond).col = startCol;

        this.setCell(endRow,endCol,this.switchStartDiamond);
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

        this.setCell(startRow,startCol,this.switchEndDiamond);
        this.switchEndDiamond.getComponent(Diamond).row = startRow;
        this.switchEndDiamond.getComponent(Diamond).col = startCol;

        this.setCell(endRow,endCol,this.switchStartDiamond);
        this.switchStartDiamond.getComponent(Diamond).row = endRow;
        this.switchStartDiamond.getComponent(Diamond).col = endCol;

        let ret1:Result = this.findDispel(startRow,startCol);
        let ret2 = this.findDispel(endRow,endCol);
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
        // Util.playAudioEffect(this.sounds[4],false);
    }

    playBombSound(){
        Util.playAudioEffect(this.sounds[5],false);
    }

    playCrossSound(){
        Util.playAudioEffect(this.sounds[6],false);
    }

    playGoldFlySound(){
        Util.playAudioEffect(this.sounds[7],false);
    }

    playBGM(){
        Util.playAudioMusic(this.sounds[8],true);
    }

    playStartSound(){
        Util.playAudioEffect(this.sounds[9],false);
    }

    playFalldownSound(){
        Util.playAudioEffect(this.sounds[10],false);
    }

    playGameOverSound(){
        Util.playAudioEffect(this.sounds[11],false);
    }

    stopBGM(){
        cc.audioEngine.stopMusic();
    }

    getBoomEffectCellList(diamond:Diamond,outCellList:cc.Node[]){
        if(diamond.composeType == Diamond.COMPOSE_TYPE.NONE){
            return;
        }

        let row = diamond.row;
        let col = diamond.col;
        if(diamond.composeType == Diamond.COMPOSE_TYPE.BOMB){
            let topRow = row + 1;
            let downRow = row - 1;
            let leftCol = col - 1;
            let rightCol = col + 1;
            let minCol,maxCol,minRow,maxRow;
            if(downRow < 0){
                minRow = row;
            }else{
                minRow = downRow;
            }

            if(topRow >= this.rows){
                maxRow = row;
            }else{
                maxRow = topRow;
            }

            if(leftCol < 0){
                minCol = col;
            }else{
                minCol = leftCol;
            }

            if(rightCol >= this.cols){
                maxCol = col;
            }else{
                maxCol = rightCol;
            }

            for(let i = minRow; i <= maxRow; i++){
                for(let j = minCol; j <= maxCol; j++){
                    let cell:cc.Node = this.cellMap[i][j];
                    if(this.isDiamond(cell) && diamond.node != cell && cell.getComponent(Diamond).composeType > Diamond.COMPOSE_TYPE.NONE && outCellList.indexOf(cell) == -1){
                        outCellList.push(cell);
                        this.getBoomEffectCellList(cell.getComponent(Diamond),outCellList);
                    }else if(this.isCellValid(cell) && outCellList.indexOf(cell) == -1){
                        outCellList.push(cell);
                    }
                }
            }
        }else if(diamond.composeType == Diamond.COMPOSE_TYPE.CROSS){
            for(let i = 0; i < this.rows; i++){
                let cell:cc.Node = this.cellMap[i][col];
                if(this.isDiamond(cell) && diamond.node != cell && cell.getComponent(Diamond).composeType > Diamond.COMPOSE_TYPE.NONE && outCellList.indexOf(cell) == -1){
                    outCellList.push(cell);
                    this.getBoomEffectCellList(cell.getComponent(Diamond),outCellList);
                }else if(this.isCellValid(cell) && outCellList.indexOf(cell) == -1){
                    outCellList.push(cell);
                }
            }

            for(let i = 0; i < this.cols; i++){
                let cell:cc.Node = this.cellMap[row][i];
                if(this.isDiamond(cell) && diamond.node != cell && cell.getComponent(Diamond).composeType > Diamond.COMPOSE_TYPE.NONE && outCellList.indexOf(cell) == -1){
                    outCellList.push(cell);
                    this.getBoomEffectCellList(cell.getComponent(Diamond),outCellList);
                }else if(this.isCellValid(cell) && outCellList.indexOf(cell) == -1){
                    outCellList.push(cell);
                }
            }
        }
    }

    clearStones(stoneList:cc.Node[]){
        this.setIsDispel(true);
        let time1 = this.dispelTime;
        let time2 = DiamondView.GRAVITY_TIME;
        let time3 = DiamondView.GENERATE_GRAVITY_TIME;
        let colList = [];
        for(let i = 0; i < stoneList.length; i++){
            let stoneNode = stoneList[i];
            let row = stoneNode.getComponent(Stone).row;
            let col = stoneNode.getComponent(Stone).col;
            colList.push(col);
            if(stoneNode.getComponent(Stone).value == Stone.BASE_ID){
                let broken = this.getSoilBroken();
                broken.position = this.translateRowColToNodePos(row,col);
            }else if(stoneNode.getComponent(Stone).value > Stone.BASE_ID){
                let broken = this.getStoneBroken();
                broken.position = this.translateRowColToNodePos(row,col);
            }
            this.setCell(row,col,0);
            this.playStoneBrokenSound();
            this.destroyStone(stoneNode);
        }

        let gravityCellCb = ()=>{
            this.gravityCell(colList,time2,'clearStones');
        }

        let generateCellCb = ()=>{
            this.generateCell(colList,time3);
        };

        let afterGenerateCb = ()=>{
            this.dumpCellInfo();
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
            let resultMap = this.findAllDispel([]);
            if(resultMap.length == 0){
                this.selectedCell = null;
                this.resetEffectCols();
                if(bNeedCreateStone){
                    this.addDepthLevel();
                    let createRowNum = 3 - maxRow;
                    //清除顶出去的
                    for(let row = this.rows - 1; row > this.rows - 1 - createRowNum; row--){
                        for(let col = 0; col < this.cols; col++){
                            let cell:cc.Node = this.cellMap[row][col];
                            this.setCell(row,col,0);
                            if(this.isCellValid(cell)){
                                this.outsideCellList.push(cell);
                            }
                        }
                    }
                    //处理顶上来的
                    for(let row = this.rows - 1 - createRowNum; row >= 0; row--){
                        for(let col = 0; col < this.cols; col++){
                            this.setCell(row + createRowNum,col,this.cellMap[row][col]);
                            let cell:cc.Node = this.cellMap[row][col];
                            if(this.isStone(cell)){
                                cell.getComponent(Stone).row = row + createRowNum;
                            }else if(this.isDiamond(cell)){
                                cell.getComponent(Diamond).row = row + createRowNum;
                            }
                        }
                    }
                    let stoneIdList = this.createStoneIdListByDepth(this.depthLevel,createRowNum * this.cols);
                    let normalStoneNum = 0;
                    for(let i = 0; i < stoneIdList.length; i++){
                        if(stoneIdList[i] == Stone.BASE_ID){
                            normalStoneNum++;
                        }
                    }
                    let goldIdList:number[] = this.createGoldIdListByDepth(this.depthLevel,normalStoneNum);
                    //新出来的土
                    for(let row = 0; row < createRowNum; row++){
                        for(let col = 0; col < this.cols; col++){
                            let stone:cc.Node = this.getStone();
                            stone.getComponent(Stone).setRowCol(row,col);
                            stone.parent = this.contentNode;
                            this.setCell(row,col,stone);
                            let nodePos = this.translateRowColToNodePos(row,col);
                            stone.position = cc.v2(nodePos.x,nodePos.y - 90 * createRowNum);
                            let randomIndex = Util.random(stoneIdList.length) - 1;
                            let stoneId = stoneIdList[randomIndex];
                            stone.getComponent(Stone).setStoneId(stoneId);
                            stoneIdList.splice(randomIndex,1);
                            if(stoneId == Stone.BASE_ID){
                                randomIndex = Util.random(goldIdList.length) - 1;
                                let goldId = goldIdList[randomIndex];
                                stone.getComponent(Stone).setGoldId(goldId);
                                goldIdList.splice(randomIndex,1);
                                // console.log(`新出土111 row = ${row} col = ${col} goldId = ${goldId} stoneId = ${stoneId}`);
                            }else{
                                stone.getComponent(Stone).setGoldId(0);
                                // console.log(`新出土222 row = ${row} col = ${col} goldId = ${0} stoneId = ${stoneIdList[randomIndex]}`);
                            }
                        }
                    }
                    let moveOutside = cc.moveBy(DiamondView.LANDUP_TIME,cc.v2(0,90 * createRowNum));
                    this.playWheelAction();
                    let addSeconds = DiamondCountdown.NORMAL_SECONDS_ADD;
                    if(createRowNum == 4){
                        addSeconds = DiamondCountdown.CLEAR_SECONDS_ADD;
                        //todo 这里要提示全部消除
                        Util.showToast(`完全消除 +${addSeconds}s`);
                    }
                    this.timeNode.getComponent(DiamondCountdown).addSeconds(addSeconds,DiamondView.LANDUP_TIME);
                    this.contentNode.runAction(cc.sequence(moveOutside.easing(cc.easeQuinticActionOut()),cc.callFunc(()=>{
                        //contentNode复位刷新this.cellMap整体点位
                        this.clearOutsideCellList();
                        this.resetAllCellPos();
                        this.setIsDispel(false);
                        this.dumpCellInfo();
                    })));
                    this.playCreateStoneSound();
                    this.instrumentNode.getComponent(InstrumentView).setValue(this.depthLevel * this.metrePerDepthLevel);
                    this.updateAllStones();
                }else{
                    this.setIsDispel(false);
                    this.updateUI();
                }
                let isEnd = this.checkIsEnd();
                if(isEnd){
                    Util.showToast('没有可以消除的宝石');
                    this.node.runAction(cc.sequence(
                        cc.delayTime(1),
                        cc.callFunc(()=>{
                            this.shuffle();
                        })
                    ));
                    this.setIsDispel(true);
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
            cc.delayTime(time1 + 0.01),
            cc.callFunc(gravityCellCb),
            cc.delayTime(time2 + 0.01),
            cc.callFunc(generateCellCb),
            cc.delayTime(time3 + 0.01),
            cc.callFunc(afterGenerateCb)
        ];

        this.node.runAction(cc.sequence(actionList));
    }

    clearCell(resultMap:Result[],flag){
        // console.log("clearCell flag = " + flag);
        this.setIsDispel(true);
        this.cancelSearch();
        //cols is effected
        let colList = [];
        let hasStoneBroken = false;
        // console.log("resultMap.length = " + resultMap.length);
        //找出resultMap中受爆炸影响的Cell(包括宝石和土)
        let effectBoomCellList = [];
        let composeDiamondList = [];    //特殊宝石 含爆炸属性
        for(let i = 0; i < resultMap.length; i++){
            let ret:Result = resultMap[i];
            for(let j = 0; j < ret.list.length; j++){
                let cell = ret.list[j];
                let diamond:Diamond = cell.getComponent(Diamond);
                if(diamond.composeType > Diamond.COMPOSE_TYPE.NONE){
                    composeDiamondList.push(cell);
                }
            }
        }

        for(let i = 0; i < composeDiamondList.length; i++){
            let diamond = composeDiamondList[i].getComponent(Diamond);
            let cellList = [];
            this.getBoomEffectCellList(diamond,cellList);
            for(let j = 0; j < cellList.length; j++){
                let exist = false;
                let cell = cellList[j];
                let row,col;
                if(this.isStone(cell)){
                    row = cell.getComponent(Stone).row;
                    col = cell.getComponent(Stone).col;
                }else if(this.isDiamond(cell)){
                    row = cell.getComponent(Diamond).row;
                    col = cell.getComponent(Diamond).col;
                }
                //保证在effectBoomCellList中不重复
                if(effectBoomCellList.indexOf(cell) != -1){
                    exist = true;
                    // console.log(`effectBoomCellList重复 row = [${row}] col = [${col}]`);
                    break;
                }
                if(exist){
                    continue;
                }
                for(let k = 0; k < resultMap.length; k++){
                    let ret:Result = resultMap[k];
                    if(ret.list.indexOf(cell) != -1){
                        // console.log(`resultMap重复 row = [${row}] col = [${col}]`);
                        exist = true;
                        break;
                    }
                }
                if(exist){
                    continue;
                }
                effectBoomCellList.push(cell);
            }
        }

        let hasCross = false;

        for(let i = 0; i < resultMap.length; i++){
            let ret = resultMap[i];
            let composeType = this.calcComposeType(ret);
            for(let j = 0; j < ret.list.length; j++){
                let cell = ret.list[j];
                let diamond:Diamond = cell.getComponent(Diamond);
                let row = diamond.row;
                let col = diamond.col;
                if(diamond.composeType == Diamond.COMPOSE_TYPE.BOMB){
                    let bomb = this.getBomb();
                    this.playBombSound();
                    let nodePos = this.translateRowColToNodePos(row,col);
                    bomb.position = nodePos;
                }else if(diamond.composeType == Diamond.COMPOSE_TYPE.CROSS){
                    let cross = this.getCross();
                    this.playCrossSound();
                    cross.getComponent(CrossAnim).setPos(row,col);
                    cross.getComponent(CrossAnim).play(this.crossTime,()=>{
                        // this.destroyCross(cross);
                        cross.destroy();
                    });
                    hasCross = true;
                }
                this.dumpResult(ret);
                if(composeType == Diamond.COMPOSE_TYPE.NONE){
                    let scaleTo = cc.scaleTo(this.dispelTime,0).easing(cc.easeBackIn());
                    let cb = cc.callFunc(()=>{
                        this.destroyDiamond(diamond.node);
                    })
                    cell.runAction(cc.sequence(scaleTo,cb));
                    this.setCell(row,col,0);
                }else{
                    this.cellMap[ret.row][ret.col].getComponent(Diamond).setComposeType(composeType);
                    if(row != ret.row || col != ret.col){
                        let nodePos = this.translateRowColToNodePos(ret.row,ret.col);
                        let moveTo = cc.moveTo(this.dispelTime,nodePos);
                        let cb = cc.callFunc(()=>{
                            this.destroyDiamond(diamond.node);
                        });
                        cell.runAction(cc.sequence(moveTo,cb));
                        this.setCell(row,col,0);
                    }
                }
                let effectColList = [col];

                //针对被cell影响的stone做处理 非stone则忽略
                let stoneList = [];
                if(col != 0){
                    let leftCell = this.cellMap[row][col - 1];
                    if(this.isStone(leftCell)){
                        if(effectBoomCellList.indexOf(leftCell) == -1){
                            stoneList.push(leftCell);
                        }
                        effectColList.push(col - 1);
                    }
                }
                if(col != this.cols - 1){
                    let rightCell = this.cellMap[row][col + 1];
                    if(this.isStone(rightCell)){
                        if(effectBoomCellList.indexOf(rightCell) == -1){
                            stoneList.push(rightCell);
                        }
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
                    if(stone.isSpecialStone()){
                        continue;
                    }
                    let value = stone.value - 1;
                    if(value < Stone.BASE_ID){
                        this.destroyStone(stone.node);
                        let broken = this.getSoilBroken();
                        broken.position = this.translateRowColToNodePos(stone.row,stone.col);
                        this.setCell(stone.row,stone.col,0);
                    }else{
                        stone.setStoneId(value);
                        let stoneBroken = this.getStoneBroken();
                        stoneBroken.position = this.translateRowColToNodePos(stone.row,stone.col);
                    }
                }

                for(let k = 0; k < effectColList.length; k++){
                    if(colList.indexOf(effectColList[k]) == -1){
                        colList.push(effectColList[k]);
                    }
                }
            }
        }

        for(let i = 0; i < effectBoomCellList.length; i++){
            let effectRow;
            let effectCol;
            if(this.isDiamond(effectBoomCellList[i])){
                let diamond = effectBoomCellList[i].getComponent(Diamond);
                effectRow = diamond.row;
                effectCol = diamond.col;
                if(diamond.composeType == Diamond.COMPOSE_TYPE.BOMB){
                    let bomb = this.getBomb();
                    this.playBombSound();
                    let nodePos = this.translateRowColToNodePos(effectRow,effectCol);
                    bomb.position = nodePos;
                }else if(diamond.composeType == Diamond.COMPOSE_TYPE.CROSS){
                    let cross = this.getCross();
                    this.playCrossSound();
                    cross.getComponent(CrossAnim).setPos(effectRow,effectCol);
                    cross.getComponent(CrossAnim).play(this.crossTime,()=>{
                        // this.destroyCross(cross);
                        cross.destroy();
                    });
                    hasCross = true;
                }
                this.destroyDiamond(effectBoomCellList[i]);
            }else if(this.isStone(effectBoomCellList[i])){
                effectRow = effectBoomCellList[i].getComponent(Stone).row;
                effectCol = effectBoomCellList[i].getComponent(Stone).col;
                if(effectBoomCellList[i].getComponent(Stone).stoneId == Stone.BASE_ID){
                    let broken = this.getSoilBroken();
                    broken.position = this.translateRowColToNodePos(effectRow,effectCol);
                }else if(effectBoomCellList[i].getComponent(Stone).stoneId > Stone.BASE_ID){
                    let broken = this.getStoneBroken();
                    broken.position = this.translateRowColToNodePos(effectRow,effectCol);
                }
                this.playStoneBrokenSound();
                this.destroyStone(effectBoomCellList[i]);
            }
            this.setCell(effectRow,effectCol,0);
            let exist = false;
            if(colList.indexOf(effectCol) == -1){
                colList.push(effectCol);
            }
        }

        this.playDiamondBrokenSound();
        if(hasStoneBroken){
            this.playStoneBrokenSound();
            this.updateAllStones();
        }
        // Util.showToast('maxRow = ' + maxRow);

        this.addEffectCols(colList);

        let time1 = this.dispelTime;
        if(hasCross){
            time1 = this.crossTime;
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
            let resultMap = this.findAllDispel([]);
            if(resultMap.length == 0){
                this.selectedCell = null;
                this.resetEffectCols();
                if(bNeedCreateStone){
                    this.addDepthLevel();
                    let createRowNum = 3 - maxRow;
                    //清除顶出去的
                    for(let row = this.rows - 1; row > this.rows - 1 - createRowNum; row--){
                        for(let col = 0; col < this.cols; col++){
                            let cell:cc.Node = this.cellMap[row][col];
                            this.setCell(row,col,0);
                            if(this.isCellValid(cell)){
                                this.outsideCellList.push(cell);
                            }
                        }
                    }
                    //处理顶上来的
                    for(let row = this.rows - 1 - createRowNum; row >= 0; row--){
                        for(let col = 0; col < this.cols; col++){
                            this.setCell(row + createRowNum,col,this.cellMap[row][col]);
                            let cell:cc.Node = this.cellMap[row][col];
                            if(this.isStone(cell)){
                                cell.getComponent(Stone).row = row + createRowNum;
                            }else if(this.isDiamond(cell)){
                                cell.getComponent(Diamond).row = row + createRowNum;
                            }
                        }
                    }
                    let stoneIdList = this.createStoneIdListByDepth(this.depthLevel,createRowNum * this.cols);
                    let normalStoneNum = 0;
                    for(let i = 0; i < stoneIdList.length; i++){
                        if(stoneIdList[i] == Stone.BASE_ID){
                            normalStoneNum++;
                        }
                    }
                    let goldIdList:number[] = this.createGoldIdListByDepth(this.depthLevel,normalStoneNum);
                    //新出来的土
                    for(let row = 0; row < createRowNum; row++){
                        for(let col = 0; col < this.cols; col++){
                            let stone:cc.Node = this.getStone();
                            stone.getComponent(Stone).setRowCol(row,col);
                            stone.parent = this.contentNode;
                            this.setCell(row,col,stone);
                            let nodePos = this.translateRowColToNodePos(row,col);
                            stone.position = cc.v2(nodePos.x,nodePos.y - 90 * createRowNum);
                            let randomIndex = Util.random(stoneIdList.length) - 1;
                            let stoneId = stoneIdList[randomIndex];
                            stone.getComponent(Stone).setStoneId(stoneId);
                            stoneIdList.splice(randomIndex,1);
                            if(stoneId == Stone.BASE_ID){
                                randomIndex = Util.random(goldIdList.length) - 1;
                                let goldId = goldIdList[randomIndex];
                                stone.getComponent(Stone).setGoldId(goldId);
                                goldIdList.splice(randomIndex,1);
                                // console.log(`新出土111 row = ${row} col = ${col} goldId = ${goldId} stoneId = ${stoneId}`);
                            }else{
                                stone.getComponent(Stone).setGoldId(0);
                                // console.log(`新出土222 row = ${row} col = ${col} goldId = ${0} stoneId = ${stoneIdList[randomIndex]}`);
                            }
                        }
                    }
                    let moveOutside = cc.moveBy(DiamondView.LANDUP_TIME,cc.v2(0,90 * createRowNum));
                    this.playWheelAction();
                    let addSeconds = DiamondCountdown.NORMAL_SECONDS_ADD;
                    if(createRowNum == 4){
                        addSeconds = DiamondCountdown.CLEAR_SECONDS_ADD;
                        //todo 这里要提示全部消除
                        Util.showToast(`完全消除 +${addSeconds}s`);
                    }
                    this.timeNode.getComponent(DiamondCountdown).addSeconds(addSeconds,DiamondView.LANDUP_TIME);
                    this.contentNode.runAction(cc.sequence(moveOutside.easing(cc.easeQuinticActionOut()),cc.callFunc(()=>{
                        //contentNode复位刷新this.cellMap整体点位
                        this.clearOutsideCellList();
                        this.resetAllCellPos();
                        this.setIsDispel(false);
                        this.dumpCellInfo();
                    })));
                    this.playCreateStoneSound();
                    this.instrumentNode.getComponent(InstrumentView).setValue(this.depthLevel * this.metrePerDepthLevel);
                    this.updateAllStones();
                }else{
                    this.setIsDispel(false);
                }
                let isEnd = this.checkIsEnd();
                if(isEnd){
                    Util.showToast('没有可以消除的宝石');
                    this.node.runAction(cc.sequence(
                        cc.delayTime(1),
                        cc.callFunc(()=>{
                            this.shuffle();
                        })
                    ));
                    this.setIsDispel(true);
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
            cc.delayTime(time1 + 0.01),
            cc.callFunc(gravityCellCb),
            cc.delayTime(time2 + 0.01),
            cc.callFunc(generateCellCb),
            cc.delayTime(time3 + 0.01),
            cc.callFunc(afterGenerateCb)
        ];

        this.node.runAction(cc.sequence(actionList));
    }

    //洗牌 不保证能洗出可消的牌型
    shuffle(finishedCb?:Function){
        let cellList = [1,2,3,4,5];
        let map = MapCreator.createMap(8,8,cellList,false);
        let isFirst = true;
        for(let i = 0; i < map.length; i++){
            let pos = MapCreator.get_row_and_col_by_index(i);
            let row = pos.x;
            let col = pos.y;
            let diamondId = map[i];
            if(this.isDiamond(this.cellMap[row][col])){
                let diamondCell = this.cellMap[row][col];
                let scaleTo1 = cc.scaleTo(0.2,0).easing(cc.easeQuinticActionOut());
                let call = cc.callFunc(()=>{
                    diamondCell.getComponent(Diamond).setDiamondId(diamondId);
                });
                let delay = cc.delayTime(0.2);
                let scaleTo2 = cc.scaleTo(0.2,1).easing(cc.easeQuinticActionOut());
                let actionList = [scaleTo1,call,delay,scaleTo2];
                if(isFirst){
                    actionList.push(cc.callFunc(()=>{
                        if(finishedCb){
                            finishedCb();
                        }
                        if(this.checkIsEnd()){
                            this.shuffle();
                        }else{
                            this.setIsDispel(false);
                        }
                    }));
                }
                let seq = cc.sequence(actionList);
                isFirst = false;
                diamondCell.runAction(seq);
            }
        }
    }

    clearOutsideCellList(){
        for(let i = 0; i < this.outsideCellList.length; i++){
            this.outsideCellList[i].destroy();
        }
        this.outsideCellList = [];
    }

    resetAllCellPos(){
        this.contentNode.position = cc.v2(0,this.originContentY);
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

    dumpResult(result:Result){
        /**
         * row?:number,
    col?:number,
    value?:number,
    type?:number,
    list?:cc.Node[],
         */
        // console.log(`-------------begin dump dumpResult---------------`);
        // console.log(`dumpResult row = ${result.row} col = ${result.col} value = ${result.value} type = ${result.type}`);
        // for(let i = 0; i < result.list.length; i++){
        //     console.log(`list cell${i} row = ${result.list[i].getComponent(Diamond).row} col = ${result.list[i].getComponent(Diamond).col} `);
        // }
        // console.log(`-------------end dump dumpResult---------------`);
    }

    dumpCellInfo(){
        // for(let row = this.rows - 1; row >= 0; row--){
        //     let str = '|';
        //     for(let col = 0; col < this.cols; col++){
        //         let cell = this.cellMap[row][col];
        //         if(this.isDiamond(cell)){
        //             str += `宝石${cell.getComponent(Diamond).value}`;
        //         }else if(this.isStone(cell)){
        //             str += `石头${cell.getComponent(Stone).value}`;
        //         }else{
        //             str += `空的`;
        //         }
        //         str += ',';
        //         if(col == this.cols - 1){
        //             str += '|';
        //         }
        //     }
        //     console.log(str);
        // }

        // for(let row = this.rows - 1; row >= 0; row--){
        //     for(let col = 0; col < this.cols; col++){
        //         let cell = this.cellMap[row][col];
        //         if(this.isDiamond(cell)){
        //             let diamond = cell.getComponent(Diamond);
        //             if(row != diamond.row || col != diamond.col){
        //                 console.log(`diamond row[${row}] col[${col}] is not equal row[${diamond.row}] col[${diamond.col}]`);
        //             }
        //         }else if(this.isStone(cell)){
        //             let stone = cell.getComponent(Stone)
        //             if(row != stone.row || col != stone.col){
        //                 console.log(`stone row[${row}] col[${col}] is not equal row[${stone.row}] col[${stone.col}] id = ` + cell._id);
        //             }
        //         }
        //     }
        // }
    }

    
    gravityCell(colList,time,flag){
        // console.log("gravityCell colList = " + JSON.stringify(colList));
        for(let i = 0; i < colList.length; i++){
            let col = colList[i];
            let cellList = [];
            for(let row = 0; row < this.rows; row++){
                let cell = this.cellMap[row][col];
                if(this.isCellValid(cell)){
                    cellList.push(cell);
                    this.setCell(row,col,0);
                }
            }

            // if(flag == "afterGenerateCb"){
            //     console.log("@@@col = " + col + " height = " + cellList.length);
            // }

            for(let i = 0; i < cellList.length; i++){
                let row = i;
                // console.log("@@@gravity row = " + row + " col = " + col);
                let nodePos = this.translateRowColToNodePos(row,col);
                let moveTo = cc.moveTo(time,nodePos);
                cellList[i].runAction(moveTo);
                this.setCell(row,col,cellList[i]);
                if(this.isDiamond(cellList[i])){
                    cellList[i].getComponent(Diamond).row = row;
                    cellList[i].getComponent(Diamond).col = col;
                }else{
                    // console.log('gravityCell setRowCol');
                    cellList[i].getComponent(Stone).setRowCol(row,col);
                }
            }
        }
    }

    generateCell(colList,time){
        // console.log("generateCell colList = " + JSON.stringify(colList));
        let offsetTopY = 300;
        for(let i = 0; i < colList.length; i++){
            let col = colList[i];
            let yList = [];
            for(let j = 0; j < this.rows; j++){
                if(!this.isCellValid(this.cellMap[j][col])){
                    yList.push(j);
                }
            }

            // console.log("@@@generateCell yList = " + JSON.stringify(yList));

            for(let k = 0; k < yList.length; k++){
                let y = yList[k];
                let cell = this.createRandomDiamond();
                this.setCell(y,col,cell);
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
    mergeResultList(inRet:Result,outRet:Result,priorCellList:cc.Node[] = []):Result{
        // console.log('inList.length = ' + inList.length + ' outList.length = ' + outList.length);
        let ret;
        if(inRet.value != outRet.value){
            ret = outRet;
            return ret;
        }
        if(inRet.list.length > outRet.list.length){
            ret = inRet;
        }else if(inRet.list.length == outRet.list.length){
            //数量一致时 优先取存在于priorCellList中的
            let inKeyCell = this.cellMap[inRet.row][inRet.col];
            let outKeyCell = this.cellMap[outRet.row][outRet.col];
            if(priorCellList.indexOf(inKeyCell) != -1){
                ret = inRet;
            }else{
                ret = outRet;
            }
        }else{
            ret = outRet;
        }
        return ret;
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

    //priorCellList merge时 优先取priorCellList中的
    findAllDispel(priorCellList:cc.Node[] = []){
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
                            result = this.mergeResultList(currentRet,result,priorCellList);
                            resultMap[k] = result;
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

    testClear(){
        let bNeedCreateStone = false;
        let resultMap = this.findAllDispel([]);
        if(resultMap.length == 0){
            this.selectedCell = null;
            this.resetEffectCols();
            if(bNeedCreateStone){
                this.addDepthLevel();
                let createRowNum = 3 - 1;
                //清除顶出去的
                for(let row = this.rows - 1; row > this.rows - 1 - createRowNum; row--){
                    for(let col = 0; col < this.cols; col++){
                        let cell:cc.Node = this.cellMap[row][col];
                        this.setCell(row,col,0);
                        if(this.isCellValid(cell)){
                            this.outsideCellList.push(cell);
                        }
                    }
                }
                //处理顶上来的
                for(let row = this.rows - 1 - createRowNum; row >= 0; row--){
                    for(let col = 0; col < this.cols; col++){
                        this.setCell(row + createRowNum,col,this.cellMap[row][col]);
                        let cell:cc.Node = this.cellMap[row][col];
                        if(this.isStone(cell)){
                            cell.getComponent(Stone).row = row + createRowNum;
                        }else if(this.isDiamond(cell)){
                            cell.getComponent(Diamond).row = row + createRowNum;
                        }
                    }
                }
                let stoneIdList = this.createStoneIdListByDepth(this.depthLevel,createRowNum * this.cols);
                let normalStoneNum = 0;
                for(let i = 0; i < stoneIdList.length; i++){
                    if(stoneIdList[i] == Stone.BASE_ID){
                        normalStoneNum++;
                    }
                }
                let goldIdList:number[] = this.createGoldIdListByDepth(this.depthLevel,normalStoneNum);
                //新出来的土
                for(let row = 0; row < createRowNum; row++){
                    for(let col = 0; col < this.cols; col++){
                        let stone:cc.Node = this.getStone();
                        stone.getComponent(Stone).setRowCol(row,col);
                        stone.parent = this.contentNode;
                        this.setCell(row,col,stone);
                        let nodePos = this.translateRowColToNodePos(row,col);
                        stone.position = cc.v2(nodePos.x,nodePos.y - 90 * createRowNum);
                        let randomIndex = Util.random(stoneIdList.length) - 1;
                        let stoneId = stoneIdList[randomIndex];
                        stone.getComponent(Stone).setStoneId(stoneId);
                        stoneIdList.splice(randomIndex,1);
                        if(stoneId == Stone.BASE_ID){
                            randomIndex = Util.random(goldIdList.length) - 1;
                            let goldId = goldIdList[randomIndex];
                            stone.getComponent(Stone).setGoldId(goldId);
                            goldIdList.splice(randomIndex,1);
                            // console.log(`新出土111 row = ${row} col = ${col} goldId = ${goldId} stoneId = ${stoneId}`);
                        }else{
                            stone.getComponent(Stone).setGoldId(0);
                            // console.log(`新出土222 row = ${row} col = ${col} goldId = ${0} stoneId = ${stoneIdList[randomIndex]}`);
                        }
                    }
                }
                let moveOutside = cc.moveBy(DiamondView.LANDUP_TIME,cc.v2(0,90 * createRowNum));
                this.playWheelAction();
                let addSeconds = DiamondCountdown.NORMAL_SECONDS_ADD;
                if(createRowNum == 4){
                    addSeconds = DiamondCountdown.CLEAR_SECONDS_ADD;
                    //todo 这里要提示全部消除
                    Util.showToast(`完全消除 +${addSeconds}s`);
                }
                this.timeNode.getComponent(DiamondCountdown).addSeconds(addSeconds,DiamondView.LANDUP_TIME);
                this.contentNode.runAction(cc.sequence(moveOutside.easing(cc.easeQuinticActionOut()),cc.callFunc(()=>{
                    //contentNode复位刷新this.cellMap整体点位
                    this.clearOutsideCellList();
                    this.resetAllCellPos();
                    this.setIsDispel(false);
                    this.dumpCellInfo();
                })));
                this.playCreateStoneSound();
                this.instrumentNode.getComponent(InstrumentView).setValue(this.depthLevel * this.metrePerDepthLevel);
                this.updateAllStones();
            }else{
                this.setIsDispel(false);
                this.updateUI();
            }
            let isEnd = this.checkIsEnd();
            if(isEnd){
                Util.showToast('没有可以消除的宝石');
                this.node.runAction(cc.sequence(
                    cc.delayTime(1),
                    cc.callFunc(()=>{
                        this.shuffle();
                    })
                ));
                this.setIsDispel(true);
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
        let composeType = Diamond.COMPOSE_TYPE.NONE;
        if(result.type == DiamondView.DISPEL_TYPE.HORI){
            if(result.list.length == 4){
                composeType = Diamond.COMPOSE_TYPE.BOMB;
            }else if(result.list.length > 4){
                composeType = Diamond.COMPOSE_TYPE.CROSS;
            }
        }else if(result.type == DiamondView.DISPEL_TYPE.VERT){
            if(result.list.length == 4){
                composeType = Diamond.COMPOSE_TYPE.BOMB;
            }else if(result.list.length > 4){
                composeType = Diamond.COMPOSE_TYPE.CROSS;
            }
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_DOWN){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_LEFT){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_RIGHT){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.CENTER_UP){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.DOWN_LEFT){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.DOWN_RIGHT){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.UP_LEFT){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
        }else if(result.type == DiamondView.DISPEL_TYPE.UP_RIGHT){
            composeType = Diamond.COMPOSE_TYPE.CROSS;
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
            // console.log(`findCenterDownDispel left return`);
            return [];
        }
        let listRight = this.search(row,col,DiamondView.DIR.RIGHT);
        if(listRight.length < 1){
            // console.log(`findCenterDownDispel right return`);
            return [];
        }
        let listDown = this.search(row,col,DiamondView.DIR.DOWN);
        if(listDown.length < 2){
            // console.log(`findCenterDownDispel down return`);
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
    checkIsEnd(posList?:any[]){
        return this.exchangCheckArrFun(posList);
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

    exchangCheckArrFun(posList?:any[]) : boolean{
        for(var i = 0 ; i < this.cols ; i++) {
            for (var j = 0; j < this.rows-1; j++) {
                //必须全是宝石才能互换
                if(this.isDiamond(this.cellMap[j][i]) && this.isDiamond(this.cellMap[j+1][i]) ){
                    var temp = this.cellMap[j][i];
                    this.cellMap[j][i] = this.cellMap[j+1][i];
                    this.cellMap[j+1][i] = temp;

                    var end  = this.check3Same();
                    this.cellMap[j+1][i] = this.cellMap[j][i]
                    this.cellMap[j][i] = temp
                    cc.log(end)
                    if(end == false){
                        // cc.log("还存在三个相同的色块 游戏继续")
                        if(posList){
                            posList.push({row:j,col:i});
                            posList.push({row:j+1,col:i});
                        }
                        return false;
                    }
                }
            }
        }

        for(var k = 0 ; k < this.cols-1; k++) {
            for (var l = 0; l < this.rows; l++) {
                //必须全是宝石才能互换
                if(this.isDiamond(this.cellMap[l][k]) && this.isDiamond(this.cellMap[l][k+1])){
                    var temp1 = this.cellMap[l][k];
                    this.cellMap[l][k] = this.cellMap[l][k+1];
                    this.cellMap[l][k+1] = temp1;
                    var end1  = this.check3Same();
                    this.cellMap[l][k+1] = this.cellMap[l][k]
                    this.cellMap[l][k] = temp1
                    cc.log(end1)
                    if(end1 ==false){
                        // cc.log("还存在三个相同的色块 游戏继续")
                        if(posList){
                            posList.push({row:l,col:k});
                            posList.push({row:l,col:k+1});
                        }
                        return false;
                    }
                }
            }
        }
        // cc.log("没有可以交换的块了 游戏结束")
        return true;
    }
}
export = DiamondView;
