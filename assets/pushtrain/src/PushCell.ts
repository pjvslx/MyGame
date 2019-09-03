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

@ccclass
class PushCell extends cc.Component {
    @property(cc.Node)
    numNode:cc.Node = null;

    
    num: number = null;
    originPos: cc.Vec2 = new cc.Vec2();
    row: number = null;
    col: number = null;
    static CELL_SIZE = {
        width: 70,
        height: 70
    }

    setPosition(pos:cc.Vec2){
        this.node.position = pos;
        this.originPos = pos;
    }

    setNum(num:number){
        this.num = num;
        this.numNode.getComponent(cc.Label).string = num.toString();
    }

    setStr(str){
        this.numNode.getComponent(cc.Label).string = str;
        this.numNode.scale = 0.6;
    }
}

export = PushCell;