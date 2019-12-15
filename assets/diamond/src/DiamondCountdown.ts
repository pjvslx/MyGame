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
    
    seconds: number = 0;
    tmpSeconds: number = 0;
    static defaultMaxSeconds: number = 90;
    maxSeconds: number = 0;
    isUpdateBlock: boolean = false;
    onLoad() {

    }

    setSeconds(value:number){
        if(value < DiamondCountdown.defaultMaxSeconds){
            this.maxSeconds = DiamondCountdown.defaultMaxSeconds;
        }else{
            this.maxSeconds = value;
        }
        this.seconds = value;
        this.tmpSeconds = value;
        this.stopCountdown();
        this.startCountdown();
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
        let progress = this.tmpSeconds / this.maxSeconds;
        let maxX = 394;
        let minX = -5;
        let posX = minX + (maxX - minX) * progress;
        this.progress.getComponent(cc.Sprite).fillRange = progress;
        this.markBg.x = posX;
    }

    countdownUpdate(){
        console.log("====countdownUpdate===");
        this.seconds--;
        if(this.seconds < 0){
            this.seconds = 0;
            this.stopCountdown();
            Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_TIMEOUT);
        }
        this.updateTime();
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
