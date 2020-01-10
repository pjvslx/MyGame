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
import RewardView = require("./RewardView");
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
        SEARCH_TOOL : 10,
        DIGGER_TOOL : 10,
        TIME_TOOL : 10
    }

    static ATTR_NAME = {
        SEARCH_TOOL: "【放大镜】",
        DIGGER_TOOL: "【铲子】",
        TIME_TOOL: "【时间】",
    }

    static SPECIAL_ATTR = {
        SIGN_DATA : 'SIGN_DATA',
        MAX_SCORE_TIME : 'MAX_SCORE_TIME',
        TURNPLATE_SCORE: 'TURNPLATE_SCORE',
    }
    // maxScore: number = 0;
    attr = {};
    signDataStr:string = null;
    maxScoreTime:string = ''; // 'yyyy-mm-dd'
    turnplateScore:number = 0;

    @property(cc.Prefab)
    rewardPrefab: cc.Prefab = null;

    onLoad(){
        this.init();
    }

    showRewardView(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function){
        let rewardView = cc.instantiate(this.rewardPrefab);
        rewardView.parent = cc.Canvas.instance.node;
        rewardView.getComponent(RewardView).init(type,attrKey,count,cb1,cb2);
        rewardView.getComponent(ViewAction).open();
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
        this.initTurnplateScore();
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

    initTurnplateScore(){
        let str = Util.fetchData(Player.SPECIAL_ATTR.TURNPLATE_SCORE);
        if(str == null || str == ''){
            this.turnplateScore = 0;
        }else{
            this.turnplateScore = parseInt(str);
        }
    }

    setTurnplateScore(score:number){
        this.turnplateScore = score;
        Util.saveData(Player.SPECIAL_ATTR.TURNPLATE_SCORE,`${this.turnplateScore}`);
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
        }
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