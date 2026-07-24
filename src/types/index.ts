export type PrivateCalculateType ={
    calculateTypeId: string, // 隐私计算类型id
    calculateType: string, // 隐私计算类型
    function:any // 隐私计算函数
}

export type DataRequestTask = {
    taskId: string, // 数据请求任务id
    privateCalculateType: PrivateCalculateType, // 隐私计算类型
    toProcess: any // 结果数据保存到的目标Process
}

export type PushData ={
    taskId: string, // 数据请求任务id
    data: any // 推送的数据
}