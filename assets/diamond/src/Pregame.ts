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
import RewardView = require("./RewardView");
import ViewAction = require("../../common/src/ViewAction");
import Player = require('./Player');
import Util = require('../../common/src/Util');
@ccclass
class Pregame extends cc.Component {
    @property(cc.Prefab)
    rewardPrefab: cc.Prefab = null;

    preRewardCount = {
        DIGGER_TOOL : 1,
        SEARCH_TOOL : 3,
        TIME_TOOL : 1,
    };

    itemRewardRate: number = 30;    //某样道具不足时弹道具给与时的概率 百分之
    showRewardView(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function){
        let rewardView = cc.instantiate(this.rewardPrefab);
        rewardView.parent = cc.Canvas.instance.node;
        rewardView.getComponent(RewardView).init(type,attrKey,count,cb1,cb2);
        rewardView.getComponent(ViewAction).open();
    }

    deal(){
        let Game = require('../../common/src/Game');
        //Game.getInstance().diamond.show();
        let attrKeyList = [Player.ATTR.DIGGER_TOOL,Player.ATTR.SEARCH_TOOL,Player.ATTR.TIME_TOOL];
        let lackAttrKeyList = [];
        for(let i = 0; i < attrKeyList.length; i++){
            let attrKey:string = attrKeyList[i];
            let count = Game.getInstance().player.getAttr(attrKey);
            if(count <= 0){
                lackAttrKeyList.push(attrKey);
            }
        }
        
        let random = Util.random(100);
        if(lackAttrKeyList.length == 0 || random > this.itemRewardRate){
            //直接进入游戏
            Game.getInstance().diamond.show();
        }else{
            let random = Util.random(lackAttrKeyList.length) - 1;
            let attrKey = lackAttrKeyList[random];
            let count = this.preRewardCount[attrKey];
            this.showRewardView(RewardView.TYPE.NORMAL,attrKey,count,()=>{
                Game.getInstance().player.addAttr(attrKey,count);
                Util.showToast(`获得${Player.ATTR_NAME[attrKey]} x${count}`);
            },()=>{
                Game.getInstance().diamond.show();
            });
        }
    }
}

export = Pregame;