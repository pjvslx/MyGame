import { _decorator, Component } from 'cc';
import EventConfig from '../../../common/src/EventConfig';
import Game from '../../../common/src/Game';

const { ccclass } = _decorator;

@ccclass('GuideFocus')
export default class GuideFocus extends Component {
    onDestroy() {
        Game.getInstance()?.gNode?.emit(EventConfig.EVT_DIAMOND_FOCUS_DESTROY, this.node);
    }
}
