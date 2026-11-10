import { Canvas, Component, Prefab, _decorator, director, instantiate } from 'cc';
import Game from '../../common/src/Game';

import RewardView from "./RewardView";
import ViewAction from "../../common/src/ViewAction";
import Player from './Player';
import Util from '../../common/src/Util';
import EventConfig from '../../common/src/EventConfig';
import DiamondConfig from './DiamondConfig';
import AdManager from '../../common/src/AdManager';

const { ccclass, property } = _decorator;
@ccclass('Pregame')
class Pregame extends Component {
    @property(Prefab)
    rewardPrefab: Prefab = null;

    preRewardCount = {
        DIGGER_TOOL : 1,
        SEARCH_TOOL : 3,
        TIME_TOOL : 1,
    };

    itemRewardRate: number = 30;    //某样道具不足时弹道具给与时的概率 百分之
    showRewardView(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function,isShare?:boolean){
        let rewardView = instantiate(this.rewardPrefab);
        rewardView.parent = director.getScene().getComponentInChildren(Canvas).node;
        rewardView.getComponent(RewardView).init(type,attrKey,count,cb1,cb2,isShare);
        rewardView.getComponent(ViewAction).open();
    }

    deal(){
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

export default Pregame;
