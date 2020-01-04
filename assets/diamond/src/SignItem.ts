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
import Player = require('./Player');

@ccclass
class SignItem extends cc.Component {
    @property(cc.Node)
    iconNode: cc.Node = null;

    @property(cc.Node)
    countNode: cc.Node = null;

    @property(cc.Node)
    markNode: cc.Node = null;

    @property(cc.SpriteFrame)
    iconFrameList: cc.SpriteFrame[] = [];

    setAttr(attrKey:string){
        if(attrKey == Player.ATTR.DIGGER_TOOL){

        }else if(attrKey == Player.ATTR.SEARCH_TOOL){

        }else if(attrKey == Player.ATTR.TIME_TOOL){

        }
    }
}

export = SignItem;
