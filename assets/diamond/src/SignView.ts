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
import Player = require('./Player');
@ccclass
class SignView extends cc.Component {
    @property(cc.Node)
    btnClose: cc.Node = null;
    @property(cc.Node)
    signNodeList: cc.Node[] = [];
    @property(cc.Node)
    btnGet: cc.Node = null;
    @property(cc.Node)
    doubleMarkNode: cc.Node = null;
    @property(cc.SpriteFrame)
    markSpriteFrameList: cc.SpriteFrame[] = [];

    isDouble: boolean = true;

    onLoad(){
        this.addEvent();
        this.updateSignView();
        this.updateDoubleMark();
    }

    updateDoubleMark(){
        if(this.isDouble){
            this.doubleMarkNode.getComponent(cc.Sprite).spriteFrame = this.markSpriteFrameList[1];
        }else{
            this.doubleMarkNode.getComponent(cc.Sprite).spriteFrame = this.markSpriteFrameList[0];
        }
    }

    addEvent(){
        this.btnClose.on('click',()=>{
            Util.playClickSound();
            this.getComponent(ViewAction).close();
        },this);

        this.btnGet.on('click',()=>{
            Util.playClickSound();
            let signDataList:ISignData[] = Game.getInstance().player.getSignData();
            for(let i = 0; i < signDataList.length; i++){
                if(!signDataList[i].isSign){
                    let index = i;
                    let cb = ()=>{
                        signDataList[index].isSign = true;
                        signDataList[index].timestamp = new Date().getTime();
                        let count = signDataList[index].count;
                        count = 2 * count;
                        Game.getInstance().player.addAttr(signDataList[index].attrKey,count);
                        Game.getInstance().player.setSignData(signDataList);
                        Util.showToast(`获得${Player.ATTR_NAME[signDataList[index].attrKey]} x${count}`);
                        this.updateSignView();
                    };
                    if(!this.isDouble){
                        cb();
                    }else{
                        Game.getInstance().share.shareWechat(0,cb);
                    }
                    break;
                }
            }
        },this);

        this.doubleMarkNode.on(cc.Node.EventType.TOUCH_END,()=>{
            this.isDouble = !this.isDouble;
            this.updateDoubleMark();
        },this);
    }

    updateSignView(){
        let signDataList:ISignData[] = Game.getInstance().player.getSignData();
        signDataList = Game.getInstance().player.getSignData();
        console.log('signDataList = ' + JSON.stringify(signDataList));
        for(let i = 0; i < signDataList.length; i++){
            let signNode = this.signNodeList[i];
            let signItem:SignItem = signNode.getComponent(SignItem);
            signItem.setAttr(signDataList[i].attrKey);
            signItem.setNum(signDataList[i].count);
            signItem.setIsSign(signDataList[i].isSign);
        }

        this.btnGet.active = Game.getInstance().player.canSignToday();
    }
}
export = SignView;
