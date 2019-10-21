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

import Puzzle = require('../../unpuzzle/src/Puzzle');
import PushTrain = require('../../pushtrain/src/PushTrain');
import Util = require('./Util');
import MapCreator = require('../../diamond/src/MapCreator');
import DiamondGame = require('../../diamond/src/DiamondGame');

enum STORAGE_KEY {
    'HEART',
    'LAST_DAY',
    'TODAY'
}

@ccclass
class Game extends cc.Component {
    puzzle:Puzzle = null;
    pushTrain: PushTrain = null;
    diamond: DiamondGame = null;
    private static _instance: Game = null;

    gNode:cc.Node = null;

    isPreloadScene: boolean = false;
    lastPreloadSceneName: string = '';
    addOnPreloadFunc: Function = null;

    isLoadScene: boolean = false;
    lastLoadSceneName: string = '';
    addOnLoadFunc: Function = null;

    heartNum: number = 0;
    originHeartNum: number = 3;
    fateList: {[key:number]: string[]} = null;

    // var num = 100

    // var num2 = num.toString("2")  //  "1100100"

    // var num8 = num.toString("8")  // "144"
    // var num16 = num.toString("16")  // "64"

    // console.log( parseInt(num2,2) )  2转10进制输出: 100

    // console.log( parseInt(num8 , 8) )  8转10进制: 100
    // console.log( parseInt(num16 , 16) )  16转10进制: 100

    static getInstance() {
        return this._instance;
    }

    onLoad(){
        this.gNode = this.node;
        cc.game.addPersistRootNode(this.node);
        Game._instance = this;
        this.puzzle = this.node.addComponent(Puzzle);
        this.pushTrain = this.node.addComponent(PushTrain);
        this.diamond = this.node.getComponent(DiamondGame);
        this.diamond.show();
        // this.puzzle.initMissionData();
        // this.puzzle.show();
        // this.pushTrain.show();
        // this.addException();
        // this.initPlayerData();
    }

    initPlayerData(){
        //初始化体力心
        let str: string = cc.sys.localStorage.getItem(STORAGE_KEY.HEART);
        if(!str){
            this.heartNum = this.originHeartNum;
        }
    }

    addException(){
        if(cc.sys.isBrowser) {
            window.onerror = function (errorMessage, file, line, message, error) {
                let exception = {};
                exception['errorMessage'] = errorMessage;
                exception['file'] = file;
                exception['line'] = line;
                exception['message'] = message;
                exception['error'] = error;
                if (window['exception'] != JSON.stringify(exception)) {
                    window['exception'] = JSON.stringify(exception);
                    Util.showToast('js error');
                }
            };
        }
    }

    preloadScene(sceneName:string,onProgressCb:Function,onLaunchCb:Function){
        this.lastPreloadSceneName = sceneName;
        this.isPreloadScene = true;
        cc.director.preloadScene(sceneName, (completeCount: number,totalCount: number)=>{
            if(onProgressCb){
                onProgressCb(completeCount,totalCount);
            }
        }, () => {
            this.isPreloadScene = false;
            this.lastLoadSceneName = '';
            if(onLaunchCb){
                onLaunchCb();
            }
            if(this.addOnPreloadFunc){
                this.addOnPreloadFunc();
                this.addOnPreloadFunc = null;
            }
        });
    }

    loadScene(sceneName:string,onLaunchCb:Function){
        this.lastLoadSceneName = sceneName;
        this.isLoadScene = true;
        cc.director.loadScene(sceneName,()=>{
            if(onLaunchCb){
                onLaunchCb();
            }
            this.lastLoadSceneName = '';
            this.isLoadScene = false;
        });
    }

    enterPushScene(fateType:number){
        this.pushTrain.currentFateType = fateType;
        this.pushTrain.show();
    }
}

export = Game;