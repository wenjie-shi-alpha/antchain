package com.antgroup.antchain.fastdf.dataproxy.manager.connector.api

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.antgroup.antchain.idata.rest.component.common.data.AbstractRestApiDataFetchAdaptor
import com.antgroup.antchain.idata.rest.component.common.model.FetchDataResultBO
import com.antgroup.antchain.idata.rest.component.common.model.RestApiDataSourceConfigBO
import com.antgroup.antchain.fastdf.dataproxy.manager.connector.api.relateObject.DatasetMetaTableSchemaFieldTypeEnum
import com.antgroup.antchain.fastdf.dataproxy.manager.connector.api.relateObject.ApiDatasetResponse
import com.antgroup.antchain.fastdf.dataproxy.manager.connector.api.relateObject.DatasetTableSchemaFieldData
import lombok.AllArgsConstructor
import lombok.Builder
import lombok.Data
import lombok.NoArgsConstructor
import okhttp3.*
import org.apache.commons.lang3.ObjectUtils

import javax.validation.constraints.NotBlank

/**
 * API数据源模板
 */
class DatasetDemo extends AbstractRestApiDataFetchAdaptor<DatasetRequest, ApiDatasetResponse> {

    DatasetDemo(OkHttpClient client, RestApiDataSourceConfigBO config) {
        super(client, config)
    }

    @Override
    Request.Builder createNewCall(DatasetRequest validatedCondition, String token) throws Exception {

        String url = 'https://qgzvkongdjqiiamzbbts.supabase.co/functions/v1/request_process_data'
        // 响应结构
        // {
        //   "value": [
        //     20
        //   ]
        // }

        // Create a JSON object for the request body
        JSONObject requestBody = new JSONObject()
        if (!ObjectUtils.isEmpty(validatedCondition)) {
            if (!ObjectUtils.isEmpty(validatedCondition.getId())) {
                requestBody.put('id', validatedCondition.getId())
            }
            if (!ObjectUtils.isEmpty(validatedCondition.getVersion())) {
                requestBody.put('version', validatedCondition.getVersion())
            }
            if (!ObjectUtils.isEmpty(validatedCondition.getDataSetInternalID())) {
                // Changed parameter name to camelCase to match common API conventions
                requestBody.put('dataSetInternalID', validatedCondition.getDataSetInternalID())
            }
        }

        RequestBody body = RequestBody.create(MediaType.parse('application/json'),
                requestBody.toJSONString());

        // Create the request with required headers
        return new Request.Builder()
                .url(url)
                .post(body)
                .addHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnenZrb25nZGpxaWlhbXpiYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNjUyMzQsImV4cCI6MjA1NTk0MTIzNH0.PsZIcjAqexpqIg-91twpKjALyw9big6Bn4WRLLoCzTo')
                .addHeader('Content-Type', 'application/json')
                .addHeader('x_key', '1qaZ_Xsw2_Mju7');
    }

    @Override
    protected FetchDataResultBO<ApiDatasetResponse> parseHttpResponse(DatasetRequest apiDatasetRequest, String body) {

        // 解析返回的JSON结构
        JSONObject res = JSONObject.parseObject(body)
        JSONArray data = res.getJSONArray('value')
        ApiDatasetResponse response = new ApiDatasetResponse()
        List<List<DatasetTableSchemaFieldData>> dataList = new ArrayList<>()
        List<DatasetTableSchemaFieldData> datasetTableSchemaFieldDataList = new ArrayList<>()

        // 处理value数组中的每个元素
        for (int i = 0; i < data.size(); i++) {                
            DatasetTableSchemaFieldData datasetTableSchemaFieldData = new DatasetTableSchemaFieldData()
            datasetTableSchemaFieldData.setFieldName("value_" + i)
            datasetTableSchemaFieldData.setFieldType(DatasetMetaTableSchemaFieldTypeEnum.DOUBLE)
            datasetTableSchemaFieldData.setCurrentType(DatasetMetaTableSchemaFieldTypeEnum.DOUBLE)
            datasetTableSchemaFieldData.setCurrentValue(data.get(i))
            datasetTableSchemaFieldDataList.add(datasetTableSchemaFieldData)
        }
        
        dataList.add(datasetTableSchemaFieldDataList)
        response.setDataList(dataList)
        response.setJsonResult(body)
        return FetchDataResultBO.success(response)
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    static class DatasetRequest {
        // 根据实际API需求定义请求参数
        @NotBlank
        public String id;
        
        public String version;
        
        public String dataSetInternalID;  

        String getId() {
            return id;
        }
        
        void setId(String id) {
            this.id = id;
        }
        
        String getVersion() {
            return version;
        }
        
        void setVersion(String version) {
            this.version = version;
        }
        
        String getDataSetInternalID() { 
            return dataSetInternalID;
        }
        
        void setDataSetInternalID(String dataSetInternalID) { 
            this.dataSetInternalID = dataSetInternalID;
        }
    }
}
