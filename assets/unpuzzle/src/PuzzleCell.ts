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
class PuzzleCell extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;
    @property(cc.Node)
    imgDir: cc.Node = null;

    num: number = null;
    row: number = null;
    col: number = null;

    dir: number = null;

    originPos: cc.Vec2 = new cc.Vec2();


    static DIR = {
        UP : 1,
        DOWN : 2,
        LEFT : 3,
        RIGHT : 4,
    }

    static CELL_SIZE = {
        width: 100,
        height: 100
    }

    static LOCK_TYPE = {
        CAVE : -1,
        NONE : 0,
        RAISE : 1
    }

    setPosition(pos:cc.Vec2){
        this.node.position = pos;
        this.originPos = pos;
    }

    onLoad(){

    }

    setNum(num:number){
        this.label.string = num.toString();
        this.num = num;
        this.label.node.active = false;
    }

    setDir(dir:number){
        this.dir = dir;
        if(dir == 0){
            this.imgDir.active = false;
        }else{
            if(dir == PuzzleCell.DIR.UP){
                this.imgDir.angle = 90;
            }else if(dir == PuzzleCell.DIR.DOWN){
                this.imgDir.angle = 270;
            }else if(dir == PuzzleCell.DIR.LEFT){
                this.imgDir.angle = 180;
            }else if(dir == PuzzleCell.DIR.RIGHT){
                this.imgDir.angle = 0;
            }
            this.imgDir.active = true;
        }
    }

    playRotationAction(){
        this.node.stopAllActions();
        let rotateBy = cc.rotateBy(1,720);
        let rep = cc.repeatForever(rotateBy);
        this.node.runAction(rep);
    }

    flyOut(dir:number,finishedCb?:Function){
        let targetPos;
        if(dir == PuzzleCell.DIR.UP){
            targetPos = cc.v2(this.node.x,cc.winSize.height/2 + PuzzleCell.CELL_SIZE.width * 2);
        }else if(dir == PuzzleCell.DIR.DOWN){
            targetPos = cc.v2(this.node.x,-cc.winSize.height/2 - this.node.getContentSize().height * 2);
        }else if(dir == PuzzleCell.DIR.LEFT){
            targetPos = cc.v2(-cc.winSize.width/2 - this.node.getContentSize().width * 2, this.node.y);
        }else if(dir == PuzzleCell.DIR.RIGHT){
            targetPos = cc.v2(cc.winSize.width/2 + this.node.getContentSize().width * 2, this.node.y);
        }

        this.playRotationAction();
        this.node.runAction(cc.moveTo(1,targetPos));
        this.node.runAction(cc.sequence(cc.moveTo(1,targetPos),cc.callFunc(()=>{
            if(finishedCb){
                finishedCb();
            }
        })));
    }
}

export = PuzzleCell;
