import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

@ccclass('GuideConfig')
export default class GuideConfig extends Component {
    static guideMissionData = [
        [1, 2, 5, 3, 4, 1, 2, 5],
        [1, 4, 2, 3, 5, 5, 2, 4],
        [3, 1, 1, 2, 2, 1, 4, 3],
        [1, 2, 2, 1, 2, 2, 1, 2],
        [1, 10000, 10000, 10000, 10000, 10000, 10000, 1],
        [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
        [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
        [10000, 10000, 10000, 10000, 10000, 10000, 10000, 10000],
    ];
}
