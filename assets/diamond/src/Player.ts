import MapCreator = require("./MapCreator");

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
import ISignData = require('./ISignData');
import DiamondConfig = require("./DiamondConfig");
import EventConfig = require('../../common/src/EventConfig');
import ViewAction = require("../../common/src/ViewAction");
@ccclass
class Player extends cc.Component {
    static ATTR = {
        MAX_GOLD : 'MAX_GOLD',
        SEARCH_TOOL : 'SEARCH_TOOL',
        DIGGER_TOOL : 'DIGGER_TOOL',
        TIME_TOOL : 'TIME_TOOL',
    }

    static ATTR_DEFAULT = {
        MAX_GOLD : 0,
        SEARCH_TOOL : 0,
        DIGGER_TOOL : 0,
        TIME_TOOL : 0
    }

    static ATTR_NAME = {
        SEARCH_TOOL: "【放大镜】",
        DIGGER_TOOL: "【铲子】",
        TIME_TOOL: "【时间】",
    }

    static SPECIAL_ATTR = {
        SIGN_DATA : 'SIGN_DATA',
        MAX_SCORE_TIME : 'MAX_SCORE_TIME',
        TURNPLATE_PLAY_TIMES : 'TURNPLATE_PLAY_TIMES',
        FIRST_PLAY : 'FIRST_PLAY',
    }
    // maxScore: number = 0;
    attr = {};
    signDataStr:string = null;
    maxScoreTime:string = ''; // 'yyyy-mm-dd'
    turnplatePlayTimes: number = 0;
    isFirstPlay: boolean = false;

    onLoad(){
        this.init();
    }

    get maxScore(){
        let nowWeek = Util.getWeekStr(new Date());
        if(this.maxScoreTime != nowWeek){
            return 0;
        }
        return this.getAttr(Player.ATTR.MAX_GOLD);
    }

    set maxScore(score:number){
        if(score <= this.maxScore){
            console.log(`maxScore = ${this.maxScore} score = ${score} so return`);
            return;
        }
        this.setMaxScoreTime(Util.getWeekStr(new Date()));
        this.setAttr(Player.ATTR.MAX_GOLD,score);
    }

    init(){
        this.initAttr();
        this.initSignData();
        this.initMaxScoreTime();
        this.initTurnplatePlayTimes();
        this.initIsFirstPlay();
    }

    setAttr(attrKey:string,num:number){
        this.attr[attrKey] = num;
        cc.sys.localStorage.setItem(attrKey,`${num}`);
        let Game = require("../../common/src/Game");
        Game.getInstance().gNode.emit(EventConfig.EVT_ATTR_CHANGE);
    }

    getAttr(attrKey:string){
        return this.attr[attrKey];
    }

    addAttr(attrKey:string,num:number){
        if(num == 0){
            return;
        }
        this.setAttr(attrKey,this.attr[attrKey] + num);
    }

    resetAttr(){
        for(let k in Player.ATTR){
            cc.sys.localStorage.removeItem(k);
        }
        cc.sys.localStorage.removeItem(Player.SPECIAL_ATTR.SIGN_DATA);
    }

    initAttr(){
        for(let k in Player.ATTR){
            let str: string = Util.fetchData(k);
            if(!str || str == ''){
                this.attr[k] = Player.ATTR_DEFAULT[k];
            }else{
                this.attr[k] = parseInt(str)
            }
        }
    }

    initTurnplatePlayTimes(){
        let str = Util.fetchData(Player.SPECIAL_ATTR.TURNPLATE_PLAY_TIMES);
        if(str == null || str == ''){
            this.turnplatePlayTimes = 0;
        }else{
            this.turnplatePlayTimes = parseInt(str);
        }
    }

    setTurnplatePlayTimes(times:number){
        this.turnplatePlayTimes = times;
        Util.saveData(Player.SPECIAL_ATTR.TURNPLATE_PLAY_TIMES,`${times}`);
    }

    initIsFirstPlay(){
        let str = Util.fetchData(Player.SPECIAL_ATTR.FIRST_PLAY);
        if(str == null || str == ''){
            this.isFirstPlay = true;
        }else{
            if(str == "true"){
                this.isFirstPlay = true;
            }else{
                this.isFirstPlay = false;
            }
        }
    }

    setFirstPlay(isFirst:boolean){
        this.isFirstPlay = isFirst;
        Util.saveData(Player.SPECIAL_ATTR.FIRST_PLAY,`${isFirst}`);
    }

    initMaxScoreTime(){
        let str = Util.fetchData(Player.SPECIAL_ATTR.MAX_SCORE_TIME);
        if(str == null || str == ''){
            this.maxScoreTime = null;
        }else{
            this.maxScoreTime = str;
        }
    }

    setMaxScoreTime(scoreTime:string){
        this.maxScoreTime = scoreTime;
        Util.saveData(Player.SPECIAL_ATTR.MAX_SCORE_TIME,this.maxScoreTime);
    }

    setMaxScore(score:number){
        this.maxScore = score;
    }

    isAllSign() : boolean {
        let data:ISignData[] = this.getSignData();
        let isAllSign = true;
        for (let i = 0; i < data.length; i++) {
            let signData:ISignData = data[i];
            if (signData.isSign == false) {
                isAllSign = false;
                break;
            }
        }
        return isAllSign;
    }

    resetSign(){
        let signData = this.generateSignData();
        this.signDataStr = JSON.stringify(signData);
        Util.saveData(Player.SPECIAL_ATTR.SIGN_DATA,this.signDataStr);
    }

    getSignData():ISignData[]{
        if(this.signDataStr == null){
            this.signDataStr = Util.fetchData(Player.SPECIAL_ATTR.SIGN_DATA);
        }
        return JSON.parse(this.signDataStr);
    }

    setSignData(signData:ISignData[]){
        this.signDataStr = JSON.stringify(signData);
        Util.saveData(Player.SPECIAL_ATTR.SIGN_DATA,this.signDataStr);
    }

    initSignData () {
        this.signDataStr = Util.fetchData(Player.SPECIAL_ATTR.SIGN_DATA);
        if(this.signDataStr == null || this.signDataStr == ''){
            this.resetSign();
        }else{
            let signDataList:ISignData[] = this.getSignData();
            let isAllSign = this.isAllSign();
            if(isAllSign){
                //全部签完 要看最后一天跟今天是不是同一天 是的话不能签
                let lastSignData = signDataList[6];
                let signDate = new Date(lastSignData.timestamp);
                if(!Util.isSameDay(signDate,new Date())){
                    this.resetSign();
                }
            }
        }
    }

    canSignToday(){
        let canSign = true;
        let signDataList = this.getSignData();
        for(let i = signDataList.length - 1; i >= 0; i--){
            //找出最后一个签到的 不是今天 说明可以签
            if(signDataList[i].isSign){
                if(Util.isSameDay(new Date(signDataList[i].timestamp),new Date())){
                    canSign = false;
                }
                break;
            }
        }
        return canSign;
    }

    generateSignData (){
        let data:ISignData[] = [];
        let signConfig = DiamondConfig.signConfig;
        for(let i = 0; i < signConfig.length; i++){
            let signData:ISignData = {
                attrKey : signConfig[i].attrKey,
                count: signConfig[i].count,
                isSign: false,
                timestamp: 100
            };
            data.push(signData);
        }
        return data;
    }
}

export = Player;
