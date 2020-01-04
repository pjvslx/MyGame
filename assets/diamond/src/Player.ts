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

    static SPECIAL_ATTR = {
        SIGN_DATA : 'SIGN_DATA'
    }
    // maxScore: number = 0;
    attr = {};
    signDataStr:string = null;
    onLoad(){
        this.init();
        this.initSignData();
    }

    get maxScore(){
        return this.getAttr(Player.ATTR.MAX_GOLD);
    }

    set maxScore(score:number){
        if(score <= this.maxScore){
            console.log(`maxScore = ${this.maxScore} score = ${score} so return`);
            return;
        }
        this.setAttr(Player.ATTR.MAX_GOLD,score);
    }

    init(){
        this.initAttr()
    }

    setAttr(attrKey:string,num:number){
        this.attr[attrKey] = num;
        cc.sys.localStorage.setItem(attrKey,`${num}`);
    }

    getAttr(attrKey:string){
        return this.attr[attrKey];
    }

    addAttr(attrKey:string,num:number){
        if(num == 0){
            return;
        }
        this.attr[attrKey] += num;
        cc.sys.localStorage.setItem(attrKey,this.attr[attrKey]);
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

    setMaxScore(score:number){
        if(score <= this.maxScore){
            return;
        }
        this.maxScore = this.maxScore;
        cc.sys.localStorage.setItem(Player.ATTR.MAX_GOLD,`${score}`);
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
