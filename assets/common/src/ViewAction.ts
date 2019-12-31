const {ccclass, property} = cc._decorator;

@ccclass
class ViewAction extends cc.Component {

    openLock:boolean = false;
    closeLock:boolean = false;
    @property(cc.Node)
    actNode: cc.Node = null;
    static DIRECTION = {
        RIGHT: 1,
        LEFT: 2,
        UP: 3,
        DOWN: 4,
    }

    open(cb?){
        if(this.openLock){
            return;
        }
        let node = this.actNode || this.node;
        this.node.active = true;
        node['originScale'] = node.scale;
        node.scale = 0.8 * node['originScale'];
        // node.opacity = 1; //千万不要设为0，会导致各种奇葩问题，比如你会看到个人中心不显示头像
        node.runAction(cc.sequence(
            // cc.spawn(
            //     cc.fadeIn(0.25),
            //     cc.scaleTo(0.25, node['originScale']).easing(cc.easeBackOut())
            // ),
            cc.scaleTo(0.25, node['originScale']).easing(cc.easeBackOut()),
            cc.delayTime(0.1),
            cc.callFunc(function() {
                if (cb) {
                    cb();
                }
            }, this)
        ));
        this.openLock = true;
    }

    hide() {
        let node = this.actNode || this.node;
        if (node['originScale'] === undefined) {
            node['originScale'] = node.scale;
        }
        node.scale = node['originScale'];
        // node.opacity = 255;
        node.runAction(cc.sequence(
            // cc.spawn(
            //     cc.fadeOut(0.25),
            //     cc.scaleTo(0.25, 0.8 * node['originScale']).easing(cc.easeBackIn())
            // ),
            cc.scaleTo(0.25, 0.8 * node['originScale']).easing(cc.easeBackIn()),
            cc.callFunc(function() {
                this.node.active = false;
            }, this)
        ));
    }

    close(cb?){
        if(this.closeLock){
            return;
        }
        let node = this.actNode || this.node;
        if (node['originScale'] === undefined) {
            node['originScale'] = node.scale;
        }
        node.scale = 1 * node['originScale'];
        node.opacity = 255;
        node.runAction(cc.sequence(
            // cc.spawn(
            //     cc.fadeOut(0.25),
            //     cc.scaleTo(0.25, 0.8 * node['originScale']).easing(cc.easeBackIn())
            // ),
            cc.scaleTo(0.25, 0.8 * node['originScale']).easing(cc.easeBackIn()),
            cc.callFunc(function() {
                if (cb) {
                    cb();
                }
                this.node.destroy();
            }, this)
        ));
        this.closeLock = true;
    }

    //带方向的打开 direction = LEFT 从左往右打开
    openTo(time, direction, cb) {
        if (this.openLock == true) {
            return;
        }

        direction = direction || ViewAction.DIRECTION.UP;
        time = time || 0.35;
        this.openLock = true;
        var size = cc.director.getWinSize();
        var offsetPos = cc.p(0, 0);
        if (direction == ViewAction.DIRECTION.RIGHT) {
            offsetPos = cc.p(size.width, 0);
        } else if (direction == ViewAction.DIRECTION.LEFT) {
            offsetPos = cc.p(-size.width, 0);
        } else if (direction == ViewAction.DIRECTION.DOWN) {
            offsetPos = cc.p(0, -size.height);
        } else if (direction == ViewAction.DIRECTION.UP) {
            offsetPos = cc.p(0, size.height);
        }
        let node = this.actNode || this.node;
        var originPos = node.position;
        node.position = cc.p(node.x + offsetPos.x, node.y + offsetPos.y);
        var moveTo = cc.moveTo(time, originPos);
        node.runAction(cc.sequence(
            moveTo,
            cc.callFunc(function() {
                this.openLock = false;
                if (cb) {
                    cb();
                }
            }.bind(this))
        ));
    }

    onCloseTo(){
        this.closeTo(0.35, ViewAction.DIRECTION.UP)
    }

    //带方向的关闭 time = LEFT 从右往左关闭 与openTo对应
    closeTo(time, direction) {
        if (this.closeLock == true || this.openLock == true) {
            return;
        }

        time = time || 0.5;
        direction = direction || ViewAction.DIRECTION.DOWN;
        this.closeLock = true;
        var offsetPos = cc.p(0, 0);
        var size = cc.director.getWinSize();
        if (direction == ViewAction.DIRECTION.LEFT) {
            offsetPos = cc.p(-size.width, 0);
        } else if (direction == ViewAction.DIRECTION.RIGHT) {
            offsetPos = cc.p(size.width, 0);
        } else if (direction == ViewAction.DIRECTION.UP) {
            offsetPos = cc.p(0, size.height);
        } else if (direction == ViewAction.DIRECTION.DOWN) {
            offsetPos = cc.p(0, -size.height);
        }
        let node = this.actNode || this.node;
        var moveTo = cc.moveTo(time, cc.p(node.x + offsetPos.x, node.y + offsetPos.y));
        node.runAction(cc.sequence(
            moveTo,
            cc.callFunc(function() {
                this.node.destroy();
            }, this)
        ));
    }
}

export = ViewAction;