import type StoneRate from './StoneRate';
import type GoldRate from './GoldRate';
interface SingleDepthData{
    depthId:number,
    stoneRateList:StoneRate[],
    goldRateList:GoldRate[],
}
export default SingleDepthData;
