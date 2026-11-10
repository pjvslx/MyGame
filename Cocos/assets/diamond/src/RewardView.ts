import { Button, Component, Label, Node, Sprite, SpriteFrame, _decorator } from 'cc';
import Player from "./Player";
import Game from "../../common/src/Game";

import ViewAction from "../../common/src/ViewAction";
import EventConfig from '../../common/src/EventConfig';
import Util from '../../common/src/Util';

const { ccclass, property } = _decorator;

@ccclass('RewardView')
class RewardView extends Component {
    static TYPE = {
        NORMAL : 0,
        DOUBLE : 1,
    }
    @property(Node)
    iconNode: Node = null;
    @property(Node)
    normalNode: Node = null;
    @property(Node)
    doubleNode: Node = null;
    @property(Node)
    countText: Node = null;

    @property(Button)
    btnGet1: Button = null;
    @property(Button)
    btnGiveup1: Button = null;
    @property(Button)
    btnGet2: Button = null;
    @property(Button)
    btnDouble2: Button = null;

    @property([SpriteFrame])
    iconFrameList: SpriteFrame[] = [];

    @property(SpriteFrame)
    normalShareSpriteFrame: SpriteFrame = null;
    @property(SpriteFrame)
    normalVideoSpriteFrame: SpriteFrame = null;
    @property(SpriteFrame)
    doubleShareSpriteFrame: SpriteFrame = null;
    @property(SpriteFrame)
    doubleVideoSpriteFrame: SpriteFrame = null;

    attrKey: string = '';
    count: number = 0;
    clickCb1: Function = null;
    clickCb2: Function = null;

    start () {
        this.addEvent();
    }

    init(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function,isShare?:boolean){
        this.normalNode.active = (type == RewardView.TYPE.NORMAL);
        this.doubleNode.active = (type == RewardView.TYPE.DOUBLE);
        this.attrKey = attrKey;
        this.count = count;
        this.clickCb1 = cb1;
        this.clickCb2 = cb2;
        this.countText.getComponent(Label).string = `x${count}`;
        if(this.attrKey == Player.ATTR.SEARCH_TOOL){
            this.iconNode.getComponent(Sprite).spriteFrame = this.iconFrameList[0];
        }else if(this.attrKey == Player.ATTR.DIGGER_TOOL){
            this.iconNode.getComponent(Sprite).spriteFrame = this.iconFrameList[1];
        }else if(this.attrKey == Player.ATTR.TIME_TOOL){
            this.iconNode.getComponent(Sprite).spriteFrame = this.iconFrameList[2];
        }

        if(isShare == true){
            this.btnGet1.node.getChildByName('Background').getComponent(Sprite).spriteFrame = this.normalShareSpriteFrame;
            this.btnDouble2.node.getChildByName('Background').getComponent(Sprite).spriteFrame = this.doubleShareSpriteFrame;
        }else{
            this.btnGet1.node.getChildByName('Background').getComponent(Sprite).spriteFrame = this.normalVideoSpriteFrame;
            this.btnDouble2.node.getChildByName('Background').getComponent(Sprite).spriteFrame = this.doubleVideoSpriteFrame;
        }
    }

    addEvent(){
        let adManager = Game.getInstance().adManager;
        this.btnGet1.node.on('click',()=>{
            if(adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            if(this.clickCb1){
                this.clickCb1();
            }
            // this.getComponent(ViewAction).close();
        },this);

        this.btnGiveup1.node.on('click',()=>{
            if(adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            if(this.clickCb2){
                this.clickCb2();
            }
            this.getComponent(ViewAction).close();
        },this);

        this.btnGet2.node.on('click',()=>{
            if(adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            if(this.clickCb1){
                this.clickCb1();
            }
            this.getComponent(ViewAction).close();
        },this);

        this.btnDouble2.node.on('click',()=>{
            if(adManager.isVideoPlaying){
                return;
            }
            Util.playClickSound();
            if(this.clickCb2){
                this.clickCb2();
            }
            // this.getComponent(ViewAction).close();
        },this);
        Game.getInstance().gNode.on(EventConfig.EVT_DIAMOND_CLOSE_REWARDVIEW,(isEnterGame)=>{
            this.getComponent(ViewAction).close(()=>{
                if(isEnterGame){
                    Game.getInstance().diamond.show();
                }
            });
        },this);
    }
    // update (dt) {}

    removeEvent(){
        Game.getInstance().gNode.targetOff(this);
    }

    onDestroy(){
        this.removeEvent();
    }
}
export default RewardView;
