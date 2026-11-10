import { _decorator, AudioClip, AudioSource, Canvas, Component, director, instantiate, Label, Node, Prefab, sys, tween, UIOpacity, UITransform, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

interface ISettingConfig {
    isEffectEnabled,
    isMusicEnabled,
};
@ccclass('Util')
export default class Util extends Component {
    // Toast
    @property(Prefab)
    toastPrefab: Prefab = null;
    @property({ type: AudioClip })
    uiSound: AudioClip = null;

    toastQueue: Array<Node> = [];
    extraList: Node[] = [];
    isEffectEnabled: boolean = true;
    isMusicEnabled: boolean = true;
    private musicSource: AudioSource;
    private effectSource: AudioSource;
    private loopingEffect: AudioSource;

    static __instance: Util = null;

    onLoad(){
        Util.__instance = this;
        this.musicSource = this.node.addComponent(AudioSource);
        this.effectSource = this.node.addComponent(AudioSource);
        this.getSettingConfig();
    }

    static playClickSound(){
        Util.playAudioEffect(Util.__instance?.uiSound, false);
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
        sys.localStorage.setItem(key,value);
    }

    public static fetchData(key:string):string{
        return sys.localStorage.getItem(key);
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
        let p = v2(0, 0);
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
        const canvas = Util.getCanvasNode();
        if (!canvas || !this.toastPrefab) {
            return;
        }
        const toast = instantiate(this.toastPrefab);
        const text = toast.getChildByName('text');
        const textTransform = text.getComponent(UITransform);
        const toastTransform = toast.getComponent(UITransform);
        text.on(Node.EventType.SIZE_CHANGED, () => {
            if (textTransform.width > toastTransform.width - 170) {
                toastTransform.width = textTransform.width + 170;
            }
        });
        text.getComponent(Label).string = str;
        toast.parent = canvas;
        const isFilled = this.extraList.length > 0 || this.toastQueue.length > 3;
        const queue = isFilled ? this.extraList : this.toastQueue;
        toast.setPosition(0, -(toastTransform.height + 20) * (isFilled ? 3 : queue.length));
        queue.push(toast);
        if (isFilled && queue.length > 3) {
            queue.shift().destroy();
        }
        this.toastAction(toast, isFilled);
    }

    toastAction(toast: Node, isFilled: boolean = false): void {
        const opacity = toast.getComponent(UIOpacity) ?? toast.addComponent(UIOpacity);
        const queue = isFilled ? this.extraList : this.toastQueue;
        tween(toast)
            .to(0.1, { scale: v3(1.1, 1.1, 1) })
            .to(0.1, { scale: v3(1, 1, 1) })
            .delay(1)
            .parallel(
                tween<Node>().by(0.1, { position: v3(0, 100) }),
                tween(opacity).to(0.1, { opacity: 0 }),
            )
            .call(() => {
                const index = queue.indexOf(toast);
                if (index !== -1) {
                    queue.splice(index, 1);
                }
                toast.destroy();
            })
            .start();
    }

    static getCanvasNode(): Node | null {
        return director.getScene()?.getComponentInChildren(Canvas)?.node ?? null;
    }

    //@return [1~max]
    static random(max) {
        return Math.floor(Math.random() * Math.floor(max) + 1);
    }

    static isInRange(value:number,total:number){
        let randomValue = Util.random(total);
        if(randomValue <= value){
            return true;
        }
        return false;
    }

    static isWXPlatform(): boolean {
        return sys.platform === sys.Platform.WECHAT_GAME;
    }

    static postOpenDataMessage(payload: object): void {
        if (Util.isWXPlatform()) {
            globalThis['wx']?.getOpenDataContext?.()?.postMessage(payload);
        }
    }

    static getPerformNow() {
        if (Util.isWXPlatform()) {
            return window['wx'].getPerformance().now();
        } else {
            return new Date().getTime();
        }
    }

    static playAudioEffect(audio: AudioClip, isLoop: boolean) {
        const instance = Util.__instance;
        if (!audio || !instance?.isEffectEnabled) {
            return;
        }
        if (!isLoop) {
            instance.effectSource.playOneShot(audio);
            return;
        }
        const source = instance.loopingEffect ?? (instance.loopingEffect = instance.node.addComponent(AudioSource));
        source.clip = audio;
        source.loop = true;
        source.play();
    }

    static playAudioMusic(audio: AudioClip, isLoop: boolean){
        const instance = Util.__instance;
        if (!audio || !instance?.isMusicEnabled) {
            return;
        }
        instance.musicSource.stop();
        instance.musicSource.clip = audio;
        instance.musicSource.loop = isLoop;
        instance.musicSource.play();
    }

    static stopMusic(): void {
        Util.__instance?.musicSource.stop();
    }

    static pauseMusic(): void {
        Util.__instance?.musicSource.pause();
    }

    static resumeMusic(): void {
        if (Util.__instance?.isMusicEnabled) {
            Util.__instance.musicSource.play();
        }
    }

    static isMusicPlaying(): boolean {
        return Util.__instance?.musicSource.playing ?? false;
    }

    static isToday(date:Date){
        let today:Date = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        var offset = date.getTime() - today.getTime();
        return offset>=0&&offset<=1000*60*60*24;
    }

    static isSameDay(date1:Date,date2:Date){
        date2.setHours(0);
        date2.setMinutes(0);
        date2.setSeconds(0);
        date2.setMilliseconds(0);
        var offset = date1.getTime() - date2.getTime();
        return offset>=0&&offset<=1000*60*60*24;
    }

    //getWeek('2016-09-01');
    static getWeekStr(str) : string {
        // 将字符串转为标准时间格式
        str = Date.parse(str);
        str = new Date(str);
        // 先计算出该日期为第几周
        let week = Math.ceil(str.getDate()/7);
        let year = str.getFullYear();
        let month = str.getMonth() + 1;
        // 判断这个月前7天是周几，如果不是周一，则计入上个月
        if  (str.getDate() < 7) {
            if (str.getDay() !== 1) {
                week = 5;
                month = str.getMonth();
            }
        }
        // console.log(`${year}-${month}-${week}`);
        return `${year}-${month}-${week}`;
    }
}
