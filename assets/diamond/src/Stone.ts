import Util = require("../../common/src/Util");

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const {ccclass, menu, property} = cc._decorator;

@ccclass
@menu('diamond/Stone')
class Stone extends cc.Component {
    static BASE_ID:number = 10000;
    static TOP_ROW:number = 3;
    @property(cc.Node)
    leftEdge: cc.Node;
    @property(cc.Node)
    rightEdge: cc.Node;
    @property(cc.Node)
    topEdge: cc.Node;
    @property(cc.Node)
    stoneContent: cc.Node;
    @property(cc.Node)
    goldContent: cc.Node;
    @property(cc.SpriteFrame)
    stoneSpriteFrameList: cc.SpriteFrame[] = [];
    @property(cc.SpriteFrame)
    goldSpriteFrameList: cc.SpriteFrame[] = [];
    value:number = null;
    row:number = null;
    col:number = null;
    goldId:number = 0;

    // onLoad () {}

    start () {

    }

    setLeftEdgeVisible(isVisible:boolean){
        this.leftEdge.active = isVisible;
    }

    setRightEdgeVisible(isVisible:boolean){
        this.rightEdge.active = isVisible;
    }

    setTopEdgeVisible(isVisible:boolean){
        this.topEdge.active = isVisible;
    }

    setStoneId(id:number){
        if(id == 0){
            console.log('setStoneId = 0');
        }
        this.value = id;
        let index = this.value - Stone.BASE_ID;
        if(index != 0){
            this.stoneContent.active = true;
            this.stoneContent.getComponent(cc.Sprite).spriteFrame = this.stoneSpriteFrameList[index - 1];
        }else{
            this.stoneContent.active = false;
        }
    }

    setGoldId(goldId:number){
        this.goldId = goldId;
        if(this.goldId == 0){
            this.goldContent.active = false;
        }else{
            this.goldContent.active = true;
            this.goldContent.getComponent(cc.Sprite).spriteFrame = this.goldSpriteFrameList[goldId - 1];
        }
    }

    setRowCol(row:number,col:number){
        console.log('stone setRowCol row = ' + row + ' col = ' + col );
        this.row = row;
        this.col = col;
    }

    // update (dt) {}
}
export = Stone;
