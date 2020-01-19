import Game = require("../../common/src/Game");

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
import EventConfig = require('../../common/src/EventConfig');

@ccclass
class DiamondCountdown extends cc.Component {
    @property(cc.Node)
    countdownValue: cc.Node = null;
    @property(cc.Sprite)
    progress: cc.Sprite = null;
    @property(cc.Node)
    markBg: cc.Node = null;

    static NORMAL_SECONDS_ADD:number = 20;
    static CLEAR_SECONDS_ADD:number = 60;
    static TOOL_SECONDS_ADD:number = 30;
    
    seconds: number = 0;
    tmpSeconds: number = 0;
    static defaultMaxSeconds: number = 90;
    maxSeconds: number = 0;
    isUpdateBlock: boolean = false;
    warningSeconds: number = 30;
    isWarning: boolean = false;
    onLoad() {

    }

    addSeconds(value:number,dur:number = 1.5){
        this.setSeconds(this.seconds + value,true,dur);
    }

    setSeconds(value:number,isAnim:boolean = false,animTime:number = 1.5){
        if(value < DiamondCountdown.defaultMaxSeconds){
            this.maxSeconds = DiamondCountdown.defaultMaxSeconds;
        }else{
            this.maxSeconds = value;
        }
        this.seconds = value;
        this.tmpSeconds = value;
        this.stopCountdown();
        if(!isAnim){
            this.startCountdown();
        }else{
            let progress = this.tmpSeconds / this.maxSeconds;
            cc.tween(this.progress.getComponent(cc.Sprite)).to(animTime,{fillRange:progress},{easing:'quintOut'}).start();
            this.updateMarkPos(true,animTime,()=>{
                this.startCountdown();
            });
        }
        this.updateTime();
    }

    stopCountdown(){
        this.isUpdateBlock = true;
        this.unschedule(this.countdownUpdate);
    }

    startCountdown(){
        this.isUpdateBlock = false;
        this.schedule(this.countdownUpdate,1);
    }

    update(dt:number){
        if(this.isUpdateBlock){
            return;
        }
        this.tmpSeconds -= dt;
        this.updateProgress();
        this.updateMarkPos();
    }

    updateProgress(){
        let progress = this.tmpSeconds / this.maxSeconds;
        this.progress.getComponent(cc.Sprite).fillRange = progress;
    }

    updateMarkPos(isAnim:boolean = false,dur:number = 1.5,finishedCb:Function = null){
        let progress = this.tmpSeconds / this.maxSeconds;
        let maxX = 394;
        let minX = -5;
        let posX = minX + (maxX - minX) * progress;
        if(!isAnim){
            this.markBg.x = posX;
        }else{
            this.markBg.runAction(cc.sequence(
                cc.moveTo(dur,cc.v2(posX,this.markBg.y)).easing(cc.easeQuinticActionOut()),
                cc.callFunc(()=>{
                    if(finishedCb){
                        finishedCb();
                    }
                })
            ));
        }
    }

    countdownUpdate(){
        // console.log("====countdownUpdate===");
        this.seconds--;
        if(this.seconds < 0){
            this.seconds = 0;
            this.stopCountdown();
            Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_TIMEOUT);
        }
        this.updateTime();
        if(this.seconds > this.warningSeconds){
            Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_STOP_WARNING);
            this.isWarning = false;
        }else if(this.seconds < this.warningSeconds && !this.isWarning){
            Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_START_WARNING);
            this.isWarning = true;
        }
    }

    updateTime(){
        let timeStr = this.formatTime(this.seconds);
        this.countdownValue.getComponent(cc.Label).string = timeStr;
    }

    formatTime(seconds){
        let min = Math.floor(seconds / 60);
        let sec = seconds % 60;
        let str = '';
        if(min < 10){
            str += '0';
        }
        str += min;
        str += ':';
        if(sec < 10){
            str += '0';
        }
        str += sec;
        return str;
    }
}

export = DiamondCountdown;
