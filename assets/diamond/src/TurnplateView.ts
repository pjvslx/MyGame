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

let priceConfig = [
    {type: 0, count: 5 },
    {type: 1, count: 20},
    {type: 0, count: 5 },
    {type: 0, count: 10},
    {type: 2, count: 10 },
    {type: 0, count: 10}
];

@ccclass
class TurnplateView extends cc.Component {
    @property(cc.Node)
    wheelSp: cc.Node = null;
    @property(cc.Node)
    btnStart: cc.Node = null;
    @property(cc.Node)
    btnAgain: cc.Node = null;
    @property(cc.Node)
    btnBack: cc.Node = null;
    @property(cc.Node)
    btnContinue: cc.Node = null;

    @property
    duration : number = 0;
    @property
    acc: number = 0;
    @property
    maxSpeed : number = 0;
    @property
    decAngle : number = 0;
    @property
    springback: boolean = false;
    targetID: number = 5;
    // 转盘状态 0：静止 1：加速 2：减速 匀速：3
    wheelState: number = 0;
    currentSpeed: number = 0;
    // 减速前旋转时间
    spinTime: number = 0;
    // 奖品数量
    priceCount: number = 0;
    // 修正默认角度
    defaultAngle: number = 0;
    // 每个齿轮的角度
    gearAngle: number = 0;
    // 最终结果指定的角度
    finalAngle: number = 0;
    // 匀速的最终角度
    constantAngel: number = 0;
    // 减速目标角度
    slowAngel: number = 0;

    onLoad(){
        this.addEvent();
    }

    addEvent(){
        this.btnStart.on('click',()=>{

        },this);
    }

    startRotation(targetID: number) {
        if (this.wheelState !== 0) return;
        this.decAngle = 2 * 360;  // 减速旋转两圈
        this.wheelState = 1;
        this.currentSpeed = 0;
        this.spinTime = 0;
        this.caculateFinalAngle(targetID);
    }

    caculateFinalAngle(targetID: number) {
        this.finalAngle = targetID * this.gearAngle + this.defaultAngle + this.decAngle;
        if (this.springback) {
            this.finalAngle += this.gearAngle;
        }
    }

    update(dt) {
        if (this.wheelState === 0) return;       
        if (this.wheelState === 1) {
            // cc.log('....加速, speed:' + this.currentSpeed);
            this.spinTime += dt;
            this.wheelSp.rotation += this.currentSpeed;
            if (this.currentSpeed <= this.maxSpeed) {
                this.currentSpeed += this.acc;
            } else {
                if (this.spinTime < this.duration) return;
                // cc.log('....开始匀速');
                this.maxSpeed = this.currentSpeed;
                this.wheelSp.rotation = this.wheelSp.rotation % 360;
                this.constantAngel = this.wheelSp.rotation + this.decAngle;
                this.wheelState = 3;
            }
        } else if (this.wheelState === 3) {
            // cc.log('.......匀速');
            this.wheelSp.rotation += this.currentSpeed;
            if (this.wheelSp.rotation >= this.constantAngel) {
                this.wheelSp.rotation = this.wheelSp.rotation % 360;
                this.wheelState = 2;
                this.slowAngel = this.finalAngle - this.wheelSp.rotation;
            }
        } else if (this.wheelState === 2) {
            // cc.log('......减速');
            var curRo = this.wheelSp.rotation;
            var deltaRo = this.finalAngle - curRo;
            this.currentSpeed = this.maxSpeed * (deltaRo / this.slowAngel) + 0.2; 
            this.wheelSp.rotation += this.currentSpeed;
            if (deltaRo <= 0) {
                // cc.log('....停止');
                this.wheelState = 0;
                this.wheelSp.rotation = this.finalAngle;
                // Util.playUIEffectByName('turnplateStopSound');
                // this.lightAnim.getComponent(sp.Skeleton).setAnimation(0, 'auto1', true);
                // this.priceBg.runAction(cc.repeat(cc.sequence(cc.fadeOut(0.1), cc.fadeIn(0.1)), 2));
                // this.priceBg.opacity = 255;

                // this.btnConfirm.active = true;

                if (this.springback) {
                    // 倒转一个齿轮
                    var act = cc.rotateBy(0.5, -this.gearAngle);
                    var seq = cc.sequence(
                        cc.delayTime(0.3),
                        act,
                        cc.callFunc(()=>{

                        })
                    );
                    this.wheelSp.runAction(seq);
                } else {
                    let type = priceConfig[this.targetID].type;
                    let count = priceConfig[this.targetID].count;
                    for (let i = 0; i < 5; i++) {
                        // let price = cc.instantiate(this.priceItem);
                        // price.getComponent(cc.Sprite).spriteFrame = this.priceFrames[type];
                        // price.parent = this.flyNode;

                        let time: number = 0.3 + i * 0.05;
                        let movePos: cc.Vec2 = this.calculateMoveOffset(i, 5);
                        let moveBy = cc.moveBy(time, movePos);
                        let fadeIn: cc.ActionInterval = cc.fadeIn(time);
                        let scaleTo: cc.ActionInterval = cc.scaleTo(time, 0.8);
                        let spawn: cc.FiniteTimeAction = cc.spawn(moveBy, fadeIn, scaleTo);
                        let delayTime = cc.delayTime(0.3);
                        let moveTo = cc.moveTo(0.8, cc.v2(570, 380));
                        let scaleTo1: cc.ActionInterval = cc.scaleTo(0.8, 1);
                        let spawn1: cc.FiniteTimeAction = cc.spawn(moveTo, scaleTo1);
                        let fadeOut = cc.fadeOut(0.1);

                        // price.runAction(cc.sequence(
                        //     spawn,
                        //     delayTime,
                        //     spawn1,
                        //     fadeOut,
                        //     cc.callFunc(()=>{
                        //         price.destroy();
                        //     })
                        // ));
                    }
                }
            }
        }
    }

    calculateMoveOffset(index: number, num: number): cc.Vec2 {
        let angle = index * (360 / num) * Math.PI / 180;
        let radius = Math.random() * (80 - 40 + 1 + index * 10) + 40;
        let offsetX = Math.cos(angle) * radius;
        let offsetY = Math.sin(angle) * radius;
        return cc.v2(offsetX, offsetY);
    }
}

export = TurnplateView;
