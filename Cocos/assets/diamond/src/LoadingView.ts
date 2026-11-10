import { Component, _decorator, director } from 'cc';
const { ccclass } = _decorator;
@ccclass('LoadingView')
class LoadingView extends Component {
    start(){
        director.loadScene("init");
    }
}
export default LoadingView;
