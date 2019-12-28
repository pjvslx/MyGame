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
import Diamond = require('./Diamond');
@ccclass
class CrossAnim extends cc.Component {
    @property(cc.Node)
    vertNode: cc.Node;
    @property(cc.Node)
    horiNode: cc.Node;

    setPos(row:number,col:number){
        this.vertNode.getComponent(sp.Skeleton).setToSetupPose();
        this.vertNode.getComponent(sp.Skeleton).setAnimation(0,'zhizbaoz1',true);
        this.horiNode.getComponent(sp.Skeleton).setToSetupPose();
        this.horiNode.getComponent(sp.Skeleton).setAnimation(0,'zhizbaoz1',true);
        this.horiNode.position = cc.v2(360,(row + 0.5) * Diamond.SIZE.height);
        this.vertNode.position = cc.v2((col + 0.5) * Diamond.SIZE.width,360);
    }

    play(time?:number,cb?:Function){
        let delay = cc.delayTime(time);
        this.node.runAction(cc.sequence(
            delay,
            cc.callFunc(()=>{
                this.node.active = false;
                if(cb){
                    cb();
                }
            })
        ));
    }
}

export = CrossAnim;
