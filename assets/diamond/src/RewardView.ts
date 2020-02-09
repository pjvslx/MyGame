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

import ViewAction = require("../../common/src/ViewAction");
import EventConfig = require('../../common/src/EventConfig');
import Util = require('../../common/src/Util');

@ccclass
class RewardView extends cc.Component {
    static TYPE = {
        NORMAL : 0,
        DOUBLE : 1,
    }
    @property(cc.Node)
    iconNode: cc.Node = null;
    @property(cc.Node)
    normalNode: cc.Node = null;
    @property(cc.Node)
    doubleNode: cc.Node = null;
    @property(cc.Node)
    countText: cc.Label = null;

    @property(cc.Button)
    btnGet1: cc.Button = null;
    @property(cc.Button)
    btnGiveup1: cc.Button = null;
    @property(cc.Button)
    btnGet2: cc.Button = null;
    @property(cc.Button)
    btnDouble2: cc.Button = null;

    @property(cc.SpriteFrame)
    iconFrameList: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    normalShareSpriteFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    normalVideoSpriteFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    doubleShareSpriteFrame: cc.SpriteFrame = null;
    @property(cc.SpriteFrame)
    doubleVideoSpriteFrame: cc.SpriteFrame = null;

    attrKey: string = '';
    count: number = 0;
    clickCb1: Function = null;
    clickCb2: Function = null;

    start () {
        this.addEvent();
    }

    init(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function,isShare?:boolean){
        let Player = require("./Player");
        this.normalNode.active = (type == RewardView.TYPE.NORMAL);
        this.doubleNode.active = (type == RewardView.TYPE.DOUBLE);
        this.attrKey = attrKey;
        this.count = count;
        this.clickCb1 = cb1;
        this.clickCb2 = cb2;
        this.countText.getComponent(cc.Label).string = `x${count}`;
        if(this.attrKey == Player.ATTR.SEARCH_TOOL){
            this.iconNode.getComponent(cc.Sprite).spriteFrame = this.iconFrameList[0];
        }else if(this.attrKey == Player.ATTR.DIGGER_TOOL){
            this.iconNode.getComponent(cc.Sprite).spriteFrame = this.iconFrameList[1];
        }else if(this.attrKey == Player.ATTR.TIME_TOOL){
            this.iconNode.getComponent(cc.Sprite).spriteFrame = this.iconFrameList[2];
        }

        if(isShare == true){
            this.btnGet1.node.getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.normalShareSpriteFrame;
            this.btnDouble2.node.getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.doubleShareSpriteFrame;
        }else{
            this.btnGet1.node.getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.normalVideoSpriteFrame;
            this.btnDouble2.node.getChildByName('Background').getComponent(cc.Sprite).spriteFrame = this.doubleVideoSpriteFrame;
        }
    }

    addEvent(){
        let Game = require("../../common/src/Game");
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
        let Game = require("../../common/src/Game");
        Game.getInstance().gNode.targetOff(this);
    }

    onDestroy(){
        this.removeEvent();
    }
}
export = RewardView;
