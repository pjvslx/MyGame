// // Learn TypeScript:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

import { _decorator, Component, Node, Prefab, director, Sprite, Label, instantiate, delayTime, callFunc, tween, sequence } from 'cc';
const {ccclass, property} = _decorator;

import ViewAction = require('../../common/src/ViewAction');
import Game = require('../../common/src/Game');
import Util = require('../../common/src/Util');
import EventConfig = require('../../common/src/EventConfig');
class BalanceView extends Component {
    currentScoreNode: Node | null = null;
    btnBack: Node | null = null;
    btnAgain: Node | null = null;
    btnTurnplate: Node | null = null;
    progressText: Node | null = null;
    imgProgress: Node | null = null;
    degreePrefab: Prefab | null = null;
    btnNormalNode: Node | null = null;
    btnTurnplateNode: Node | null = null;
    turnplateRewardTime: number = 4;        //每打完多少次赢得一次转盘机会
    onLoad(){
        this.addEvent();
        Game.getInstance().adManager.openInterstitialAd();
    }
    addEvent(){
        this.btnAgain.on('click',()=>{
            this.getComponent(ViewAction).close(()=>{
//                 // Game.getInstance().diamond.show();
                Game.getInstance().pregame.deal();
                Util.playClickSound();
            });
        },this);
        this.btnBack.on('click',()=>{
//             //TODO 插屏
            director.loadScene('start');
            Util.playClickSound();
        },this);
        this.btnTurnplate.on('click',()=>{
            Game.getInstance().player.setTurnplatePlayTimes(0);
            this.imgProgress.getComponent(Sprite).fillRange = 0;
            this.getComponent(ViewAction).close(()=>{
                Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_SHOW_TURNPLATE);
            });
        },this);
    }
    init(currentScore:number,maxScore:number){
        this.currentScoreNode.getComponent(Label).string = `当前分数:${currentScore}`;
        if(Util.isWXPlatform()){
            window['wx'].postMessage({
                message: 'Balance',
                data : {
                    maxScore: maxScore
                }
            });
        }
        let innerWidth = this.imgProgress.getContentSize().width;
//         //初始化刻度
        for(let i = 2; i <= this.turnplateRewardTime; i++){
            let degreeNode = instantiate(this.degreePrefab);
            degreeNode.parent = this.imgProgress;
            degreeNode.x = (i - 1) * innerWidth / this.turnplateRewardTime;
        }
        this.btnAgain.active = false;
        this.btnBack.active = false;
        let turnplatePlayTimes = Game.getInstance().player.turnplatePlayTimes;
        let oldTurnplatePlayTimes = turnplatePlayTimes;
        turnplatePlayTimes++;
        let percent;
        if(turnplatePlayTimes >= this.turnplateRewardTime){
            percent = 1;
        }else{
            percent = turnplatePlayTimes / this.turnplateRewardTime;
        }
        this.progressText.getComponent(Label).string = `每玩${this.turnplateRewardTime}把将获得一次抽奖机会`;
        this.imgProgress.getComponent(Sprite).fillRange = oldTurnplatePlayTimes / this.turnplateRewardTime;
        let delayTime = 0.5;
        let progressTime = 1;
        let delay = delayTime(delayTime);
        let call = callFunc(()=>{
            cc.tween(this.imgProgress.getComponent(Sprite)).to(progressTime,{fillRange:percent},{easing:'quintOut'}).start();
        });
        let delay2 = delayTime(progressTime);
        let call2 = callFunc(()=>{
            this.btnNormalNode.active = true;
            this.btnAgain.active = true;
            this.btnBack.active = true;
            if(percent == 1){
                this.btnNormalNode.active = false;
                this.btnTurnplateNode.active = true;
            }else{
                this.btnNormalNode.active = true;
                this.btnTurnplateNode.active = false;
                Game.getInstance().player.setTurnplatePlayTimes(turnplatePlayTimes);
            }
        });
        this.node.runAction(sequence(
            delay,call,delay2,call2
        ));
    }
}
export = BalanceView;

@ccclass('BalanceView')
    @property(cc.Node)    @property(cc.Node)    @property(cc.Node)    @property(cc.Node)    @property(cc.Node)    @property(cc.Node)    @property(cc.Prefab)    @property(cc.Node)    @property(cc.Node)
/**
 * 注意：已把原脚本注释，由于脚本变动过大，转换的时候可能有遗落，需要自行手动转换
 */
// // Learn TypeScript:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// // Learn Attribute:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// // Learn life-cycle callbacks:
// //  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
// //  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
// 
// const {ccclass, property} = cc._decorator;
// import ViewAction = require('../../common/src/ViewAction');
// import Game = require('../../common/src/Game');
// import Util = require('../../common/src/Util');
// import EventConfig = require('../../common/src/EventConfig');
// @ccclass
// class BalanceView extends cc.Component {
//     @property(cc.Node)
//     currentScoreNode: cc.Node = null;
//     @property(cc.Node)
//     btnBack: cc.Node = null;
//     @property(cc.Node)
//     btnAgain: cc.Node = null;
//     @property(cc.Node)
//     btnTurnplate: cc.Node = null;
//     @property(cc.Node)
//     progressText: cc.Node = null;
//     @property(cc.Node)
//     imgProgress: cc.Node = null;
//     @property(cc.Prefab)
//     degreePrefab: cc.Prefab = null;
//     @property(cc.Node)
//     btnNormalNode: cc.Node = null;
//     @property(cc.Node)
//     btnTurnplateNode: cc.Node = null;
//     turnplateRewardTime: number = 4;        //每打完多少次赢得一次转盘机会
// 
//     onLoad(){
//         this.addEvent();
//         Game.getInstance().adManager.openInterstitialAd();
//     }
// 
//     addEvent(){
//         this.btnAgain.on('click',()=>{
//             this.getComponent(ViewAction).close(()=>{
//                 // Game.getInstance().diamond.show();
//                 Game.getInstance().pregame.deal();
//                 Util.playClickSound();
//             });
//         },this);
// 
//         this.btnBack.on('click',()=>{
//             //TODO 插屏
//             cc.director.loadScene('start');
//             Util.playClickSound();
//         },this);
// 
//         this.btnTurnplate.on('click',()=>{
//             Game.getInstance().player.setTurnplatePlayTimes(0);
//             this.imgProgress.getComponent(cc.Sprite).fillRange = 0;
//             this.getComponent(ViewAction).close(()=>{
//                 Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_SHOW_TURNPLATE);
//             });
//         },this);
//     }
// 
//     init(currentScore:number,maxScore:number){
//         this.currentScoreNode.getComponent(cc.Label).string = `当前分数:${currentScore}`;
//         if(Util.isWXPlatform()){
//             window['wx'].postMessage({
//                 message: 'Balance',
//                 data : {
//                     maxScore: maxScore
//                 }
//             });
//         }
// 
//         let innerWidth = this.imgProgress.getContentSize().width;
//         //初始化刻度
//         for(let i = 2; i <= this.turnplateRewardTime; i++){
//             let degreeNode = cc.instantiate(this.degreePrefab);
//             degreeNode.parent = this.imgProgress;
//             degreeNode.x = (i - 1) * innerWidth / this.turnplateRewardTime;
//         }
// 
//         this.btnAgain.active = false;
//         this.btnBack.active = false;
//         let turnplatePlayTimes = Game.getInstance().player.turnplatePlayTimes;
//         let oldTurnplatePlayTimes = turnplatePlayTimes;
//         turnplatePlayTimes++;
//         let percent;
//         if(turnplatePlayTimes >= this.turnplateRewardTime){
//             percent = 1;
//         }else{
//             percent = turnplatePlayTimes / this.turnplateRewardTime;
//         }
//         this.progressText.getComponent(cc.Label).string = `每玩${this.turnplateRewardTime}把将获得一次抽奖机会`;
//         this.imgProgress.getComponent(cc.Sprite).fillRange = oldTurnplatePlayTimes / this.turnplateRewardTime;
//         let delayTime = 0.5;
//         let progressTime = 1;
//         let delay = cc.delayTime(delayTime);
//         let call = cc.callFunc(()=>{
//             cc.tween(this.imgProgress.getComponent(cc.Sprite)).to(progressTime,{fillRange:percent},{easing:'quintOut'}).start();
//         });
//         let delay2 = cc.delayTime(progressTime);
//         let call2 = cc.callFunc(()=>{
//             this.btnNormalNode.active = true;
//             this.btnAgain.active = true;
//             this.btnBack.active = true;
//             if(percent == 1){
//                 this.btnNormalNode.active = false;
//                 this.btnTurnplateNode.active = true;
//             }else{
//                 this.btnNormalNode.active = true;
//                 this.btnTurnplateNode.active = false;
//                 Game.getInstance().player.setTurnplatePlayTimes(turnplatePlayTimes);
//             }
//         });
//         this.node.runAction(cc.sequence(
//             delay,call,delay2,call2
//         ));
//     }
// }
// 
// export = BalanceView;
