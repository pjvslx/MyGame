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

import Util = require('./Util');
import DiamondGame = require('../../diamond/src/DiamondGame');
import Player = require('../../diamond/src/Player');
import Share = require('./Share');
import AdManager = require('./AdManager');
import NetworkManager = require('./NetworkManager');
import Guide = require('../../diamond/src/guide/Guide');
import Pregame = require('../../diamond/src/Pregame');
import DiamondConfig = require('../../diamond/src/DiamondConfig');

// var num = 100

// var num2 = num.toString("2")  //  "1100100"

// var num8 = num.toString("8")  // "144"
// var num16 = num.toString("16")  // "64"

// console.log( parseInt(num2,2) )  2转10进制输出: 100

// console.log( parseInt(num8 , 8) )  8转10进制: 100
// console.log( parseInt(num16 , 16) )  16转10进制: 100

@ccclass
class Game extends cc.Component {
    diamond: DiamondGame = null;
    player: Player = null;
    network: NetworkManager = null;
    guide: Guide = null;
    pregame: Pregame = null;
    private static _instance: Game = null;

    gNode:cc.Node = null;

    isPreloadScene: boolean = false;
    lastPreloadSceneName: string = '';
    addOnPreloadFunc: Function = null;

    isLoadScene: boolean = false;
    lastLoadSceneName: string = '';
    addOnLoadFunc: Function = null;

    maxGold: number = 0;
    share: Share = null;
    adManager: AdManager = null;

    static getInstance() {
        return this._instance;
    }

    onLoad(){
        // cc.debug.setDisplayStats(true);
        this.gNode = this.node;
        cc.game.addPersistRootNode(this.node);
        Game._instance = this;
        this.diamond = this.node.getComponent(DiamondGame);
        this.player = this.node.getComponent(Player);
        this.share = this.node.getComponent(Share);
        this.adManager = this.node.getComponent(AdManager);
        this.network = this.node.addComponent(NetworkManager);
        this.guide = this.node.getComponent(Guide);
        this.pregame = this.node.getComponent(Pregame);
        this.initRemoteConfig();
        // this.diamond.show();
        cc.director.loadScene('start');
        this.addException();
    }

    initRemoteConfig(){
        this.network.get(NetworkManager.HTTPS_URL + 'config/config.json',[],(res)=>{
            if(res == false){
                return;
            }
            for(let k in res){
                console.log(`k = ${k} v = ${res[k]}`);
                DiamondConfig.remoteConfig[k] = res[k];
            }
        });
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

    isShareHide(){
        return DiamondConfig.remoteConfig.isShareHide;
    }
}

export = Game;