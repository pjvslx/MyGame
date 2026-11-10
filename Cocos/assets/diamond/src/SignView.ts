import { Component, Node, Sprite, SpriteFrame, _decorator } from 'cc';
import ViewAction from '../../common/src/ViewAction';
import Game from '../../common/src/Game';
import type ISignData from './ISignData';
import SignItem from './SignItem';
import Util from '../../common/src/Util';
import Player from './Player';

const { ccclass, property } = _decorator;
@ccclass('SignView')
class SignView extends Component {
    @property(Node)
    btnClose: Node = null;
    @property([Node])
    signNodeList: Node[] = [];
    @property(Node)
    btnGet: Node = null;
    @property(Node)
    doubleMarkNode: Node = null;
    @property([SpriteFrame])
    markSpriteFrameList: SpriteFrame[] = [];

    isDouble: boolean = true;

    onLoad(){
        this.addEvent();
        this.updateSignView();
        this.updateDoubleMark();
    }

    updateDoubleMark(){
        if(this.isDouble){
            this.doubleMarkNode.getComponent(Sprite).spriteFrame = this.markSpriteFrameList[1];
        }else{
            this.doubleMarkNode.getComponent(Sprite).spriteFrame = this.markSpriteFrameList[0];
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

        this.doubleMarkNode.on(Node.EventType.TOUCH_END,()=>{
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
export default SignView;
