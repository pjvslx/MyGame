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
import EventConfig = require('../../common/src/EventConfig');
import DiamondConfig = require('./DiamondConfig');
import AdManager = require('../../common/src/AdManager');
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
    showRewardView(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function,isShare?:boolean){
        let rewardView = cc.instantiate(this.rewardPrefab);
        rewardView.parent = cc.Canvas.instance.node;
        rewardView.getComponent(RewardView).init(type,attrKey,count,cb1,cb2,isShare);
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
        if(lackAttrKeyList.length == 0 || random > this.itemRewardRate || Game.getInstance().isShareHide()){
            //直接进入游戏
            Game.getInstance().diamond.show();
        }else{
            let random = Util.random(lackAttrKeyList.length) - 1;
            let attrKey = lackAttrKeyList[random];
            let count = this.preRewardCount[attrKey];
            let isShare:boolean = false;
            let str = DiamondConfig.remoteConfig.getItemShareRate;
            let valueList = str.split('|');
            let shareValue = parseInt(valueList[0]);
            let totalValue = parseInt(valueList[1]);
            isShare = Util.isInRange(shareValue,totalValue);

            let shareCb:Function = ()=>{
                Game.getInstance().share.shareWechat(0,()=>{
                    Game.getInstance().player.addAttr(attrKey,count);
                    Util.showToast(`获得${Player.ATTR_NAME[attrKey]} x${count}`);
                    Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_CLOSE_REWARDVIEW,true);
                })
            };

            let videoCb:Function = ()=>{
                Game.getInstance().adManager.openVedioAd(AdManager.VIDEO_ADUNIT.GET_ITEM_NORMAL,()=>{
                    Game.getInstance().player.addAttr(attrKey,count);
                    Util.showToast(`获得${Player.ATTR_NAME[attrKey]} x${count}`);
                    Game.getInstance().gNode.emit(EventConfig.EVT_DIAMOND_CLOSE_REWARDVIEW,true);
                });
            };

            let cb;
            if(isShare){
                cb = shareCb;
            }else{
                cb = videoCb;
            }

            this.showRewardView(RewardView.TYPE.NORMAL,attrKey,count,cb,()=>{
                Game.getInstance().diamond.show();
            },isShare);
        }
    }
}

export = Pregame;
