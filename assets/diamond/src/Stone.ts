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
    @property(cc.Node)
    leftEdge: cc.Node;
    @property(cc.Node)
    rightEdge: cc.Node;
    @property(cc.Node)
    topEdge: cc.Node;
    @property(cc.Node)
    innerNode: cc.Node;
    value:number = null;
    row:number = null;
    col:number = null;

    // onLoad () {}

    start () {

    }

    setStoneId(id:number){
        this.value = id;
    }

    // update (dt) {}
}
export = Stone;
