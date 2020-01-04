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
interface ISettingConfig {
    isEffectEnabled,
    isMusicEnabled,
};
@ccclass
class Util extends cc.Component {
    // Toast
    @property(cc.Prefab)
    toastPrefab: cc.Prefab = null;

    toastQueue: Array<cc.Node> = [];
    extraList: cc.Node[] = [];
    originalPos: cc.Vec2 = cc.v2(0, 0);
    isEffectEnabled: boolean = true;
    isMusicEnabled: boolean = true;

    static __instance: Util = null;

    onLoad(){
        Util.__instance = this;
        this.getSettingConfig();
    }

    static changeMusicSetting(){
        Util.__instance.isMusicEnabled = !Util.__instance.isMusicEnabled;
        Util.__instance.setSettingConfig();
    }

    static changeSoundSetting(){
        Util.__instance.isEffectEnabled = !Util.__instance.isEffectEnabled;
        Util.__instance.setSettingConfig();
    }

    public setSettingConfig() {
        let data: ISettingConfig = {
            isMusicEnabled: this.isMusicEnabled,
            isEffectEnabled: this.isEffectEnabled,
        };
        Util.saveData('SettingConfig', JSON.stringify(data));
    }

    public static saveData(key:string,value:string){
        cc.sys.localStorage.setItem(key,value);
    }

    public static fetchData(key:string):string{
        return cc.sys.localStorage.getItem(key);
    }

    public getSettingConfig() {
        let str: string = Util.fetchData('SettingConfig');
        console.log('SettingConfig = ', str);
        if (str) {
            let data: ISettingConfig = JSON.parse(str);
            this.isMusicEnabled = data.isMusicEnabled;
            this.isEffectEnabled = data.isEffectEnabled;
        }
    }

    static getAngleByPos(p1, p2) {
        let p = cc.v2(0, 0);
        p.x = p2.x - p1.x;
        p.y = p2.y - p1.y;
        let r = Math.atan2(p.y, p.x) * 180 / Math.PI;
        return r;
    }

    static deepCopy(source) {
        var result;
        (source instanceof Array) ? (result = []) : (result = {});

        for (var key in source) {
            result[key] = (typeof source[key] === 'object') ? this.deepCopy(source[key]) : source[key];
        }
        return result;
    }

    static showToast(str: string) {
        if (!Util.__instance) {
            return;
        }
        Util.__instance.showToast(str);
    }

    showToast(str: string, isPlayEffect = true) {
        // 初始化toast
        var toast = cc.instantiate(this.toastPrefab);
        var text = toast.getChildByName("text");
        text.getComponent(cc.Label).string = str;
        text.on('size-changed', () => {
            if (text.getContentSize().width > toast.getContentSize().width - 170) {
                toast.setContentSize(cc.size(text.getContentSize().width + 170, toast.getContentSize().height));
            }
        });
        toast.zIndex = 100;
        toast.parent = cc.Canvas.instance.node;

        if (this.extraList.length > 0 || this.toastQueue.length > 3) {
            this.extraList.push(toast);
            this.toastAction(toast, true);
            if (this.extraList.length === 1) {
                toast.position = cc.v2(0, 0 - (toast.height + 20) * 3);
                this.originalPos = toast.position;
            } else {
                toast.position = this.originalPos;
            }
            if (this.extraList.length > 3) {
                let outItem = this.extraList.shift();
                outItem.destroy();
            }
        } else {
            let i = 0
            if (this.toastQueue.length > 3) {
                i = 3;
            } else {
                i = this.toastQueue.length;
            }
            toast.position = cc.v2(0, 0 - (toast.height + 20) * i);
            this.toastQueue.push(toast);
            this.toastAction(toast, false);
        }
    }

    toastAction(toast: cc.Node, isFilled: boolean = false): void {
        let scale = cc.sequence(cc.scaleTo(0.1, 1.1), cc.scaleTo(0.1, 1));
        var moveBy = cc.moveBy(0.1, cc.v2(0, 100));
        var fadeTo = cc.fadeOut(0.1);
        var spawn = cc.spawn(moveBy, fadeTo);
        toast.runAction(cc.sequence(
            scale,
            cc.delayTime(1),
            spawn,
            cc.callFunc(() => {
                if (isFilled) {
                    this.extraList.shift().destroy();
                } else {
                    this.toastQueue.shift().destroy();
                }
            })
        ));
    }

    //@return [1~max]
    static random(max) {
        return Math.floor(Math.random() * Math.floor(max) + 1);
    }

    static isWXPlatform(): boolean {
        return cc.sys.platform == cc.sys.WECHAT_GAME;
    }

    static getPerformNow() {
        if (Util.isWXPlatform()) {
            return window['wx'].getPerformance().now();
        } else {
            return new Date().getTime();
        }
    }

    static playAudioEffect(audio: cc.AudioClip, isLoop: boolean) {
        if (!Util.__instance.isEffectEnabled) {
            return;
        }
        cc.audioEngine.playEffect(audio, isLoop);
    }

    static playAudioMusic(audio: cc.AudioClip, isLoop: boolean){
        if (!Util.__instance.isMusicEnabled) {
            return;
        }
        cc.audioEngine.playMusic(audio,isLoop);
    }
}

export = Util;
