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
    // maxScore: number = 0;
    attr = {};
    onLoad(){
        this.init();
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
            let str: string = cc.sys.localStorage.getItem(k);
            if(!str){
                this.attr[k] = Player.ATTR_DEFAULT[k];
            }else{
                this.attr[k] = parseInt(str)
            }
        }
    }

    initMaxScore(){
        let str: string = cc.sys.localStorage.getItem(Player.ATTR.MAX_GOLD);
        if(!str){
            this.maxScore = -1;
        }else{
            this.maxScore = parseInt(str);
        }
    }

    setMaxScore(score:number){
        if(score <= this.maxScore){
            return;
        }
        this.maxScore = this.maxScore;
        cc.sys.localStorage.setItem(Player.ATTR.MAX_GOLD,`${score}`);
    }
}

export = Player;
