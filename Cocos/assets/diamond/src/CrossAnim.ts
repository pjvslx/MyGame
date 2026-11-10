import { Component, Node, _decorator, sp, tween } from 'cc';
import Diamond from './Diamond';

const { ccclass, property } = _decorator;
@ccclass('CrossAnim')
class CrossAnim extends Component {
    @property(Node)
    vertNode: Node = null;
    @property(Node)
    horiNode: Node = null;

    setPos(row:number,col:number){
        const animation = 'shizbaoz';
        this.vertNode.getComponent(sp.Skeleton).setToSetupPose();
        this.vertNode.getComponent(sp.Skeleton).setAnimation(0, animation, true);
        this.horiNode.getComponent(sp.Skeleton).setToSetupPose();
        this.horiNode.getComponent(sp.Skeleton).setAnimation(0, animation, true);
        this.horiNode.setPosition(360, (row + 0.5) * Diamond.SIZE.height);
        this.vertNode.setPosition((col + 0.5) * Diamond.SIZE.width, 360);
    }

    play(time?:number,cb?:Function){
        tween(this.node)
            .delay(time ?? 0)
            .call(() => {
                this.node.active = false;
                cb?.();
            })
            .start();
    }
}

export default CrossAnim;
