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
import ViewAction = require('../../common/src/ViewAction');
import Game = require('../../common/src/Game');
import ISignData = require('./ISignData');
import SignItem = require('./SignItem');
import Util = require('../../common/src/Util');
@ccclass
class SignView extends cc.Component {
    @property(cc.Node)
    btnClose: cc.Node = null;
    @property(cc.Node)
    signNodeList: cc.Node[] = [];
    @property(cc.Node)
    btnGet: cc.Node = null;

    onLoad(){
        this.addEvent();
        this.updateSignView();
    }

    addEvent(){
        this.btnClose.on('click',()=>{
            this.getComponent(ViewAction).close();
        },this);

        this.btnGet.on('click',()=>{
            let signDataList:ISignData[] = Game.getInstance().player.getSignData();
            for(let i = 0; i < signDataList.length; i++){
                if(!signDataList[i].isSign){
                    signDataList[i].isSign = true;
                    signDataList[i].timestamp = new Date().getTime();
                    Game.getInstance().player.addAttr(signDataList[i].attrKey,signDataList[i].count);
                    Game.getInstance().player.setSignData(signDataList);
                    this.updateSignView();
                    break;
                }
            }
        },this);
    }

    updateSignView(){
        let signDataList:ISignData[] = Game.getInstance().player.getSignData();
        let isAllSign = Game.getInstance().player.isAllSign();
        if(isAllSign){
            //全部签完 要看最后一天跟今天是不是同一天 是的话不能签
            let lastSignData = signDataList[6];
            let signDate = new Date(lastSignData.timestamp);
            if(!Util.isSameDay(signDate,new Date())){
                Game.getInstance().player.resetSign();
            }
        }
        signDataList = Game.getInstance().player.getSignData();
        console.log('signDataList = ' + JSON.stringify(signDataList));
        for(let i = 0; i < signDataList.length; i++){
            let signNode = this.signNodeList[i];
            let signItem:SignItem = signNode.getComponent(SignItem);
            signItem.setAttr(signDataList[i].attrKey);
            signItem.setNum(signDataList[i].count);
            signItem.setIsSign(signDataList[i].isSign);
        }

        this.btnGet.active = true;
        for(let i = signDataList.length - 1; i >= 0; i--){
            //找出最后一个签到的 不是今天 说明可以签
            if(signDataList[i].isSign){
                if(Util.isSameDay(new Date(signDataList[i].timestamp),new Date())){
                    this.btnGet.active = false;
                }
                break;
            }
        }
    }
}
export = SignView;
