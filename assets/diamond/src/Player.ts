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
class Player extends cc.Component {
    static STORAGE_KEY = {
        MAX_GOLD : 'MAX_GOLD'
    }
    maxScore: number = 0;
    onLoad(){

    }

    init(){
        
    }

    initMaxScore(){
        let str: string = cc.sys.localStorage.getItem(Player.STORAGE_KEY.MAX_GOLD);
        if(!str){
            this.maxScore = -1;
        }else{
            this.maxScore = parseInt(str);
        }
    }

    setMaxScore(score:number){
        if(score <= this.maxScore){
            return;
        }
        this.maxScore = this.maxScore;
        cc.sys.localStorage.setItem(Player.STORAGE_KEY.MAX_GOLD,`${score}`);
    }
}

export = Player;
