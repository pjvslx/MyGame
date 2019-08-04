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

    num: number = null;
    row: number = null;
    col: number = null;


    static DIR = {
        UP : 1,
        RIGHT : 2,
        DOWN : 3,
        LEFT : 4,
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

    dirLockMap: { [k:string]:number } = {};

    onLoad(){
        this.dirLockMap[PuzzleCell.DIR.UP] = PuzzleCell.LOCK_TYPE.NONE;
        this.dirLockMap[PuzzleCell.DIR.RIGHT] = PuzzleCell.LOCK_TYPE.NONE;
        this.dirLockMap[PuzzleCell.DIR.DOWN] = PuzzleCell.LOCK_TYPE.NONE;
        this.dirLockMap[PuzzleCell.DIR.LEFT] = PuzzleCell.LOCK_TYPE.NONE;
    }

    setNum(num:number){
        this.label.string = num.toString();
        this.num = num;
    }
}

export = PuzzleCell;
