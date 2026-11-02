import type { ExperimentPlan, ExperimentStatus } from "./types";

export const statusSteps: {id:ExperimentStatus;label:string;note:string}[] = [
 {id:"draft",label:"方案待确认",note:"仅生成草案，未下发"},{id:"running",label:"Mock 执行中",note:"合成事件持续回流"},
 {id:"review",label:"结果待复核",note:"冻结结果并分析偏差"},{id:"calibrated",label:"校准待确认",note:"候选版本等待人工批准"},
];
const presets: Record<string, Omit<ExperimentPlan,"strategyId"|"strategyName">> = {
 growth:{hypothesis:"更强权益与短交付可提升目标家庭试驾和下订，且增量利润足以覆盖权益投入。",audience:"近 90 天进入方案对比/到店阶段、预算 25–38 万且同意实验分析的合成家庭；排除投诉处理中与频控触顶家庭",treatment:"家庭级机会合并 + 新车型优先推荐 + 2.6 万 Mock 权益 + 3 周交付承诺",control:"维持个人线索分配 + 常规单车型推荐 + 基准权益与交付口径",regions:["澜州东区 · 虚构门店 A","青沐南区 · 虚构门店 B"],period:"4 周（1 周准备 + 2 周干预 + 1 周观察）",sampleSize:2400,variables:["权益强度","交付周期","家庭级频控","新车型推荐顺序"],roles:["实验负责人","区域运营","门店顾问","数据观察员","伦理与隐私复核人"],metrics:[],guardrails:[]},
 profit:{hypothesis:"聚焦高价值换购并收紧权益，可在不显著损害下订率的前提下提升增量利润。",audience:"车龄 ≥5 年、换购阶段、预算 30–45 万的授权合成家庭；排除高敏感投诉与近 7 日多次触达",treatment:"高价值家庭 SLA 承接 + 0.6 万 Mock 权益 + 家庭车型组合报价",control:"普通承接 + 统一权益 + 单车型报价",regions:["北辰西区 · 虚构门店 C","云港中心 · 虚构门店 D"],period:"5 周（1 周准备 + 3 周干预 + 1 周观察）",sampleSize:1800,variables:["目标家庭","SLA","权益强度","组合报价"],roles:["实验负责人","利润分析员","门店经理","顾问","伦理与隐私复核人"],metrics:[],guardrails:[]},
 balance:{hypothesis:"场景化双车型试驾与家庭机会合并，可兼顾组合销量、外部转化和利润，同时控制内部蚕食。",audience:"成长型家庭、到店/试驾阶段、至少两名共同决策成员的授权合成家庭",treatment:"家庭机会合并 + 双车型场景化对比试驾 + 1.6 万 Mock 权益 + 5 周交付",control:"个人线索 + 单车型常规试驾 + 基准权益",regions:["澜州东区 · 虚构门店 A","云港中心 · 虚构门店 D","栖霞北区 · 虚构门店 E"],period:"6 周（1 周准备 + 4 周干预 + 1 周观察）",sampleSize:3200,variables:["试驾组合","线索粒度","权益强度","销售动作"],roles:["实验负责人","组合经营经理","门店教练","顾问","数据观察员"],metrics:[],guardrails:[]},
 coverage:{hypothesis:"全家庭圈选与统一频控能扩大可服务家庭覆盖，并以可接受成本获得新增下订。",audience:"首购/增购/换购全类型、预算 20–38 万的授权合成家庭；按旅程阶段分层随机",treatment:"家庭级统一频控 + 产品组合化触达 + 2.0 万 Mock 权益",control:"个人级频控 + 单车型触达 + 基准权益",regions:["青沐南区 · 虚构门店 B","临海新区 · 虚构门店 F"],period:"4 周（1 周准备 + 2 周干预 + 1 周观察）",sampleSize:2800,variables:["目标圈选","频控粒度","产品组合","权益强度"],roles:["实验负责人","用户运营","门店经理","顾问","伦理与隐私复核人"],metrics:[],guardrails:[]},
};
const names:Record<string,string>={growth:"增长优先",profit:"利润优先",balance:"平衡经营",coverage:"用户覆盖"};
export function createPlan(id:string):ExperimentPlan { const p=presets[id]??presets.balance; return {...p,strategyId:id,strategyName:names[id]??names.balance,metrics:[
 {id:"testDrive",name:"增量试驾率",unit:"pp",expected:5.8,actual:4.6,favorable:"up"},{id:"order",name:"增量下订率",unit:"pp",expected:2.6,actual:1.8,favorable:"up"},
 {id:"portfolioSales",name:"组合销量",unit:"台",expected:186,actual:171,favorable:"up"},{id:"cannibalization",name:"内部蚕食",unit:"台",expected:28,actual:37,favorable:"down"},{id:"profit",name:"增量利润",unit:"万元",expected:920,actual:748,favorable:"up"}],guardrails:[
 {id:"complaints",name:"投诉率",unit:"%",threshold:1.2,actual:.8,favorable:"down"},{id:"contactFrequency",name:"家庭触达频次",unit:"次/7日",threshold:3,actual:2.7,favorable:"down"},
 {id:"benefitCost",name:"权益成本",unit:"万元",threshold:520,actual:496,favorable:"down"},{id:"storeLoad",name:"门店负载",unit:"%",threshold:85,actual:89,favorable:"down"}]}; }
