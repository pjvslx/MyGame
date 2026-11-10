import { Component, Node, Sprite, SpriteFrame, _decorator } from 'cc';
import Util from "../../common/src/Util";

const { ccclass, menu, property } = _decorator;

@ccclass('Stone')
@menu('diamond/Stone')
class Stone extends Component {
    static BASE_ID:number = 10000;
    static TOP_ROW:number = 3;
    static GOLD_ID = {
        GOLD_S : 1,
        GOLD_M : 2,
        GOLD_L : 3,
        FUDAI : 4,
        HONGBAO : 5,
        LAN : 6,
        MEICHAO : 7,
        ZI : 8
    };
    //普通无法消除 必须炸弹炸的
    static SPECIAL_STONE_ID_LIST = [10004];
    @property(Node)
    leftEdge: Node = null;
    @property(Node)
    rightEdge: Node = null;
    @property(Node)
    topEdge: Node = null;
    @property(Node)
    stoneContent: Node = null;
    @property(Node)
    goldContent: Node = null;
    @property([SpriteFrame])
    stoneSpriteFrameList: SpriteFrame[] = [];
    @property([SpriteFrame])
    goldSpriteFrameList: SpriteFrame[] = [];
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
        this.value = id;
        let index = this.value - Stone.BASE_ID;
        if(index != 0){
            this.stoneContent.active = true;
            this.stoneContent.getComponent(Sprite).spriteFrame = this.stoneSpriteFrameList[index - 1];
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
            this.goldContent.getComponent(Sprite).spriteFrame = this.goldSpriteFrameList[goldId - 1];
        }
    }

    setRowCol(row:number,col:number){
        this.row = row;
        this.col = col;
    }

    isSpecialStone(){
        if(Stone.SPECIAL_STONE_ID_LIST.indexOf(this.value) != -1){
            return true;
        }
        return false;
    }

    // update (dt) {}
}
export default Stone;
