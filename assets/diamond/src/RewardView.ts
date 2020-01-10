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

    attrKey: string = '';
    count: number = 0;
    clickCb1: Function = null;
    clickCb2: Function = null;

    start () {
        this.addEvent();
    }

    init(type:number,attrKey:string,count:number,cb1?:Function,cb2?:Function){
        let Player = require("./Player");
        this.normalNode.active = (type == RewardView.TYPE.NORMAL);
        this.doubleNode.active = (type == RewardView.TYPE.DOUBLE);
        this.attrKey = attrKey;
        this.count = count;
        this.clickCb1 = cb1;
        this.clickCb2 = cb2;
        this.countText.string = `x${count}`;
        if(this.attrKey == Player.ATTR.SEARCH_TOOL){
            this.iconNode.getComponent(cc.Sprite).spriteFrame = this.iconFrameList[0];
        }else if(this.attrKey == Player.ATTR.DIGGER_TOOL){
            this.iconNode.getComponent(cc.Sprite).spriteFrame = this.iconFrameList[1];
        }else if(this.attrKey == Player.ATTR.TIME_TOOL){
            this.iconNode.getComponent(cc.Sprite).spriteFrame = this.iconFrameList[2];
        }
    }

    addEvent(){
        this.btnGet1.node.on('click',()=>{
            if(this.clickCb1){
                this.clickCb1();
            }
            this.getComponent(ViewAction).close();
        },this);

        this.btnGiveup1.node.on('click',()=>{
            if(this.clickCb2){
                this.clickCb2();
            }
            this.getComponent(ViewAction).close();
        },this);

        this.btnGet2.node.on('click',()=>{
            if(this.clickCb1){
                this.clickCb1();
            }
            this.getComponent(ViewAction).close();
        },this);

        this.btnDouble2.node.on('click',()=>{
            if(this.clickCb2){
                this.clickCb2();
            }
            this.getComponent(ViewAction).close();
        },this);
    }
    // update (dt) {}
}
export = RewardView;
