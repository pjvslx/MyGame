import Util = require("../../common/src/Util");

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
import Stone = require('./Stone');

@ccclass
class MapCreator extends cc.Component {
    static max_row:number = 0;
    static max_col:number = 0;

    static get_row_and_col_by_index(index:number){
        let row,col;
        if(index % this.max_col == 0){
            row = index / this.max_col;
            col = 0;
        }else{
            row = Math.floor(index / this.max_col);
            col = index % this.max_col;
        }
        return cc.v2(row,col);
    }

    static get_index_by_row_and_col(row,col){
        return row * this.max_col + col;
    }

    static createMap(max_row, max_col, cell_list, isInit:boolean = true){
        let map = [];
        this.max_row = max_row;
        this.max_col = max_col;

        for(let i = 0; i < max_row * max_col; i++){
            map[i] = 0;
        }

        let get_row_and_col_by_index = (index)=>{
            let row,col;
            if(index % max_col == 0){
                row = index / max_col;
                col = 0;
            }else{
                row = Math.floor(index / max_col);
                col = index % max_col;
            }
            return cc.v2(row,col);
        }

        let get_index_by_row_and_col = (row,col)=>{
            return row * max_col + col;
        }

        // --怎样生成当前二维数组的数值
        // --[[
        //         3
        //         4
        //     1,2[X]5,4
        //         1
        //         2
                
        //     如果关注点为X[row][col] 那么关注的相邻Cell应该为 左中右 下中上
        // ]]

        let get_value = (map,row,col)=>{
            //--越边界 直接返回0
            if(row < 0 || row > max_row - 1 || col < 0 || col > max_col - 1){
                return 0;
            }

            let index = get_index_by_row_and_col(row,col);
            return map[index];
        }

        let get_value_by_index = (map,index)=>{
            if(index < 0 || index > map.length - 1){
                return 0;
            }
            return map[index];
        }

        //--左  XXO
        let check_h_left = (row,col)=>{            
            let value1 = get_value(map,row,col - 2);
            let value2 = get_value(map,row,col - 1);
            if(value1 == value2){
                return value1;
            }else{
                return 0;
            }
        }

        // --横中 XOX
        let check_h_center = (row,col)=>{
            let value1 = get_value(map,row,col - 1);
            let value2 = get_value(map,row,col + 1);
            if(value1 == value2){
                return value1;
            }else{
                return 0;
            }
        }

        // -右 OXX
        let check_h_right = (row,col)=>{
            let value1 = get_value(map,row,col + 1);
            let value2 = get_value(map,row,col + 2);
            if(value1 == value2){
                return value1;
            }else{
                return 0;
            }
        }

        // --下 
        // --[[
        //     O
        //     X
        //     X
        // ]]
        let check_v_down = (row,col)=>{
            let value1 = get_value(map,row - 2,col);
            let value2 = get_value(map,row - 1,col);
            if(value1 == value2){
                return value1;
            }else{
                return 0;
            }
        }

        // --竖中
        // --[[
        //     X
        //     O
        //     X
        // ]]
        let check_v_center = (row,col)=>{
            let value1 = get_value(map,row - 1,col);
            let value2 = get_value(map,row + 1,col);
            if(value1 == value2){
                return value1;
            }else{
                return 0;
            }
        }

        // --上
        // --竖中
        // --[[
        //     X
        //     X
        //     O
        // ]]
        let check_v_up = (row,col)=>{
            let value1 = get_value(map,row + 1,col);
            let value2 = get_value(map,row + 2,col);
            if(value1 == value2){
                return value1;
            }else{
                return 0;
            }
        }

        let merge_result = (t1, value)=>{
            if(value == 0){
                return;
            }
            let exist = false;
            for(let i = 0; i < t1.length; i++){
                if(t1[i] == value){
                    exist = true;
                    break;
                }
            }

            if(!exist){
                t1.push(value);
            }
        }

        //--在t1中找出不存在于t2的元素
        let sub_value_list = (t1, t2)=>{
            let ret = [];
            for(let i = 0; i < t1.length; i++){
                let exist = false;
                for(let j = 0; j < t2.length; j++){
                    if(t1[i] == t2[j]){
                        exist = true;
                        break;
                    }
                }

                if(!exist){
                    ret.push(t1[i]);
                }
            }
            return ret;
        }

        let calc_exclude_value = (row,col)=>{
            let exclude_value = check_h_left(row,col);
            let t = [exclude_value];
            merge_result(t,check_h_center(row,col));
            merge_result(t,check_h_right(row,col));
            merge_result(t,check_v_down(row,col));
            merge_result(t,check_v_center(row,col));
            merge_result(t,check_v_up(row,col));
            return t;
        }

        let dump_map = (map)=>{
            for(let row = 0; row < max_row; row++){
                let s = '';
                for(let col = 0; col < max_col; col++){
                    let index = get_index_by_row_and_col(row,col);
                    let value = map[index];
                    if(col != 1){
                        s = s + ',' + value;
                    }else{
                        s = s + ',' + value;
                    }
                }
                console.log(s);
            }
        }

        console.log('begin time = ' + Util.getPerformNow());
        for(let i = 0; i < max_row * max_col; i++){
            let pos = get_row_and_col_by_index(i);
            let row = pos.x;
            let col = pos.y;
            if(isInit && (row == 0 || row == 1 || row == 2 || (row == 3 && col != 0 && col != 7)) ){
                map[i] = Stone.BASE_ID;
            }else{
                let exclude_value_list = calc_exclude_value(row,col);
                let sub_list = sub_value_list(cell_list,exclude_value_list);
                let random_value = sub_list[Util.random(sub_list.length) - 1];
                map[i] = random_value;
            }
        }
        console.log('end time = ' + Util.getPerformNow());
        dump_map(map);
        return map;
    }
}
export = MapCreator;
