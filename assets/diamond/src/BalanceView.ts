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
import ViewAction = require('../../common/src/ViewAction');
import Game = require('../../common/src/Game');
import Util = require('../../common/src/Util');
import EventConfig = require('../../common/src/EventConfig');
@ccclass
class BalanceView extends cc.Component {
    @property(cc.Node)
    currentScoreNode: cc.Node = null;
    @property(cc.Node)
    btnBack: cc.Node = null;
    @property(cc.Node)
    btnAgain: cc.Node = null;
    @property(cc.Node)
    progressText: cc.Node = null;
    @property(cc.Node)
    imgProgress: cc.Sprite = null;

    turnplateRewardScore: number = 1000;

    onLoad(){
        this.addEvent();
    }

    addEvent(){
        this.btnAgain.on('click',()=>{
            this.getComponent(ViewAction).close(()=>{
                Game.getInstance().diamond.show();
            });
        },this);

        this.btnBack.on('click',()=>{
            //TODO 插屏
            cc.director.loadScene('start');
        },this);
    }

    init(currentScore:number,maxScore:number){
        this.currentScoreNode.getComponent(cc.Label).string = `${currentScore}`;
        if(Util.isWXPlatform()){
            window['wx'].postMessage({
                message: 'Balance',
                data : {
                    maxScore: maxScore
                }
            });
        }

        this.btnAgain.active = false;
        this.btnBack.active = false;
        let turnplateScore = Game.getInstance().player.turnplateScore;
        let oldTurnplateScore = turnplateScore;
        turnplateScore += currentScore;
        let percent;
        if(turnplateScore >= this.turnplateRewardScore){
            percent = 1;
        }else{
            percent = turnplateScore / this.turnplateRewardScore;
        }
        this.progressText.getComponent(cc.Label).string = `${turnplateScore}/${this.turnplateRewardScore}`;
        this.imgProgress.getComponent(cc.Sprite).fillRange = oldTurnplateScore / this.turnplateRewardScore;
        let delayTime = 0.5;
        let progressTime = 0.5;
        let delay = cc.delayTime(delayTime);
        let call = cc.callFunc(()=>{
            cc.tween(this.imgProgress.getComponent(cc.Sprite)).to(progressTime,{fillRange:percent},{easing:'quintOut'}).start();
        });
        let delay2 = cc.delayTime(progressTime);
        let call2 = cc.callFunc(()=>{
            this.btnAgain.active = true;
            this.btnBack.active = true;
            if(percent == 1){
                Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_SHOW_TURNPLATE);
                Game.getInstance().player.setTurnplateScore(0);
                this.imgProgress.getComponent(cc.Sprite).fillRange = 0;
                this.getComponent(ViewAction).close();
            }else{
                Game.getInstance().player.setTurnplateScore(turnplateScore);
            }
        });
        this.node.runAction(cc.sequence(
            delay,call,delay2,call2
        ));
    }
}

export = BalanceView;
