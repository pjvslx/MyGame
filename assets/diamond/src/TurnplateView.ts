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
import Util = require('../../common/src/Util');
import Player = require('./Player');
import Game = require('../../common/src/Game');
import RewardView = require('./RewardView');
import EventConfig = require('../../common/src/EventConfig');
import DiamondConfig = require('./DiamondConfig');
import AdManager = require('../../common/src/AdManager');

let priceConfig = [
    {attrKey: 'SEARCH_TOOL', count: 1 },
    {attrKey: 'DIGGER_TOOL', count: 2 },
    {attrKey: 'TIME_TOOL',   count: 1 },
    {attrKey: 'SEARCH_TOOL', count: 2 },
    {attrKey: 'DIGGER_TOOL', count: 1 },
    {attrKey: 'TIME_TOOL',   count: 2 }
];

@ccclass
class TurnplateView extends cc.Component {
    @property(cc.Node)
    wheelSp: cc.Node = null;
    @property(cc.Node)
    btnStart: cc.Node = null;
    @property(cc.Node)
    btnAgain: cc.Node = null;
    @property(cc.Node)
    btnBack: cc.Node = null;
    @property(cc.Node)
    startNode: cc.Node = null;
    @property(cc.Node)
    endNode: cc.Node = null;
    @property(cc.Node)
    itemList: cc.Node[] = [];
    @property(cc.SpriteFrame)
    iconFrameList: cc.SpriteFrame[] = [];

    maxTime : number = 2;
    turnTime : number = 0;

    @property
    duration : number = 0;
    @property
    acc: number = 0;
    @property
    maxSpeed : number = 0;
    @property
    decAngle : number = 0;
    @property
    springback: boolean = false;
    targetID: number = 5;
    // 转盘状态 0：静止 1：加速 2：减速 匀速：3
    wheelState: number = 0;
    currentSpeed: number = 0;
    // 减速前旋转时间
    spinTime: number = 0;
    // 奖品数量
    priceCount: number = 0;
    // 修正默认角度
    defaultAngle: number = 0;
    // 每个齿轮的角度
    gearAngle: number = 0;
    // 最终结果指定的角度
    finalAngle: number = 0;
    // 匀速的最终角度
    constantAngel: number = 0;
    // 减速目标角度
    slowAngel: number = 0;

    onLoad(){
        this.wheelState = 0;    
        this.currentSpeed = 0;
        this.spinTime = 0;                              
        this.priceCount = priceConfig.length;
        this.defaultAngle = 0;                          
        this.gearAngle = 360 / this.priceCount;            
        this.wheelSp.rotation = this.defaultAngle;
        this.finalAngle = 0;
        this.startNode.active = true;
        this.endNode.active = false;
        this.addEvent();
        this.updateView();
    }

    updateView(){
        for(let i = 0; i < priceConfig.length; i++){
            let spriteFrame;
            if(priceConfig[i].attrKey == Player.ATTR.SEARCH_TOOL){
                spriteFrame = this.iconFrameList[0];
            }else if(priceConfig[i].attrKey == Player.ATTR.DIGGER_TOOL){
                spriteFrame = this.iconFrameList[1];
            }else if(priceConfig[i].attrKey == Player.ATTR.TIME_TOOL){
                spriteFrame = this.iconFrameList[2];
            }
            this.itemList[i].getChildByName('icon').getComponent(cc.Sprite).spriteFrame = spriteFrame;
            this.itemList[i].getChildByName('count').getComponent(cc.Label).string = `x${priceConfig[i].count}`;
        }
    }

    addEvent(){
        this.btnStart.on('click',()=>{
            if(Game.getInstance().adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            let random = Util.random(priceConfig.length) - 1
            this.startRotation(random);
        },this);

        this.btnAgain.on('click',()=>{
            if(Game.getInstance().adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            Game.getInstance().adManager.openVedioAd(AdManager.VIDEO_ADUNIT.TURNPLATE_AGAIN,()=>{
                if(!cc.isValid(this.node)){
                    return;
                }
                let random = Util.random(priceConfig.length) - 1;
                this.startRotation(random);
            });
            // Game.getInstance().share.shareWechat(0,()=>{
            //     if(!cc.isValid(this.node)){
            //         return;
            //     }
            //     let random = Util.random(priceConfig.length) - 1;
            //     this.startRotation(random);
            // });
        },this);

        this.btnBack.on('click',()=>{
            if(Game.getInstance().adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            Game.getInstance().diamond.show();
        },this);
    }

    handleRotateFinished(targetID:number){
        this.endNode.active = true;
        this.startNode.active = false;
        let priceInfo = priceConfig[targetID];
        let attrKey = priceInfo.attrKey;
        let count = priceInfo.count;
        let normalCb:Function = ()=>{
            //直接加属性
            Game.getInstance().player.addAttr(attrKey,count);
            Util.showToast(`获得${Player.ATTR_NAME[attrKey]} x${count}`);
        };
        let str = DiamondConfig.remoteConfig.turnplateAgainRate;
        let valueList = str.split('|');
        let shareValue = parseInt(valueList[0]);
        let totalValue = parseInt(valueList[1]);
        let isShare:boolean = Util.isInRange(shareValue,totalValue);
        let doubleCb:Function = null;
        if(isShare){
            doubleCb = ()=>{
                Game.getInstance().share.shareWechat(1,()=>{
                    let doubleCount = count * 2;
                    Game.getInstance().player.addAttr(attrKey,doubleCount);
                    Util.showToast(`获得${Player.ATTR_NAME[attrKey]} x${doubleCount}`);
                    Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_CLOSE_REWARDVIEW);
                });
            };
        }else{
            doubleCb = ()=>{
                Game.getInstance().adManager.openVedioAd(AdManager.VIDEO_ADUNIT.TURNPLATE_AGAIN,()=>{
                    let doubleCount = count * 2;
                    Game.getInstance().player.addAttr(attrKey,doubleCount);
                    Util.showToast(`获得${Player.ATTR_NAME[attrKey]} x${doubleCount}`);
                    Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_CLOSE_REWARDVIEW);
                });
            };
        }
        Game.getInstance().pregame.showRewardView(RewardView.TYPE.DOUBLE,attrKey,count,normalCb,doubleCb,isShare);
    }

    startRotation(targetID: number) {
        if (this.wheelState !== 0) return;
        this.turnTime++;
        if(this.turnTime >= this.maxTime){
            this.btnStart.getComponent(cc.Button).interactable = false;
            this.btnAgain.getComponent(cc.Button).interactable = false;
        }
        this.startNode.active = false;
        this.endNode.active = false;
        this.decAngle = 2 * 360;  // 减速旋转两圈
        this.wheelState = 1;
        this.currentSpeed = 0;
        this.spinTime = 0;
        this.targetID = targetID;
        this.caculateFinalAngle(targetID);
    }

    caculateFinalAngle(targetID: number) {
        this.finalAngle = targetID * this.gearAngle + this.defaultAngle + this.decAngle;
        if (this.springback) {
            this.finalAngle += this.gearAngle;
        }
    }

    update(dt) {
        if (this.wheelState === 0) return;
        // this.updatePriceBg();
       
        if (this.wheelState === 1) {
            // cc.log('....加速, speed:' + this.currentSpeed);
            this.spinTime += dt;
            this.wheelSp.rotation += this.currentSpeed;
            if (this.currentSpeed <= this.maxSpeed) {
                this.currentSpeed += this.acc;
            } else {
                if (this.spinTime < this.duration) return;
                // cc.log('....开始匀速');
                this.maxSpeed = this.currentSpeed;
                this.wheelSp.rotation = this.wheelSp.rotation % 360;
                this.constantAngel = this.wheelSp.rotation + this.decAngle;
                this.wheelState = 3;
            }
        } else if (this.wheelState === 3) {
            // cc.log('.......匀速');
            this.wheelSp.rotation += this.currentSpeed;
            if (this.wheelSp.rotation >= this.constantAngel) {
                this.wheelSp.rotation = this.wheelSp.rotation % 360;
                this.wheelState = 2;
                this.slowAngel = this.finalAngle - this.wheelSp.rotation;
            }
        } else if (this.wheelState === 2) {
            // cc.log('......减速');
            var curRo = this.wheelSp.rotation;
            var deltaRo = this.finalAngle - curRo;
            this.currentSpeed = this.maxSpeed * (deltaRo / this.slowAngel) + 0.2; 
            this.wheelSp.rotation += this.currentSpeed;
            if (deltaRo <= 0) {
                // cc.log('....停止');
                this.wheelState = 0;
                this.wheelSp.rotation = this.finalAngle;
                if (this.springback) {
                    // 倒转一个齿轮
                    var act = cc.rotateBy(0.5, -this.gearAngle);
                    var seq = cc.sequence(
                        cc.delayTime(0.3),
                        act,
                        cc.callFunc(()=>{

                        })
                    );
                    this.wheelSp.runAction(seq);
                } else {
                    // let type = priceConfig[this.targetID].type;
                    // let count = priceConfig[this.targetID].count;
                    this.handleRotateFinished(this.targetID);
                }
            }
        }
    }

    calculateMoveOffset(index: number, num: number): cc.Vec2 {
        let angle = index * (360 / num) * Math.PI / 180;
        let radius = Math.random() * (80 - 40 + 1 + index * 10) + 40;
        let offsetX = Math.cos(angle) * radius;
        let offsetY = Math.sin(angle) * radius;
        return cc.v2(offsetX, offsetY);
    }
}

export = TurnplateView;
