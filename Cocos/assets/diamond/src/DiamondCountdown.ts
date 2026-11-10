import { Component, Label, Node, Sprite, Vec3, _decorator, tween } from 'cc';
import Game from "../../common/src/Game";

import EventConfig from '../../common/src/EventConfig';

const { ccclass, property } = _decorator;

@ccclass('DiamondCountdown')
class DiamondCountdown extends Component {
    @property(Node)
    countdownValue: Node = null;
    @property(Sprite)
    progress: Sprite = null;
    @property(Node)
    markBg: Node = null;

    static NORMAL_SECONDS_ADD:number = 20;
    static CLEAR_SECONDS_ADD:number = 60;
    static TOOL_SECONDS_ADD:number = 30;

    seconds: number = 0;
    tmpSeconds: number = 0;
    static defaultMaxSeconds: number = 90;
    maxSeconds: number = 0;
    isUpdateBlock: boolean = true;
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
            tween(this.progress).to(animTime,{fillRange:progress},{easing:'quintOut'}).start();
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
        this.progress.fillRange = progress;
    }

    updateMarkPos(isAnim:boolean = false,dur:number = 1.5,finishedCb:Function = null){
        let progress = this.tmpSeconds / this.maxSeconds;
        let maxX = 394;
        let minX = -5;
        let posX = minX + (maxX - minX) * progress;
        if(!isAnim){
            this.markBg.x = posX;
        }else{
            tween(this.markBg)
                .to(dur, { position: new Vec3(posX, this.markBg.position.y, this.markBg.position.z) }, { easing: 'quintOut' })
                .call(() => finishedCb?.())
                .start();
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
        this.countdownValue.getComponent(Label).string = timeStr;
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

export default DiamondCountdown;
